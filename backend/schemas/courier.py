from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional
from datetime import datetime

class CourierBase(BaseModel):
    email: EmailStr
    full_name: str
    phone: Optional[str] = None

class CourierCreate(CourierBase):
    password: str
    
    @field_validator('password')
    @classmethod
    def validate_password(cls, v):
        if len(v) < 6:
            raise ValueError('Şifre en az 6 karakter olmalıdır')
        return v

class CourierUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str
    
    @field_validator('new_password')
    @classmethod
    def validate_new_password(cls, v):
        if len(v) < 6:
            raise ValueError('Yeni şifre en az 6 karakter olmalıdır')
        return v

class CourierLogin(BaseModel):
    email: EmailStr
    password: str

class CourierResponse(CourierBase):
    id: int
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
