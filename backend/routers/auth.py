from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional
import os
from jose import JWTError, jwt

from database import get_db
from models.courier import Courier
from schemas.courier import CourierCreate, CourierLogin, CourierResponse, Token, TokenData

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
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = TokenData(email=email)
    except JWTError:
        raise credentials_exception
    return token_data

async def get_current_user(token: str = Depends(security), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    token_data = verify_token(token.credentials, credentials_exception)
    user = db.query(Courier).filter(Courier.email == token_data.email).first()
    if user is None:
        raise credentials_exception
    return user

@router.post("/register", response_model=CourierResponse)
async def register_courier(courier: CourierCreate, db: Session = Depends(get_db)):
    # Check if user already exists
    db_user = db.query(Courier).filter(Courier.email == courier.email).first()
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
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
    # Authenticate user
    db_user = db.query(Courier).filter(Courier.email == courier.email).first()
    if not db_user or not db_user.verify_password(courier.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": db_user.email}, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=CourierResponse)
async def get_current_courier(current_user: Courier = Depends(get_current_user)):
    return current_user

@router.post("/reset-password")
async def reset_password():
    # TODO: Implement password reset functionality
    return {"message": "Password reset functionality will be implemented"}
