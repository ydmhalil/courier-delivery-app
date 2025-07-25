from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class CourierBase(BaseModel):
    email: EmailStr
    full_name: str
    phone: Optional[str] = None

class CourierCreate(CourierBase):
    password: str

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
