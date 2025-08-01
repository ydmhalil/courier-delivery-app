from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional
import os
from jose import JWTError, jwt

from database import get_db
from models.courier import Courier
from schemas.courier import CourierCreate, CourierLogin, CourierResponse, CourierUpdate, ChangePasswordRequest, Token, TokenData

router = APIRouter()
security = HTTPBearer()

SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str, credentials_exception):
    try:
        print(f"🔍 Verifying token...")  # Debug log
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        print(f"🔍 Token payload email: {email}")  # Debug log
        if email is None:
            print("❌ Email not found in token")  # Debug log
            raise credentials_exception
        token_data = TokenData(email=email)
        print(f"✅ Token verified for email: {email}")  # Debug log
    except JWTError as e:
        print(f"❌ JWT Error: {e}")  # Debug log
        raise credentials_exception
    return token_data

async def get_current_user(token: str = Depends(security), db: Session = Depends(get_db)):
    print(f"🔍 Received token: {token.credentials[:20]}...")  # Debug log
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    token_data = verify_token(token.credentials, credentials_exception)
    user = db.query(Courier).filter(Courier.email == token_data.email).first()
    if user is None:
        print(f"❌ User not found for email: {token_data.email}")  # Debug log
        raise credentials_exception
    print(f"✅ User found: {user.email}")  # Debug log
    return user

@router.post("/register", response_model=CourierResponse)
async def register_courier(courier: CourierCreate, db: Session = Depends(get_db)):
    # Check if user already exists
    db_user = db.query(Courier).filter(Courier.email == courier.email).first()
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bu e-posta adresi zaten kayıtlı"
        )
    
    # Create new courier
    hashed_password = Courier.get_password_hash(courier.password)
    db_courier = Courier(
        email=courier.email,
        hashed_password=hashed_password,
        full_name=courier.full_name,
        phone=courier.phone
    )
    db.add(db_courier)
    db.commit()
    db.refresh(db_courier)
    
    return db_courier

@router.post("/login", response_model=Token)
async def login_courier(courier: CourierLogin, db: Session = Depends(get_db)):
    print(f"🔍 Login attempt for email: {courier.email}")
    print(f"🔍 Password provided: {courier.password[:3]}***")
    
    # Check if user exists
    db_user = db.query(Courier).filter(Courier.email == courier.email).first()
    if not db_user:
        print(f"❌ User not found: {courier.email}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Bu e-posta adresi ile kayıtlı kullanıcı bulunamadı",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    print(f"🔍 User found: {db_user.email}")
    print(f"🔍 User hashed password: {db_user.hashed_password[:20]}...")
    
    # Check password
    password_valid = db_user.verify_password(courier.password)
    print(f"🔍 Password verification result: {password_valid}")
    
    if not password_valid:
        print(f"❌ Password verification failed for: {courier.email}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Yanlış şifre girdiniz",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    print(f"✅ Login successful for: {courier.email}")
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": db_user.email}, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=CourierResponse)
async def get_current_courier(current_user: Courier = Depends(get_current_user)):
    return current_user

@router.put("/profile", response_model=CourierResponse)
async def update_profile(
    courier_update: CourierUpdate,
    current_user: Courier = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Check if email is being updated and if it already exists
    if courier_update.email and courier_update.email != current_user.email:
        existing_user = db.query(Courier).filter(Courier.email == courier_update.email).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Bu e-posta adresi zaten kullanılıyor"
            )
    
    # Update fields
    update_data = courier_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(current_user, field, value)
    
    db.commit()
    db.refresh(current_user)
    return current_user

@router.post("/change-password")
async def change_password(
    request: ChangePasswordRequest,
    current_user: Courier = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    print(f"🔍 Change password request for user: {current_user.email}")
    print(f"🔍 Current password provided: {request.current_password[:3]}***")
    
    # Verify current password
    is_current_valid = current_user.verify_password(request.current_password)
    print(f"🔍 Current password verification: {is_current_valid}")
    
    if not is_current_valid:
        print("❌ Current password verification failed")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mevcut şifre yanlış"
        )
    
    print(f"🔍 New password: {request.new_password[:3]}***")
    # Update password
    new_hashed = Courier.get_password_hash(request.new_password)
    print(f"🔍 New hashed password: {new_hashed[:20]}...")
    
    current_user.hashed_password = new_hashed
    db.commit()
    
    # Test the new password immediately
    test_verify = current_user.verify_password(request.new_password)
    print(f"🔍 New password verification test: {test_verify}")
    
    return {"message": "Şifre başarıyla değiştirildi"}

@router.post("/reset-password")
async def reset_password():
    # TODO: Implement password reset functionality
    return {"message": "Password reset functionality will be implemented"}
