import time

from fastapi import APIRouter, Depends, Request
from sqlalchemy import and_
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models.product import Product
from app.schemas.product import ProductResponse
from app.services.settings_service import (
    DEFAULT_ANNOUNCEMENT,
    DEFAULT_PAYMENT_METHODS,
    get_setting,
)

router = APIRouter(prefix="/site", tags=["Site"])

# ── Cache TTL simple (thread-safe en lecture, suffisant pour un process unique) ──
_CACHE: dict = {}
_CACHE_TTL = 300  # secondes


def _cache_get(key: str):
    entry = _CACHE.get(key)
    if entry and time.monotonic() < entry["exp"]:
        return entry["value"]
    return None


def _cache_set(key: str, value, ttl: int = _CACHE_TTL):
    _CACHE[key] = {"value": value, "exp": time.monotonic() + ttl}


def _cache_invalidate(key: str):
    _CACHE.pop(key, None)


# ── Helpers ──────────────────────────────────────────────────────────────────

def _build_site_data(db: Session) -> dict:
    """Construit le payload complet des paramètres publics (mis en cache)."""
    maintenance     = get_setting(db, "maintenance_mode", False)
    announcement    = get_setting(db, "announcement", DEFAULT_ANNOUNCEMENT)
    payment_methods = get_setting(db, "payment_methods", DEFAULT_PAYMENT_METHODS)
    featured_ids    = get_setting(db, "featured_product_ids", [])

    # Ne retourner que les méthodes actives au frontend
    active_methods = [m for m in payment_methods if m.get("enabled", True)]

    # Sécurise le typage (toujours une liste d'int)
    if not isinstance(featured_ids, list):
        featured_ids = []
    featured_ids = [
        int(x)
        for x in featured_ids
        if isinstance(x, (int, str)) and str(x).lstrip("-").isdigit()
    ]

    return {
        "maintenance":          bool(maintenance),
        "announcement":         announcement if isinstance(announcement, dict) else DEFAULT_ANNOUNCEMENT,
        "payment_methods":      active_methods,
        "featured_product_ids": featured_ids,
    }


def _base_url(request: Request) -> str:
    return str(request.base_url).rstrip("/")


# ── Routes ───────────────────────────────────────────────────────────────────

@router.get("/init")
def site_init(db: Session = Depends(get_db)):
    """
    ✅ ENDPOINT UNIFIÉ — remplace :
        GET /site/settings
        GET /orders/payment-methods
    Le frontend n'a plus besoin que d'UN seul appel au démarrage.
    Résultat mis en cache 5 min pour éviter les hits DB répétés.
    """
    cached = _cache_get("site_init")
    if cached is not None:
        return cached

    data = _build_site_data(db)
    _cache_set("site_init", data)
    return data


@router.get("/settings")
def public_settings(db: Session = Depends(get_db)):
    """
    Rétro-compatibilité — utilise le même cache que /init.
    Retourne maintenance + announcement uniquement (sans payment_methods).
    """
    cached = _cache_get("site_init")
    if cached is not None:
        return {
            "maintenance":  cached["maintenance"],
            "announcement": cached["announcement"],
        }

    maintenance  = get_setting(db, "maintenance_mode", False)
    announcement = get_setting(db, "announcement", DEFAULT_ANNOUNCEMENT)

    return {
        "maintenance":  bool(maintenance),
        "announcement": announcement if isinstance(announcement, dict) else DEFAULT_ANNOUNCEMENT,
    }


@router.get("/home")
def site_home(request: Request, db: Session = Depends(get_db)):
    """
    Endpoint optimisé pour la page d'accueil :
    settings publics + produits "featured" résolus, en une seule réponse.
    Élimine la cascade Home côté frontend (plus besoin de useQuery imbriqué).
    Mis en cache 5 min comme /init.
    """
    cached = _cache_get("site_home")
    if cached is not None:
        return cached

    base = _build_site_data(db)
    featured_ids = base["featured_product_ids"]
    base_url = _base_url(request)

    products: list[dict] = []
    if featured_ids:
        rows = (
            db.query(Product)
            .options(joinedload(Product.category))  # pour le fallback image catégorie
            .filter(and_(Product.id.in_(featured_ids), Product.is_active == True))
            .all()
        )
        by_id = {p.id: p for p in rows}
        # Respect de l'ordre choisi dans l'admin, limité à 8
        ordered = [by_id[i] for i in featured_ids if i in by_id][:8]
        products = [
            ProductResponse.from_orm_with_url(
                p,
                base_url=base_url,
                fallback_image=(
                    f"{base_url}/uploads/{p.category.image_path}"
                    if p.category and p.category.image_path
                    else None
                ),
            ).model_dump()
            for p in ordered
        ]

    payload = {**base, "featured_products": products}
    _cache_set("site_home", payload)
    return payload


# ── Exposition de l'invalidation du cache (à appeler depuis le panel) ────────
# Dans panel.py, après chaque POST sur /panel/settings/*, appeler :
#   from app.routes.site import invalidate_site_cache
#   invalidate_site_cache()

def invalidate_site_cache():
    """Invalide le cache dès qu'un paramètre est modifié via le panel admin."""
    _cache_invalidate("site_init")
    _cache_invalidate("site_home")
