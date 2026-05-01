# app/routes/order_claim.py
# ============================================================================
# SYSTÈME DE CLAIM / VERROU SUR LES COMMANDES (panel admin)
# ----------------------------------------------------------------------------
# - Hard lock strict : seul l'admin qui a claim peut MODIFIER la commande.
# - Auto-expiration : claim expiré après 30 min d'inactivité.
# - Auto-release : libéré quand statut devient terminal (completed/rejected/refunded).
# ============================================================================

from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_admin_user  # ← CORRIGÉ : dependencies, pas routes.auth
from app.models.order import Order
from app.models.user import User

router = APIRouter()


# === Constantes =============================================================
CLAIM_TTL = timedelta(minutes=30)
TERMINAL_STATUSES = {"completed", "rejected", "refunded"}


def _utcnow() -> datetime:
    """UTC naïf, cohérent avec le reste de la base (DateTime sans tz)."""
    return datetime.utcnow()


def _iso_utc(dt: datetime) -> str:
    """ISO 8601 avec suffixe 'Z' explicite pour que JS new Date() parse en UTC."""
    # Les datetimes stockés sont naïfs et représentent de l'UTC -> on suffixe 'Z'.
    if dt.tzinfo is None:
        return dt.replace(microsecond=0).isoformat() + "Z"
    return dt.astimezone(timezone.utc).replace(microsecond=0, tzinfo=None).isoformat() + "Z"


# === Helpers ================================================================
def _is_claim_active(order: Order) -> bool:
    if order.claimed_by_id is None or order.claimed_at is None:
        return False
    return _utcnow() - order.claimed_at < CLAIM_TTL


def _auto_expire(order: Order, db: Session) -> None:
    """Libère silencieusement un claim expiré."""
    if order.claimed_by_id is not None and not _is_claim_active(order):
        order.claimed_by_id = None
        order.claimed_at = None
        db.commit()
        db.refresh(order)


def serialize_claim(order: Order) -> dict:
    """Forme stable renvoyée au front. Exposée publiquement (pas de _ prefix)."""
    if not _is_claim_active(order):
        return {
            "claimed_by_id": None,
            "claimed_by_username": None,
            "claimed_by_email": None,
            "claimed_at": None,
            "expires_at": None,
        }
    user: User | None = order.claimed_by
    expires_at = order.claimed_at + CLAIM_TTL
    return {
        "claimed_by_id": order.claimed_by_id,
        "claimed_by_username": user.username if user else None,
        "claimed_by_email": user.email if user else None,
        "claimed_at": _iso_utc(order.claimed_at),
        "expires_at": _iso_utc(expires_at),
    }


# Alias rétrocompat (au cas où d'autres modules importent l'ancien nom)
_serialize_claim = serialize_claim


def ensure_can_edit_order(order: Order, admin: User, db: Session) -> None:
    """Lève 423 LOCKED si la commande est claim par un autre admin."""
    _auto_expire(order, db)
    if order.claimed_by_id is not None and order.claimed_by_id != admin.id:
        owner = order.claimed_by
        owner_label = (owner.username or owner.email) if owner else "un autre admin"
        raise HTTPException(
            status_code=status.HTTP_423_LOCKED,
            detail=f"Commande verrouillée par {owner_label}. Demande-lui de la libérer.",
        )


def release_claim(order: Order) -> None:
    """Libère le verrou (à appeler après passage en statut terminal)."""
    order.claimed_by_id = None
    order.claimed_at = None


# === Endpoints ==============================================================
@router.post("/orders/{order_id}/claim")
def claim_order(
    order_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user),
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(404, "Commande introuvable")

    _auto_expire(order, db)

    if order.claimed_by_id is not None and order.claimed_by_id != admin.id:
        owner = order.claimed_by
        owner_label = (owner.username or owner.email) if owner else "un autre admin"
        raise HTTPException(
            status_code=status.HTTP_423_LOCKED,
            detail=f"Déjà verrouillée par {owner_label}.",
        )

    if order.status.value in TERMINAL_STATUSES:
        raise HTTPException(409, "Cette commande est terminée, aucun verrou nécessaire.")

    order.claimed_by_id = admin.id
    order.claimed_at = _utcnow()
    db.commit()
    db.refresh(order)
    return {"ok": True, "claim": serialize_claim(order)}


@router.post("/orders/{order_id}/release")
def release_order(
    order_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user),
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(404, "Commande introuvable")

    _auto_expire(order, db)

    if order.claimed_by_id is None:
        return {"ok": True, "claim": serialize_claim(order)}

    if order.claimed_by_id != admin.id:
        raise HTTPException(403, "Seul l'admin qui a verrouillé peut libérer.")

    release_claim(order)
    db.commit()
    db.refresh(order)
    return {"ok": True, "claim": serialize_claim(order)}


@router.get("/orders/{order_id}/claim")
def get_claim_status(
    order_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user),
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(404, "Commande introuvable")
    _auto_expire(order, db)
    return {"claim": serialize_claim(order), "is_mine": order.claimed_by_id == admin.id}


# ── Compat : ancien front déployé qui faisait DELETE /panel/orders/{id}/claim
# pour libérer. Évite les 405 dans les logs et libère proprement.
@router.delete("/orders/{order_id}/claim")
def delete_claim(
    order_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user),
):
    return release_order(order_id, db=db, admin=admin)
