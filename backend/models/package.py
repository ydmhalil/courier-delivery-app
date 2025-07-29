from sqlalchemy import Column, Integer, String, DateTime, Float, Enum, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base
import enum

class DeliveryType(enum.Enum):
    EXPRESS = "express"
    SCHEDULED = "scheduled"
    STANDARD = "standard"

class PackageStatus(enum.Enum):
    PENDING = "pending"
    IN_TRANSIT = "in_transit"
    DELIVERED = "delivered"
    FAILED = "failed"

class DeliveryFailureReason(enum.Enum):
    CUSTOMER_NOT_FOUND = "customer_not_found"
    CUSTOMER_REFUSED = "customer_refused"
    WRONG_ADDRESS = "wrong_address"
    CUSTOMER_NOT_AVAILABLE = "customer_not_available"
    DAMAGED_PACKAGE = "damaged_package"
    OTHER = "other"

class Package(Base):
    __tablename__ = "packages"

    id = Column(Integer, primary_key=True, index=True)
    kargo_id = Column(String, unique=True, index=True, nullable=False)
    courier_id = Column(Integer, ForeignKey("couriers.id"), nullable=False)
    
    # Customer details
    recipient_name = Column(String, nullable=False)
    address = Column(String, nullable=False)
    phone = Column(String)
    
    # Delivery details
    delivery_type = Column(Enum(DeliveryType), nullable=False)
    time_window_start = Column(String)  # Format: "HH:MM"
    time_window_end = Column(String)    # Format: "HH:MM"
    
    # Coordinates for route optimization
    latitude = Column(Float)
    longitude = Column(Float)
    
    # Status and tracking
    status = Column(Enum(PackageStatus), default=PackageStatus.PENDING)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())
    delivered_at = Column(DateTime)
    
    # Delivery feedback
    delivery_notes = Column(String)  # Kurye notları
    failure_reason = Column(Enum(DeliveryFailureReason))  # Başarısız teslimat nedeni
    customer_signature = Column(String)  # Müşteri imzası (base64)
    delivery_photo = Column(String)  # Teslimat fotoğrafı URL'si
    
    # Relationships
    courier = relationship("Courier", back_populates="packages")

# Add relationship to Courier model
from models.courier import Courier
Courier.packages = relationship("Package", back_populates="courier")
