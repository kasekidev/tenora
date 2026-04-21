from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile, File
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.import_request import ImportRequest, ImportStatus
from app.models.product import Category
from app.models.user import User
from app.schemas.import_request import ImportRequestCreate, ImportRequestResponse, ImportStatusUpdate
from app.services.file_validator import validate_image_bytes
from app.services.storage_service import upload_file as storage_upload
from app.dependencies import get_current_user, get_admin_user, get_verified_user
from app.config import settings
from app.services.rate_limiter import limiter
from loguru import logger
import uuid
import urllib.parse

router = APIRouter()


@router.post("/", response_model=ImportRequestResponse)
@limiter.limit("10/minute")
def create_import_request(
    data: ImportRequestCreate,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(get_verified_user)
):
    category = db.query(Category).filter(
        Category.id == data.category_id,
        Category.is_active == True
    ).first()
    if not category:
        raise HTTPException(status_code=404, detail="Catégorie introuvable")

    parent = category
    if category.parent_id:
        parent = db.query(Category).filter(Category.id == category.parent_id).first()

    if parent.service_type != "import_export":
        raise HTTPException(status_code=400, detail="Cette catégorie n'est pas un service import")

    import_req = ImportRequest(
        user_id=user.id,
        category_id=data.category_id,
        article_url=data.article_url,
        article_description=data.article_description
    )
    db.add(import_req)
    db.commit()
    db.refresh(import_req)

    logger.success(f"Demande import créée | id={import_req.id} | category_id={data.category_id} | user_id={user.id}")
    return import_req


@router.post("/{request_id}/screenshot", response_model=ImportRequestResponse)
@limiter.limit("10/minute")
def upload_screenshot(
    request_id: int,
    request: Request,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    import_req = db.query(ImportRequest).filter(
        ImportRequest.id == request_id,
        ImportRequest.user_id == user.id
    ).first()
    if not import_req:
        raise HTTPException(status_code=404, detail="Demande introuvable")

    if import_req.status != ImportStatus.pending:
        raise HTTPException(status_code=400, detail="Cette demande ne peut plus être modifiée")

    # Vérification taille avant lecture complète
    file.file.seek(0, 2)
    file_size = file.file.tell()
    file.file.seek(0)
    if file_size > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Fichier trop lourd, maximum 5MB")

    file_data = file.file.read()

    allowed_types = ["image/jpeg", "image/png", "image/webp"]
    if file.content_type not in allowed_types:
        logger.warning(f"Upload import refusé | content-type invalide | content_type={file.content_type} | user_id={user.id}")
        raise HTTPException(status_code=400, detail="Seules les images JPG, PNG et WEBP sont acceptées")

    if not validate_image_bytes(file_data):
        logger.warning(f"Upload import refusé | magic bytes invalides | user_id={user.id} | request_id={request_id}")
        raise HTTPException(status_code=400, detail="Le fichier ne correspond pas à une image valide")

    extension = (file.filename or "").split(".")[-1].lower()
    if extension not in ("jpg", "jpeg", "png", "webp"):
        extension = "jpg"

    # ── Upload via storage_service (R2 ou local selon l'env) ─────────────────
    stored_path = storage_upload(file_data, extension, "imports")

    import_req.screenshot_path = stored_path
    db.commit()
    db.refresh(import_req)

    logger.success(f"Screenshot import uploadé | request_id={request_id} | user_id={user.id} | stored={stored_path}")
    return import_req


@router.get("/{request_id}/whatsapp")
def redirect_to_whatsapp(
    request_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    import_req = db.query(ImportRequest).filter(
        ImportRequest.id == request_id,
        ImportRequest.user_id == user.id
    ).first()
    if not import_req:
        raise HTTPException(status_code=404, detail="Demande introuvable")

    if not import_req.screenshot_path:
        raise HTTPException(status_code=400, detail="Veuillez d'abord uploader le screenshot de l'article")

    category = db.query(Category).filter(Category.id == import_req.category_id).first()

    message = (
        f"Bonjour {settings.APP_NAME} !\n\n"
        f"Je souhaite commander depuis {category.name.upper()}\n\n"
        f"Lien article : {import_req.article_url}\n"
        f"Description : {import_req.article_description or 'Non précisée'}\n"
        f"Référence : #{import_req.id}\n\n"
        f"Merci de joindre le screenshot de l'article à ce message.\n\n"
        f"Merci !"
    )

    encoded_message = urllib.parse.quote(message)
    whatsapp_url = f"https://wa.me/{settings.WHATSAPP_NUMBER}?text={encoded_message}"

    import_req.status = ImportStatus.contacted
    db.commit()

    logger.info(f"Redirection WhatsApp | request_id={request_id} | user_id={user.id}")
    return RedirectResponse(url=whatsapp_url)


@router.get("/my", response_model=list[ImportRequestResponse])
def get_my_requests(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    return db.query(ImportRequest).filter(
        ImportRequest.user_id == user.id
    ).order_by(ImportRequest.created_at.desc()).all()


@router.get("/admin/all", response_model=list[ImportRequestResponse])
def get_all_requests(
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    return db.query(ImportRequest).order_by(ImportRequest.created_at.desc()).all()


@router.put("/admin/{request_id}", response_model=ImportRequestResponse)
def update_request_status(
    request_id: int,
    data: ImportStatusUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    import_req = db.query(ImportRequest).filter(ImportRequest.id == request_id).first()
    if not import_req:
        raise HTTPException(status_code=404, detail="Demande introuvable")

    old_status = import_req.status
    import_req.status = data.status
    import_req.staff_note = data.staff_note
    db.commit()
    db.refresh(import_req)

    logger.success(f"Statut import mis à jour | id={request_id} | {old_status} → {data.status} | admin_id={admin.id}")
    return import_req
