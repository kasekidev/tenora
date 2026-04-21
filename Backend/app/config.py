from pydantic_settings import BaseSettings
from typing import List
import json

class Settings(BaseSettings):
    # Identité
    APP_NAME:    str  = "Tenora"
    DEBUG:       bool 
    ENVIRONMENT : str 
    SITE_URL:    str  = "https://tenora.store"

    # Sécurité
    SECRET_KEY:  str

    # Base de données
    DATABASE_URL: str

    # CORS — supporte string JSON ou liste Python
    ALLOWED_ORIGINS: List[str] = ["https://tenora.store", "https://www.tenora.store"]

    # Uploads locaux (dev) — remplacé par R2 en prod
    UPLOAD_FOLDER: str = "uploads"

    # Cloudflare R2
    R2_ACCOUNT_ID:        str = ""
    R2_ACCESS_KEY_ID:     str = ""
    R2_SECRET_ACCESS_KEY: str = ""
    R2_BUCKET_NAME:       str = ""
    R2_PUBLIC_URL:        str = ""   # ex: https://pub-xxx.r2.dev ou ton domaine custom

    # Emails Resend
    RESEND_API_KEY: str = ""
    MAIL_FROM:      str = ""
    MAIL_ADMIN:     str = ""

    # WhatsApp
    WHATSAPP_NUMBER: str = ""

    class Config:
        env_file = ".env"

settings = Settings()