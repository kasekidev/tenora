from sqlalchemy import Column, Integer, String, JSON, DateTime
from sqlalchemy.sql import func
from app.database import Base


class SiteSettings(Base):
    __tablename__ = "site_settings"

    id          = Column(Integer, primary_key=True, autoincrement=True)
    setting_key = Column(String(100), unique=True, nullable=False)
    value       = Column(JSON, nullable=False)
    updated_at  = Column(DateTime, server_default=func.now(), onupdate=func.now())