from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from models.package import DeliveryType, PackageStatus, DeliveryFailureReason

class PackageBase(BaseModel):
    kargo_id: str
    recipient_name: str
    address: str
    phone: Optional[str] = None
    delivery_type: DeliveryType
    time_window_start: Optional[str] = None
    time_window_end: Optional[str] = None

class PackageCreate(PackageBase):
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class PackageUpdate(BaseModel):
    recipient_name: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    delivery_type: Optional[DeliveryType] = None
    time_window_start: Optional[str] = None
    time_window_end: Optional[str] = None
    status: Optional[PackageStatus] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class PackageResponse(PackageBase):
    id: int
    courier_id: int
    status: PackageStatus
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    delivered_at: Optional[datetime] = None
    delivery_notes: Optional[str] = None
    failure_reason: Optional[DeliveryFailureReason] = None
    customer_signature: Optional[str] = None
    delivery_photo: Optional[str] = None
    
    class Config:
        from_attributes = True

class DeliveryUpdateRequest(BaseModel):
    """Teslimat durumu güncelleme request'i"""
    status: PackageStatus
    notes: Optional[str] = None
    failure_reason: Optional[DeliveryFailureReason] = None
    customer_signature: Optional[str] = None  # Base64 encoded signature
    delivery_photo: Optional[str] = None  # Photo URL or base64

class QRCodeData(BaseModel):
    """Schema for QR code data structure"""
    kargo_id: str
    alici: str  # recipient name in Turkish
    adres: str  # address in Turkish
    telefon: str  # phone in Turkish
    teslimat_turu: str  # delivery type in Turkish
    zaman_penceresi: Optional[List[str]] = None  # time window [start, end]
    # Coordinate data (optional but preferred)
    latitude: Optional[float] = None  # GPS latitude
    longitude: Optional[float] = None  # GPS longitude
    koordinatlar: Optional[dict] = None  # Alternative coordinate format
