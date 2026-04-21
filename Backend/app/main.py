from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.middleware.sessions import SessionMiddleware
from loguru import logger
import time, sys
from app.config import settings
from app.routes.auth import router as auth_router
from app.routes.products import router as products_router
from app.routes.orders import router as orders_router
from app.routes.imports import router as imports_router
from app.routes.ebooks import router as ebooks_router
from app.routes.site import router as site_router         
from app.routes.panel import router as panel_router
from slowapi.errors import RateLimitExceeded
from app.services.rate_limiter import limiter
from app.services.scheduler import start_scheduler
from contextlib import asynccontextmanager

logger.remove()
logger.add(sys.stdout, level="DEBUG" if settings.DEBUG else "INFO")
logger.add("logs/api.log", rotation="2 hours", retention="7 days", level="INFO")


@asynccontextmanager
async def lifespan(app: FastAPI):
    start_scheduler()
    yield


app = FastAPI(
    title=settings.APP_NAME,
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url=None,
    lifespan=lifespan
)

app.state.limiter = limiter

async def _rate_limit_handler(request: Request, exc: RateLimitExceeded) -> JSONResponse:
    """Handler stable — évite l'import du symbole privé `_rate_limit_exceeded_handler`."""
    return JSONResponse(
        status_code=429,
        content={"detail": f"Trop de requêtes. Limite : {exc.detail}"}
    )

app.add_exception_handler(RateLimitExceeded, _rate_limit_handler)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_FOLDER), name="uploads")


# ── Handler 422 — masque les détails Pydantic en prod ─────────────────────────
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    if settings.DEBUG:
        return JSONResponse(
            status_code=422,
            content={"detail": exc.errors()}
        )
    errors = exc.errors()
    messages = []
    for e in errors:
        loc  = " → ".join(str(l) for l in e.get("loc", []) if l != "body")
        msg  = e.get("msg", "Valeur invalide")
        if loc:
            messages.append(f"{loc} : {msg}")
        else:
            messages.append(msg)
    detail = " | ".join(messages) if messages else "Données invalides. Vérifiez votre saisie."
    logger.warning(f"Validation error | {request.method} {request.url.path} | {exc.errors()}")
    return JSONResponse(
        status_code=422,
        content={"detail": detail}
    )


@app.middleware("http")
async def security_headers(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "SAMEORIGIN"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["X-Process-Time"] = str(process_time)
    if not settings.DEBUG:
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response


app.add_middleware(SessionMiddleware, secret_key=settings.SECRET_KEY)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Content-Type"],
)


@app.get("/robots.txt", include_in_schema=False)
async def robots():
    path = os.path.join(os.path.dirname(__file__), "..", "static", "robots.txt")
    if os.path.exists(path):
        return FileResponse(path, media_type="text/plain")
    return FileResponse("robots.txt", media_type="text/plain")


@app.get("/sitemap.xml", include_in_schema=False)
async def sitemap():
    path = os.path.join(os.path.dirname(__file__), "..", "static", "sitemap.xml")
    if os.path.exists(path):
        return FileResponse(path, media_type="application/xml")
    return FileResponse("sitemap.xml", media_type="application/xml")


@app.get("/health")
async def health_check():
    return {"status": "ok"}

app.include_router(auth_router,     prefix="/auth",     tags=["Auth"])
app.include_router(products_router, prefix="/products", tags=["Products"])
app.include_router(orders_router,   prefix="/orders",   tags=["Orders"])
app.include_router(imports_router,  prefix="/imports",  tags=["Import/Export"])
app.include_router(ebooks_router,   prefix="/ebooks",   tags=["Ebooks"])
app.include_router(site_router,                         tags=["Site"])   # ✅ FIX — était manquant
app.include_router(panel_router,                        tags=["Admin Panel"])