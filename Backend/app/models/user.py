from sqlalchemy import Boolean, Column, DateTime, Integer, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class User(Base):
    __tablename__ = "users"
    id =  Column(Integer,primary_key=True,autoincrement=True)
    email = Column(String(255),nullable=False,unique=True)
    password_hash = Column(String(255),nullable=False)
    phone = Column(String(20),nullable=True)
    # Pseudonyme optionnel mais IMMUABLE une fois défini.
    # Unique en base (case-insensitive géré côté applicatif via .lower() au stockage
    # et via un index fonctionnel côté migration). 3-20 chars, [a-zA-Z0-9_-].
    username = Column(String(20), nullable=True, unique=True)
    is_verified = Column(Boolean, default=False)
    is_admin = Column(Boolean, default=False)
    created_at = Column(DateTime,server_default=func.now())
    orders = relationship("Order", back_populates="user")
    sessions = relationship("Session", back_populates="user")
    import_requests = relationship("ImportRequest", back_populates="user")
    otp_codes = relationship("OTPCode", back_populates="user")
