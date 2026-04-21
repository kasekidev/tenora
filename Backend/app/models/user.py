from sqlalchemy import Column,Integer,Boolean,String,DateTime
from sqlalchemy.sql import func
from app.database import Base
from sqlalchemy.orm import relationship


class User(Base):
    __tablename__ = "users"
    id =  Column(Integer,primary_key=True,autoincrement=True)
    email = Column(String(255),nullable=False,unique=True)
    password_hash = Column(String(255),nullable=False)
    phone = Column(String(20),nullable=True)
    is_verified = Column(Boolean, default=False)
    is_admin = Column(Boolean, default=False)
    created_at = Column(DateTime,server_default=func.now())
    orders = relationship("Order", back_populates="user")
    sessions = relationship("Session", back_populates="user")
    import_requests = relationship("ImportRequest", back_populates="user")
    otp_codes = relationship("OTPCode", back_populates="user")