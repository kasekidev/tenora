
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.settings_service import (
    get_setting,
    DEFAULT_PAYMENT_METHODS,
    DEFAULT_ANNOUNCEMENT,
)
import time

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
    maintenance    = get_setting(db, "maintenance_mode", False)
    announcement   = get_setting(db, "announcement", DEFAULT_ANNOUNCEMENT)
    payment_methods = get_setting(db, "payment_methods", DEFAULT_PAYMENT_METHODS)

    # Ne retourner que les méthodes actives au frontend
    active_methods = [m for m in payment_methods if m.get("enabled", True)]

    return {
        "maintenance":      bool(maintenance),
        "announcement":     announcement if isinstance(announcement, dict) else DEFAULT_ANNOUNCEMENT,
        "payment_methods":  active_methods,
    }


# ── Routes ───────────────────────────────────────────────────────────────────

@router.get("/init")
def site_init(db: Session = Depends(get_db)):
    """
    ✅ ENDPOINT UNIFIÉ — remplace :
        GET /site/settings
        GET /orders/payment-methods
    Le frontend n'a plus besoin que d'UN seul appel au démarrage.
    Résultat mis en cache 60 s pour éviter les hits DB répétés.
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


# ── Exposition de l'invalidation du cache (à appeler depuis le panel) ────────
# Dans panel.py, après chaque POST sur /panel/settings/*, appeler :
#   from app.routes.site import invalidate_site_cache
#   invalidate_site_cache()

def invalidate_site_cache():
    """Invalide le cache dès qu'un paramètre est modifié via le panel admin."""
    _cache_invalidate("site_init")