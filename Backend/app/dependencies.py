from fastapi import Request, HTTPException, Depends
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from app.database import get_db
from app.models.session import Session as SessionModel
from app.models.user import User
from loguru import logger

SESSION_TTL_DAYS = 7
# On renouvelle si la session expire dans moins de 24h —
# tant que l'admin touche le panel une fois par jour, il n'est jamais éjecté.
ADMIN_RENEW_THRESHOLD_HOURS = 24


def get_current_user(
    request: Request,
    db: Session = Depends(get_db)
) -> User:
    session_id = request.cookies.get("session_id")

    if not session_id:
        logger.warning(f"Accès non autorisé | pas de cookie | ip={request.client.host} | route={request.url.path}")
        raise HTTPException(status_code=401, detail="Non connecté")

    session = db.query(SessionModel).filter(
        SessionModel.id == session_id,
        SessionModel.expires_at > datetime.utcnow()
    ).first()

    if not session:
        logger.warning(f"Accès non autorisé | session invalide ou expirée | ip={request.client.host} | route={request.url.path}")
        raise HTTPException(status_code=401, detail="Session expirée")

    user = db.query(User).filter(User.id == session.user_id).first()

    if not user:
        logger.error(f"Session orpheline | user_id={session.user_id} introuvable | ip={request.client.host}")
        raise HTTPException(status_code=401, detail="Utilisateur introuvable")

    return user


def get_admin_user(
    request: Request,
    db: Session = Depends(get_db)
) -> User:
    """
    Comme get_current_user mais avec sliding window sur la session admin :
    si elle expire dans moins de ADMIN_RENEW_THRESHOLD_HOURS, on la prolonge
    silencieusement de SESSION_TTL_DAYS. Les sessions user classiques ne sont
    pas touchées.
    """
    session_id = request.cookies.get("session_id")

    if not session_id:
        logger.warning(f"Accès admin non autorisé | pas de cookie | ip={request.client.host} | route={request.url.path}")
        raise HTTPException(status_code=401, detail="Non connecté")

    session = db.query(SessionModel).filter(
        SessionModel.id == session_id,
        SessionModel.expires_at > datetime.utcnow()
    ).first()

    if not session:
        logger.warning(f"Accès admin non autorisé | session invalide ou expirée | ip={request.client.host} | route={request.url.path}")
        raise HTTPException(status_code=401, detail="Session expirée")

    user = db.query(User).filter(User.id == session.user_id).first()

    if not user:
        logger.error(f"Session orpheline (admin) | user_id={session.user_id} introuvable | ip={request.client.host}")
        raise HTTPException(status_code=401, detail="Utilisateur introuvable")

    if not user.is_admin:
        logger.warning(f"Accès admin refusé | user_id={user.id} | email={user.email}")
        raise HTTPException(status_code=403, detail="Accès refusé")

    # ── Sliding window ────────────────────────────────────────────────────────
    threshold = datetime.utcnow() + timedelta(hours=ADMIN_RENEW_THRESHOLD_HOURS)
    if session.expires_at <= threshold:
        session.expires_at = datetime.utcnow() + timedelta(days=SESSION_TTL_DAYS)
        try:
            db.commit()
            logger.info(f"Session admin renouvelée | user_id={user.id} | nouvelle expiration={session.expires_at}")
        except Exception as e:
            db.rollback()
            logger.error(f"Échec renouvellement session admin | user_id={user.id} | {e}")
            # Non bloquant : on laisse passer, la session est encore valide

    return user


def get_verified_user(
    user: User = Depends(get_current_user)
) -> User:
    if not user.is_verified:
        raise HTTPException(
            status_code=403,
            detail="Veuillez vérifier votre email avant de commander"
        )
    return user
