import re
from datetime import datetime

from pydantic import BaseModel, EmailStr, field_validator


class UserRegister(BaseModel):
    email: EmailStr
    password: str
    phone: str | None = None

    @field_validator("password")
    @classmethod
    def password_strength(cls, v):
        if len(v) < 8:
            raise ValueError("Minimum 8 caractères")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Doit contenir une majuscule")
        if not re.search(r"[0-9]", v):
            raise ValueError("Doit contenir un chiffre")
        return v

    @field_validator("phone")
    @classmethod
    def phone_format(cls, v):
        if v and not re.match(r"^0?(70|74|8\d|9\d)\d{6}$", v):
            raise ValueError("Format invalide")
        return v

class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    email: EmailStr
    phone: str | None
    is_verified: bool
    is_admin: bool
    created_at: datetime

    model_config = {"from_attributes": True}

class UserUpdate(BaseModel):
    phone: str | None = None

    @field_validator("phone")
    @classmethod
    def phone_format(cls, v):
        if v and not re.match(r"^0?(70|74|8\d|9\d)\d{6}$", v):
            raise ValueError("Numéro invalide. Exemples: 96XXXXXX, 80XXXXXX")
        return v
