from fastapi import Request, HTTPException, Depends
from sqlalchemy.orm import Session
from datetime import datetime
from app.database import get_db
from app.models.session import Session as SessionModel
from app.models.user import User
from loguru import logger

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
    user: User = Depends(get_current_user)
) -> User:
    if not user.is_admin:
        logger.warning(f"Accès admin refusé | user_id={user.id} | email={user.email}")
        raise HTTPException(status_code=403, detail="Accès refusé")
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