import enum

from sqlalchemy import Column, DateTime, Enum, ForeignKey, Index, Integer, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class ImportStatus(enum.Enum):
    pending = "pending"
    contacted = "contacted"
    in_progress = "in_progress"
    delivered = "delivered"
    cancelled = "cancelled"

class ImportRequest(Base):
    __tablename__ = "import_requests"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)
    article_url = Column(String(1000), nullable=False)
    article_description = Column(Text, nullable=True)
    screenshot_path = Column(String(255), nullable=True)
    status = Column(Enum(ImportStatus), default=ImportStatus.pending)
    staff_note = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="import_requests")
    category = relationship("Category")

    __table_args__ = (
        Index("idx_import_user", "user_id"),
        Index("idx_import_status", "status"),
    )

    def __str__(self):
        return f"Import #{self.id}"
