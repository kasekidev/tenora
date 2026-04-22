from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, case, and_
from sqlalchemy.exc import IntegrityError
from app.database import get_db
from app.models.user import User
from app.models.product import Product, Category
from app.models.order import Order, OrderStatus
from app.models.import_request import ImportRequest
from app.dependencies import get_admin_user
from app.config import settings
from app.services.storage_service import (
    upload_file as storage_upload,
    delete_file as storage_delete,
)
from app.services.settings_service import (
    get_setting, set_setting,
    DEFAULT_PAYMENT_METHODS, DEFAULT_ANNOUNCEMENT,
)
from app.routes.site import invalidate_site_cache
from loguru import logger
from datetime import datetime, timedelta
from collections import defaultdict
from pydantic import BaseModel
import json, csv, io, re

try:
    from PIL import Image as _PilImage
    _HAS_PIL = True
except ImportError:
    _HAS_PIL = False

router = APIRouter(prefix="/panel", tags=["Admin Panel"])

ALLOWED_EXT    = {"jpg", "jpeg", "png", "webp"}
ORDER_STATUSES  = ["pending", "processing", "completed", "rejected", "refunded"]
IMPORT_STATUSES = ["pending", "contacted", "in_progress", "delivered", "cancelled"]


# ─── SCHEMAS PYDANTIC ─────────────────────────────────────────────────────────

class OrderStatusUpdate(BaseModel):
    status: str
    staff_note: str = ""

class ImportStatusUpdate(BaseModel):
    status: str
    staff_note: str = ""

class SettingMaintenance(BaseModel):
    enabled: bool

class SettingAnnouncement(BaseModel):
    enabled: bool
    text: str

class SettingWhatsapp(BaseModel):
    number: str

class PaymentMethodUpdate(BaseModel):
    id: str
    enabled: bool
    instructions: str = ""

class SettingPaymentMethods(BaseModel):
    methods: list[PaymentMethodUpdate]

class SettingFeaturedProducts(BaseModel):
    product_ids: list[int]

class CategoryCreate(BaseModel):
    name: str
    slug: str
    service_type: str = "none"
    parent_id: int | None = None
    is_active: bool = True

class CategoryUpdate(BaseModel):
    name: str | None = None
    slug: str | None = None
    service_type: str | None = None
    is_active: bool | None = None

class ProductCreate(BaseModel):
    category_id: int
    name: str
    description: str = ""
    price: float
    discount_percent: float = 0
    stock: int | None = None
    required_fields: list[dict] | None = None
    whatsapp_redirect: bool = False

class ProductUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    price: float | None = None
    discount_percent: float | None = None
    stock: int | None = None
    required_fields: list[dict] | None = None
    whatsapp_redirect: bool | None = None
    is_active: bool | None = None


# ─── HELPERS ──────────────────────────────────────────────────────────────────

def _compress_image(data: bytes, ext: str, max_px: int = 1400) -> bytes:
    if not _HAS_PIL:
        return data
    try:
        img = _PilImage.open(io.BytesIO(data))
        if ext in ("jpg", "jpeg") and img.mode not in ("RGB", "L"):
            img = img.convert("RGB")
        if max(img.size) > max_px:
            img.thumbnail((max_px, max_px), _PilImage.LANCZOS)
        buf = io.BytesIO()
        fmt_map = {"jpg": "JPEG", "jpeg": "JPEG", "png": "PNG", "webp": "WEBP"}
        fmt = fmt_map.get(ext, "JPEG")
        save_kwargs: dict = {"optimize": True}
        if fmt in ("JPEG", "WEBP"):
            save_kwargs["quality"] = 82
        img.save(buf, format=fmt, **save_kwargs)
        compressed = buf.getvalue()
        return compressed if len(compressed) < len(data) else data
    except Exception:
        return data


def save_image(file_data: bytes, filename: str, subfolder: str) -> str:
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    if ext not in ALLOWED_EXT:
        raise HTTPException(status_code=400, detail="Format non supporté — JPG, PNG ou WEBP uniquement.")
    if len(file_data) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image trop lourde (max 5 MB).")
    file_data = _compress_image(file_data, ext)
    # NOTE FRONTEND : l'upload vers R2 est bloquant côté backend (~1-3s selon
    # la taille). Afficher un loader dès le clic dans Vue.js et le retirer
    # uniquement à la résolution de la promesse fetch().
    return storage_upload(file_data, ext, subfolder)


# ─── DASHBOARD ────────────────────────────────────────────────────────────────

@router.get("/dashboard")
def get_dashboard(
    db:    Session = Depends(get_db),
    admin: User    = Depends(get_admin_user),
):
    """Stats globales pour la page d'accueil du panel.

    OPTIMISATION : toutes les métriques Order sont calculées en 1 seule requête
    SQL (au lieu de 6 aller-retours séparés) grâce à func.count/sum + case().
    User et Product nécessitent leurs propres requêtes (tables distinctes).
    """
    now   = datetime.utcnow()
    today = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week  = today - timedelta(days=7)

    # ── 1 requête unique pour toutes les métriques Order ──────────────────────
    order_stats = db.query(
        func.count(Order.id).label("total_orders"),
        func.count(
            case((Order.status == OrderStatus.processing, 1))
        ).label("pending_orders"),
        func.count(
            case((Order.status == OrderStatus.completed, 1))
        ).label("completed_orders"),
        func.coalesce(
            func.sum(case((Order.status == OrderStatus.completed, Order.total_price), else_=0)),
            0,
        ).label("total_revenue"),
        func.count(
            case((Order.created_at >= today, 1))
        ).label("orders_today"),
        func.coalesce(
            func.sum(case(
                (and_(Order.status == OrderStatus.completed, Order.created_at >= week),
                 Order.total_price),
                else_=0,
            )),
            0,
        ).label("revenue_week"),
    ).first()

    # ── Compteurs sur d'autres tables (inévitables) ───────────────────────────
    total_users    = db.query(func.count(User.id)).scalar() or 0
    total_products = db.query(func.count(Product.id)).filter(Product.is_active == True).scalar() or 0

    # ── Graphique 7 jours — déjà une seule requête groupée ───────────────────
    daily_orders = (
        db.query(
            func.date(Order.created_at).label("day"),
            func.count(Order.id).label("count"),
            func.sum(case((Order.status == OrderStatus.completed, Order.total_price), else_=0)).label("revenue"),
        )
        .filter(Order.created_at >= week)
        .group_by(func.date(Order.created_at))
        .order_by(func.date(Order.created_at))
        .all()
    )

    return {
        "stats": {
            "total_orders":     order_stats.total_orders,
            "pending_orders":   order_stats.pending_orders,
            "completed_orders": order_stats.completed_orders,
            "total_revenue":    float(order_stats.total_revenue),
            "orders_today":     order_stats.orders_today,
            "revenue_week":     float(order_stats.revenue_week),
            "total_users":      total_users,
            "total_products":   total_products,
        },
        "chart": [
            {"day": str(r.day), "orders": r.count, "revenue": float(r.revenue or 0)}
            for r in daily_orders
        ],
    }


# ─── COMMANDES ────────────────────────────────────────────────────────────────

@router.get("/orders")
def list_orders(
    status:   str | None = Query(None),
    page:     int        = Query(1, ge=1),
    per_page: int        = Query(50, ge=1, le=200),
    db:       Session    = Depends(get_db),
    admin:    User       = Depends(get_admin_user),
):
    """Liste paginée des commandes avec filtre optionnel par statut.

    OPTIMISATION N+1 : joinedload(Order.user) + joinedload(Order.product)
    récupère user et produit en une seule JOIN au lieu de 1 requête par ligne.
    """
    q = (
        db.query(Order)
        .options(joinedload(Order.user), joinedload(Order.product))
    )
    if status:
        try:
            q = q.filter(Order.status == OrderStatus[status])
        except KeyError:
            raise HTTPException(status_code=400, detail=f"Statut invalide : {status}")

    total  = q.count()
    orders = q.order_by(Order.created_at.desc()).offset((page - 1) * per_page).limit(per_page).all()

    return {
        "total":    total,
        "page":     page,
        "per_page": per_page,
        "orders": [
            {
                "id":              o.id,
                "user_id":         o.user_id,
                "user_email":      o.user.email if o.user else None,
                "product_id":      o.product_id,
                "product_name":    o.product.name if o.product else None,
                "quantity":        o.quantity,
                "total_price":     float(o.total_price),
                "status":          o.status.value,
                "payment_method":  o.payment_method,
                "customer_info":   o.customer_info,
                "screenshot_path": o.screenshot_path,
                "staff_note":      o.staff_note,
                "created_at":      o.created_at.isoformat(),
            }
            for o in orders
        ],
    }


@router.get("/orders/{order_id}")
def get_order(
    order_id: int,
    db:       Session = Depends(get_db),
    admin:    User    = Depends(get_admin_user),
):
    # joinedload évite 2 requêtes supplémentaires pour .user et .product
    order = (
        db.query(Order)
        .options(joinedload(Order.user), joinedload(Order.product))
        .filter(Order.id == order_id)
        .first()
    )
    if not order:
        raise HTTPException(status_code=404, detail="Commande introuvable.")
    return {
        "id":              order.id,
        "user_id":         order.user_id,
        "user_email":      order.user.email if order.user else None,
        "product_id":      order.product_id,
        "product_name":    order.product.name if order.product else None,
        "quantity":        order.quantity,
        "total_price":     float(order.total_price),
        "status":          order.status.value,
        "payment_method":  order.payment_method,
        "customer_info":   order.customer_info,
        "screenshot_path": order.screenshot_path,
        "staff_note":      order.staff_note,
        "created_at":      order.created_at.isoformat(),
    }


@router.put("/orders/{order_id}/status")
def update_order_status(
    order_id: int,
    data:     OrderStatusUpdate,
    db:       Session = Depends(get_db),
    admin:    User    = Depends(get_admin_user),
):
    """Met à jour le statut d'une commande et envoie l'email client.

    OPTIMISATION N+1 : joinedload charge user + product avec la commande,
    supprimant les 2 db.query() séparés qui existaient ensuite.
    """
    order = (
        db.query(Order)
        .options(joinedload(Order.user), joinedload(Order.product))
        .filter(Order.id == order_id)
        .first()
    )
    if not order:
        raise HTTPException(status_code=404, detail="Commande introuvable.")

    if data.status not in ORDER_STATUSES:
        raise HTTPException(status_code=400, detail=f"Statut invalide : {data.status}")

    from app.services.mail_service import send_order_completed, send_order_rejected, send_order_refunded

    # client et product déjà chargés via joinedload — aucune requête supplémentaire
    client  = order.user
    product = order.product

    old_status       = order.status
    order.status     = OrderStatus[data.status]
    order.staff_note = data.staff_note
    db.commit()
    db.refresh(order)

    if client and product and old_status != OrderStatus[data.status]:
        try:
            if data.status == "completed":
                send_order_completed(client.email, order.id, product.name, order.total_price)
        except Exception as e:
            logger.error(f"Échec envoi mail | order_id={order_id} | {e}")

    logger.success(f"Statut commande | order_id={order_id} | {old_status} → {data.status} | admin_id={admin.id}")
    return {"message": "Statut mis à jour.", "status": order.status.value}


@router.get("/orders/export/csv")
def export_orders_csv(
    status: str | None = Query(None),
    db:     Session    = Depends(get_db),
    admin:  User       = Depends(get_admin_user),
):
    """Export CSV de toutes les commandes (ou filtrées par statut).

    OPTIMISATION N+1 : joinedload évite N requêtes user/product lors du
    rendu de chaque ligne CSV.
    """
    q = (
        db.query(Order)
        .options(joinedload(Order.user), joinedload(Order.product))
    )
    if status:
        try:
            q = q.filter(Order.status == OrderStatus[status])
        except KeyError:
            raise HTTPException(status_code=400, detail=f"Statut invalide : {status}")
    orders = q.order_by(Order.created_at.desc()).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["ID", "Date", "Client", "Produit", "Qté", "Total (FCFA)", "Statut", "Paiement", "Note admin"])
    for o in orders:
        writer.writerow([
            o.id,
            o.created_at.strftime("%Y-%m-%d %H:%M"),
            o.user.email if o.user else o.user_id,
            o.product.name if o.product else o.product_id,
            o.quantity,
            int(o.total_price),
            o.status.value,
            o.payment_method,
            o.staff_note or "",
        ])

    output.seek(0)
    filename = f"commandes_{datetime.utcnow().strftime('%Y%m%d')}.csv"
    logger.info(f"Export CSV commandes | admin_id={admin.id} | rows={len(orders)}")
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode("utf-8-sig")),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


# ─── PRODUITS ─────────────────────────────────────────────────────────────────

@router.get("/products")
def list_products(
    db:    Session = Depends(get_db),
    admin: User    = Depends(get_admin_user),
):
    """Liste tous les produits.

    OPTIMISATION N+1 : joinedload(Product.category) charge le nom de la
    catégorie en une seule JOIN au lieu d'une requête par produit.
    """
    products = (
        db.query(Product)
        .options(joinedload(Product.category))
        .order_by(Product.created_at.desc())
        .all()
    )
    return [
        {
            "id":               p.id,
            "category_id":      p.category_id,
            "category_name":    p.category.name if p.category else None,
            "name":             p.name,
            "description":      p.description,
            "price":            float(p.price),
            "discount_percent": float(p.discount_percent or 0),
            "final_price":      float(p.final_price),
            "stock":            p.stock,
            "is_active":        p.is_active,
            "image_path":       p.image_path,
            "required_fields":  p.required_fields,
            "whatsapp_redirect": p.whatsapp_redirect,
            "created_at":       p.created_at.isoformat(),
        }
        for p in products
    ]


@router.post("/products", status_code=201)
def create_product(
    data:  ProductCreate,
    db:    Session = Depends(get_db),
    admin: User    = Depends(get_admin_user),
):
    cat = db.query(Category).filter(Category.id == data.category_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Catégorie introuvable.")

    p = Product(
        category_id=data.category_id,
        name=data.name,
        description=data.description,
        price=data.price,
        discount_percent=data.discount_percent,
        stock=data.stock,
        required_fields=[f if isinstance(f, dict) else f.dict() for f in (data.required_fields or [])],
        whatsapp_redirect=data.whatsapp_redirect,
    )
    db.add(p)
    db.commit()
    db.refresh(p)
    logger.success(f"Produit créé | id={p.id} | name={p.name} | admin_id={admin.id}")
    return {"message": "Produit créé.", "id": p.id}


@router.put("/products/{product_id}")
def update_product(
    product_id: int,
    data:       ProductUpdate,
    db:         Session = Depends(get_db),
    admin:      User    = Depends(get_admin_user),
):
    p = db.query(Product).filter(Product.id == product_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Produit introuvable.")

    for field, value in data.model_dump(exclude_none=True).items():
        setattr(p, field, value)

    db.commit()
    db.refresh(p)
    logger.info(f"Produit mis à jour | id={product_id} | admin_id={admin.id}")
    return {"message": "Produit mis à jour."}


@router.post("/products/{product_id}/image")
async def upload_product_image(
    product_id: int,
    file:       UploadFile = File(...),
    db:         Session    = Depends(get_db),
    admin:      User       = Depends(get_admin_user),
):
    p = db.query(Product).filter(Product.id == product_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Produit introuvable.")

    storage_delete(p.image_path)
    file_data    = await file.read()
    p.image_path = save_image(file_data, file.filename or "image.jpg", "products")
    db.commit()
    logger.info(f"Image produit uploadée | id={product_id} | admin_id={admin.id}")
    return {"message": "Image mise à jour.", "image_path": p.image_path}


@router.delete("/products/{product_id}/image")
def delete_product_image(
    product_id: int,
    db:         Session = Depends(get_db),
    admin:      User    = Depends(get_admin_user),
):
    p = db.query(Product).filter(Product.id == product_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Produit introuvable.")
    storage_delete(p.image_path)
    p.image_path = None
    db.commit()
    return {"message": "Image supprimée."}


@router.delete("/products/{product_id}")
def delete_product(
    product_id: int,
    db:         Session = Depends(get_db),
    admin:      User    = Depends(get_admin_user),
):
    p = db.query(Product).filter(Product.id == product_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Produit introuvable.")
    storage_delete(p.image_path)
    db.delete(p)
    db.commit()
    logger.info(f"Produit supprimé | id={product_id} | admin_id={admin.id}")
    return {"message": "Produit supprimé."}


# ─── CATÉGORIES ───────────────────────────────────────────────────────────────

@router.get("/categories")
def list_categories(
    db:    Session = Depends(get_db),
    admin: User    = Depends(get_admin_user),
):
    cats = db.query(Category).order_by(Category.name).all()
    return [
        {
            "id":           c.id,
            "name":         c.name,
            "slug":         c.slug,
            "service_type": c.service_type,
            "parent_id":    c.parent_id,
            "is_active":    c.is_active,
            "image_path":   c.image_path,
        }
        for c in cats
    ]


@router.post("/categories", status_code=201)
def create_category(
    data:  CategoryCreate,
    db:    Session = Depends(get_db),
    admin: User    = Depends(get_admin_user),
):
    try:
        cat = Category(**data.model_dump())
        db.add(cat)
        db.commit()
        db.refresh(cat)
        logger.success(f"Catégorie créée | id={cat.id} | name={cat.name} | admin_id={admin.id}")
        return {"message": "Catégorie créée.", "id": cat.id}
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Ce slug existe déjà.")


@router.put("/categories/{category_id}")
def update_category(
    category_id: int,
    data:        CategoryUpdate,
    db:          Session = Depends(get_db),
    admin:       User    = Depends(get_admin_user),
):
    cat = db.query(Category).filter(Category.id == category_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Catégorie introuvable.")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(cat, field, value)
    db.commit()
    return {"message": "Catégorie mise à jour."}


@router.post("/categories/{category_id}/image")
async def upload_category_image(
    category_id: int,
    file:        UploadFile = File(...),
    db:          Session    = Depends(get_db),
    admin:       User       = Depends(get_admin_user),
):
    cat = db.query(Category).filter(Category.id == category_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Catégorie introuvable.")

    storage_delete(cat.image_path)
    file_data      = await file.read()
    cat.image_path = save_image(file_data, file.filename or "image.jpg", "categories")
    db.commit()
    return {"message": "Image mise à jour.", "image_path": cat.image_path}


@router.delete("/categories/{category_id}/image")
def delete_category_image(
    category_id: int,
    db:          Session = Depends(get_db),
    admin:       User    = Depends(get_admin_user),
):
    cat = db.query(Category).filter(Category.id == category_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Catégorie introuvable.")
    storage_delete(cat.image_path)
    cat.image_path = None
    db.commit()
    return {"message": "Image supprimée."}


@router.delete("/categories/{category_id}")
def delete_category(
    category_id: int,
    db:          Session = Depends(get_db),
    admin:       User    = Depends(get_admin_user),
):
    cat = db.query(Category).filter(Category.id == category_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Catégorie introuvable.")
    storage_delete(cat.image_path)
    db.delete(cat)
    db.commit()
    logger.info(f"Catégorie supprimée | id={category_id} | admin_id={admin.id}")
    return {"message": "Catégorie supprimée."}


# ─── UTILISATEURS ─────────────────────────────────────────────────────────────

@router.get("/users")
def list_users(
    page:     int     = Query(1, ge=1),
    per_page: int     = Query(50, ge=1, le=200),
    q:        str | None = Query(None),
    db:       Session = Depends(get_db),
    admin:    User    = Depends(get_admin_user),
):
    query = db.query(User)
    if q:
        query = query.filter(User.email.ilike(f"%{q}%"))
    total = query.count()
    users = query.order_by(User.created_at.desc()).offset((page - 1) * per_page).limit(per_page).all()
    return {
        "total":    total,
        "page":     page,
        "per_page": per_page,
        "users": [
            {
                "id":          u.id,
                "email":       u.email,
                "is_admin":    u.is_admin,
                "is_verified": u.is_verified,
                "created_at":  u.created_at.isoformat(),
            }
            for u in users
        ],
    }


@router.put("/users/{user_id}/verify")
def verify_user(
    user_id: int,
    db:      Session = Depends(get_db),
    admin:   User    = Depends(get_admin_user),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable.")
    user.is_verified = True
    db.commit()
    logger.info(f"Utilisateur vérifié manuellement | user_id={user_id} | admin_id={admin.id}")
    return {"message": "Utilisateur vérifié."}


@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    db:      Session = Depends(get_db),
    admin:   User    = Depends(get_admin_user),
):
    if user_id == admin.id:
        raise HTTPException(status_code=400, detail="Vous ne pouvez pas supprimer votre propre compte.")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable.")
    db.delete(user)
    db.commit()
    logger.info(f"Utilisateur supprimé | user_id={user_id} | admin_id={admin.id}")
    return {"message": "Utilisateur supprimé."}


# ─── IMPORT REQUESTS ──────────────────────────────────────────────────────────

@router.get("/imports")
def list_imports(
    status: str | None = Query(None),
    db:     Session    = Depends(get_db),
    admin:  User       = Depends(get_admin_user),
):
    """Liste les demandes d'import.

    OPTIMISATION N+1 : joinedload(ImportRequest.user) charge les emails
    en une seule JOIN au lieu d'une requête par ligne.
    """
    q = (
        db.query(ImportRequest)
        .options(joinedload(ImportRequest.user))
    )
    if status:
        q = q.filter(ImportRequest.status == status)
    imports = q.order_by(ImportRequest.created_at.desc()).all()
    return [
        {
            "id":         r.id,
            "user_id":    r.user_id,
            "user_email": r.user.email if r.user else None,
            "details":    r.details,
            "status":     r.status,
            "staff_note": r.staff_note,
            "created_at": r.created_at.isoformat(),
        }
        for r in imports
    ]


@router.put("/imports/{import_id}/status")
def update_import_status(
    import_id: int,
    data:      ImportStatusUpdate,
    db:        Session = Depends(get_db),
    admin:     User    = Depends(get_admin_user),
):
    if data.status not in IMPORT_STATUSES:
        raise HTTPException(status_code=400, detail=f"Statut invalide : {data.status}")
    req = db.query(ImportRequest).filter(ImportRequest.id == import_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Demande introuvable.")
    req.status     = data.status
    req.staff_note = data.staff_note
    db.commit()
    logger.info(f"Import request mis à jour | id={import_id} | status={data.status} | admin_id={admin.id}")
    return {"message": "Statut mis à jour."}


# ─── PARAMÈTRES ───────────────────────────────────────────────────────────────

@router.get("/settings")
def get_settings(
    db:    Session = Depends(get_db),
    admin: User    = Depends(get_admin_user),
):
    """Retourne tous les paramètres éditables du panel."""
    maintenance     = get_setting(db, "maintenance_mode", False)
    announcement    = get_setting(db, "announcement", DEFAULT_ANNOUNCEMENT)
    payment_methods = get_setting(db, "payment_methods", DEFAULT_PAYMENT_METHODS)
    whatsapp_number = get_setting(db, "whatsapp_number", settings.WHATSAPP_NUMBER or "")
    featured_ids   = get_setting(db, "featured_product_ids", [])
    if not isinstance(featured_ids, list):
        featured_ids = []
    return {
        "maintenance":          bool(maintenance),
        "announcement":         announcement,
        "payment_methods":      payment_methods,
        "whatsapp_number":      whatsapp_number,
        "featured_product_ids": featured_ids,
    }


@router.put("/settings/maintenance")
def update_maintenance(
    data:  SettingMaintenance,
    db:    Session = Depends(get_db),
    admin: User    = Depends(get_admin_user),
):
    set_setting(db, "maintenance_mode", data.enabled)
    invalidate_site_cache()
    label = "activé" if data.enabled else "désactivé"
    logger.info(f"Mode maintenance {label} | admin_id={admin.id}")
    return {"message": f"Mode maintenance {label}."}


@router.put("/settings/announcement")
def update_announcement(
    data:  SettingAnnouncement,
    db:    Session = Depends(get_db),
    admin: User    = Depends(get_admin_user),
):
    enabled = data.enabled and bool(data.text.strip())
    set_setting(db, "announcement", {"enabled": enabled, "text": data.text.strip()})
    invalidate_site_cache()
    logger.info(f"Annonce mise à jour | admin_id={admin.id}")
    return {"message": "Annonce sauvegardée."}


@router.put("/settings/whatsapp")
def update_whatsapp(
    data:  SettingWhatsapp,
    db:    Session = Depends(get_db),
    admin: User    = Depends(get_admin_user),
):
    number = re.sub(r'[^\d]', '', data.number.strip())
    if not number:
        raise HTTPException(status_code=400, detail="Numéro invalide — chiffres uniquement.")
    set_setting(db, "whatsapp_number", number)
    invalidate_site_cache()
    logger.info(f"Numéro WhatsApp mis à jour | number={number} | admin_id={admin.id}")
    return {"message": f"Numéro mis à jour : {number}"}


@router.put("/settings/payment-methods")
def update_payment_methods(
    data:  SettingPaymentMethods,
    db:    Session = Depends(get_db),
    admin: User    = Depends(get_admin_user),
):
    current = get_setting(db, "payment_methods", DEFAULT_PAYMENT_METHODS)
    updates = {m.id: m for m in data.methods}
    updated = [
        {
            **m,
            "enabled":      updates[m["id"]].enabled      if m["id"] in updates else m.get("enabled", True),
            "instructions": updates[m["id"]].instructions if m["id"] in updates else m.get("instructions", ""),
        }
        for m in current
    ]
    set_setting(db, "payment_methods", updated)
    invalidate_site_cache()
    logger.info(f"Modes de paiement mis à jour | admin_id={admin.id}")
    return {"message": "Modes de paiement sauvegardés.", "methods": updated}


# ─── PRODUITS MIS EN AVANT (HOT NOW) ──────────────────────────────────────────

@router.get("/settings/featured-products")
def get_featured_products(
    db:    Session = Depends(get_db),
    admin: User    = Depends(get_admin_user),
):
    """Retourne la liste ordonnée des IDs de produits mis en avant + détails."""
    raw = get_setting(db, "featured_product_ids", [])
    if not isinstance(raw, list):
        raw = []
    ids = [int(x) for x in raw if isinstance(x, (int, str)) and str(x).lstrip("-").isdigit()]

    products = []
    if ids:
        rows = db.query(Product).filter(Product.id.in_(ids)).all()
        rows_by_id = {p.id: p for p in rows}
        for pid in ids:
            p = rows_by_id.get(pid)
            if p:
                products.append({
                    "id":         p.id,
                    "name":       p.name,
                    "price":      float(p.price),
                    "is_active":  p.is_active,
                    "stock":      p.stock,
                })
    return {"product_ids": ids, "products": products}


@router.put("/settings/featured-products")
def update_featured_products(
    data:  SettingFeaturedProducts,
    db:    Session = Depends(get_db),
    admin: User    = Depends(get_admin_user),
):
    """
    Met à jour la liste ordonnée des produits mis en avant sur la home (Hot Now).
    L'ordre du tableau est préservé. Limite à 12 produits.
    """
    # Dédoublonne en préservant l'ordre
    seen = set()
    cleaned: list[int] = []
    for pid in data.product_ids:
        if pid in seen:
            continue
        seen.add(pid)
        cleaned.append(int(pid))

    if len(cleaned) > 12:
        raise HTTPException(status_code=400, detail="Maximum 12 produits Hot Now.")

    if cleaned:
        existing = {
            row.id for row in db.query(Product.id).filter(Product.id.in_(cleaned)).all()
        }
        missing = [pid for pid in cleaned if pid not in existing]
        if missing:
            raise HTTPException(
                status_code=400,
                detail=f"Produit(s) introuvable(s) : {missing}",
            )

    set_setting(db, "featured_product_ids", cleaned)
    invalidate_site_cache()
    logger.info(f"Hot Now mis à jour | ids={cleaned} | admin_id={admin.id}")
    return {
        "message":     f"{len(cleaned)} produit(s) en Hot Now.",
        "product_ids": cleaned,
    }

