
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Identité
    APP_NAME:    str  = "Tenora"
    APP_VERSION: str  = "1.0.0"
    DEBUG:       bool = False
    ENVIRONMENT: str  = "production"
    SITE_URL:    str  = "https://tenora.store"

    # Sécurité
    SECRET_KEY:  str

    # Base de données
    DATABASE_URL: str

    # CORS — supporte string JSON ou liste Python
    ALLOWED_ORIGINS: list[str] = ["https://tenora.store", "https://www.tenora.store"]

    # Uploads locaux (dev) — remplacé par R2 en prod
    UPLOAD_FOLDER: str = "uploads"

    # Cloudflare R2
    R2_ACCOUNT_ID:        str = ""
    R2_ACCESS_KEY_ID:     str = ""
    R2_SECRET_ACCESS_KEY: str = ""
    R2_BUCKET_NAME:       str = ""
    R2_PUBLIC_URL:        str = ""

    # Emails Resend
    RESEND_API_KEY: str = ""
    MAIL_FROM:      str = ""
    MAIL_ADMIN:     str = ""

    # WhatsApp
    WHATSAPP_NUMBER: str = ""

    # === Observabilité (NEW) ===
    SENTRY_DSN:                 str   = ""
    SENTRY_TRACES_SAMPLE_RATE:  float = 0.1
    SENTRY_PROFILES_SAMPLE_RATE: float = 0.0

    class Config:
        env_file = ".env"


settings = Settings()
