from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
import json
from datetime import datetime
from geopy.geocoders import Nominatim

from database import get_db
from models.package import Package, DeliveryType, PackageStatus, DeliveryFailureReason
from models.courier import Courier
from schemas.package import PackageCreate, PackageUpdate, PackageResponse, QRCodeData, DeliveryUpdateRequest
from routers.auth import get_current_user

router = APIRouter()
geolocator = Nominatim(user_agent="courier_app")

@router.get("/delivery-stats", response_model=dict)
async def get_delivery_stats(
    current_user: Courier = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Kurye teslimat istatistikleri"""
    total_packages = db.query(Package).filter(Package.courier_id == current_user.id).count()
    delivered_packages = db.query(Package).filter(
        Package.courier_id == current_user.id,
        Package.status == PackageStatus.DELIVERED
    ).count()
    failed_packages = db.query(Package).filter(
        Package.courier_id == current_user.id,
        Package.status == PackageStatus.FAILED
    ).count()
    pending_packages = db.query(Package).filter(
        Package.courier_id == current_user.id,
        Package.status.in_([PackageStatus.PENDING, PackageStatus.IN_TRANSIT])
    ).count()
    
    success_rate = (delivered_packages / total_packages * 100) if total_packages > 0 else 0
    
    return {
        "total_packages": total_packages,
        "delivered_packages": delivered_packages,
        "failed_packages": failed_packages,
        "pending_packages": pending_packages,
        "success_rate": round(success_rate, 1)
    }

def translate_delivery_type(turkish_type: str) -> DeliveryType:
    """Translate Turkish delivery type to enum"""
    mapping = {
        "express": DeliveryType.EXPRESS,
        "ekspres": DeliveryType.EXPRESS,
        "acil": DeliveryType.EXPRESS,
        "scheduled": DeliveryType.SCHEDULED,
        "zamanli": DeliveryType.SCHEDULED,
        "programli": DeliveryType.SCHEDULED,
        "standard": DeliveryType.STANDARD,
        "normal": DeliveryType.STANDARD,
        "standart": DeliveryType.STANDARD
    }
    return mapping.get(turkish_type.lower(), DeliveryType.STANDARD)

def get_coordinates(address: str):
    """Get latitude and longitude from address"""
    try:
        location = geolocator.geocode(address)
        if location:
            return location.latitude, location.longitude
    except Exception as e:
        print(f"Geocoding error: {e}")
    return None, None

@router.post("/", response_model=PackageResponse)
async def create_package(
    package: PackageCreate,
    current_user: Courier = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new package"""
    # Get coordinates if not provided
    if not package.latitude or not package.longitude:
        lat, lon = get_coordinates(package.address)
        package.latitude = lat
        package.longitude = lon
    
    db_package = Package(
        kargo_id=package.kargo_id,
        courier_id=current_user.id,
        recipient_name=package.recipient_name,
        address=package.address,
        phone=package.phone,
        delivery_type=package.delivery_type,
        time_window_start=package.time_window_start,
        time_window_end=package.time_window_end,
        latitude=package.latitude,
        longitude=package.longitude
    )
    
    db.add(db_package)
    db.commit()
    db.refresh(db_package)
    
    return db_package

@router.post("/qr-scan", response_model=PackageResponse)
async def create_package_from_qr(
    qr_data: QRCodeData,
    current_user: Courier = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create package from QR code data with coordinate prioritization"""
    print(f"📱 QR Scan: Processing QR data for package {qr_data.kargo_id}")
    
    # Translate Turkish fields to English
    delivery_type = translate_delivery_type(qr_data.teslimat_turu)
    
    # Extract time window if provided
    time_start = None
    time_end = None
    if qr_data.zaman_penceresi and len(qr_data.zaman_penceresi) == 2:
        time_start = qr_data.zaman_penceresi[0]
        time_end = qr_data.zaman_penceresi[1]
    
    # Coordinate prioritization logic
    lat, lon = None, None
    
    # 1. First priority: Direct coordinate fields in QR data
    if qr_data.latitude is not None and qr_data.longitude is not None:
        lat, lon = qr_data.latitude, qr_data.longitude
        print(f"📍 QR Scan: Using coordinates from QR data: {lat}, {lon}")
    
    # 2. Second priority: Coordinate object format
    elif qr_data.koordinatlar and isinstance(qr_data.koordinatlar, dict):
        if 'latitude' in qr_data.koordinatlar and 'longitude' in qr_data.koordinatlar:
            lat, lon = qr_data.koordinatlar['latitude'], qr_data.koordinatlar['longitude']
            print(f"📍 QR Scan: Using coordinates from koordinatlar object: {lat}, {lon}")
    
    # 3. Last resort: Geocode the address
    if lat is None or lon is None:
        print(f"🗺️ QR Scan: No coordinates in QR data, geocoding address: {qr_data.adres}")
        lat, lon = get_coordinates(qr_data.adres)
        if lat and lon:
            print(f"📍 QR Scan: Geocoded coordinates: {lat}, {lon}")
        else:
            print(f"❌ QR Scan: Failed to geocode address: {qr_data.adres}")
    
    # Create package
    db_package = Package(
        kargo_id=qr_data.kargo_id,
        courier_id=current_user.id,
        recipient_name=qr_data.alici,
        address=qr_data.adres,
        phone=qr_data.telefon,
        delivery_type=delivery_type,
        time_window_start=time_start,
        time_window_end=time_end,
        latitude=lat,
        longitude=lon
    )
    
    db.add(db_package)
    db.commit()
    db.refresh(db_package)
    
    print(f"✅ QR Scan: Package {qr_data.kargo_id} created successfully with coordinates: {lat}, {lon}")
    return db_package
    
    return db_package

@router.get("/", response_model=List[PackageResponse])
async def get_packages(
    current_user: Courier = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all packages for current courier"""
    packages = db.query(Package).filter(Package.courier_id == current_user.id).all()
    return packages

@router.get("/{package_id}", response_model=PackageResponse)
async def get_package(
    package_id: int,
    current_user: Courier = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get specific package details"""
    package = db.query(Package).filter(
        Package.id == package_id,
        Package.courier_id == current_user.id
    ).first()
    
    if not package:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Package not found"
        )
    
    return package

@router.put("/{package_id}", response_model=PackageResponse)
async def update_package(
    package_id: int,
    package_update: PackageUpdate,
    current_user: Courier = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update package information"""
    package = db.query(Package).filter(
        Package.id == package_id,
        Package.courier_id == current_user.id
    ).first()
    
    if not package:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Package not found"
        )
    
    # Update fields
    update_data = package_update.dict(exclude_unset=True)
    
    # Update coordinates if address changed
    if "address" in update_data and update_data["address"] != package.address:
        lat, lon = get_coordinates(update_data["address"])
        update_data["latitude"] = lat
        update_data["longitude"] = lon
    
    for field, value in update_data.items():
        setattr(package, field, value)
    
    db.commit()
    db.refresh(package)
    
    return package

@router.patch("/{package_id}/delivery-status", response_model=PackageResponse)
async def update_delivery_status(
    package_id: int,
    delivery_update: DeliveryUpdateRequest,
    current_user: Courier = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Teslimat durumu güncelleme - Kurye geri bildirimi"""
    package = db.query(Package).filter(
        Package.id == package_id,
        Package.courier_id == current_user.id
    ).first()
    
    if not package:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Paket bulunamadı"
        )
    
    # Durum güncelleme
    package.status = delivery_update.status
    package.delivery_notes = delivery_update.notes
    package.updated_at = datetime.now()
    
    # Başarılı teslimat
    if delivery_update.status == PackageStatus.DELIVERED:
        package.delivered_at = datetime.now()
        package.customer_signature = delivery_update.customer_signature
        package.delivery_photo = delivery_update.delivery_photo
    
    # Başarısız teslimat
    elif delivery_update.status == PackageStatus.FAILED:
        package.failure_reason = delivery_update.failure_reason
    
    db.commit()
    db.refresh(package)
    
    return package

@router.delete("/{package_id}")
async def delete_package(
    package_id: int,
    current_user: Courier = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a package"""
    package = db.query(Package).filter(
        Package.id == package_id,
        Package.courier_id == current_user.id
    ).first()
    
    if not package:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Package not found"
        )
    
    db.delete(package)
    db.commit()
    
    return {"message": "Package deleted successfully"}

@router.post("/qr-scan", response_model=PackageResponse)
async def create_package_from_qr(
    qr_data: QRCodeData,
    current_user: Courier = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a package from QR code data"""
    try:
        # Translate Turkish fields to English
        delivery_type = translate_delivery_type(qr_data.teslimat_turu)
        
        # Parse time window if provided
        time_start = None
        time_end = None
        if qr_data.zaman_penceresi and len(qr_data.zaman_penceresi) == 2:
            time_start = qr_data.zaman_penceresi[0]
            time_end = qr_data.zaman_penceresi[1]
        
        # Get coordinates from address
        lat, lon = get_coordinates(qr_data.adres)
        
        # Create package object
        db_package = Package(
            kargo_id=qr_data.kargo_id,
            recipient_name=qr_data.alici,
            address=qr_data.adres,
            phone=qr_data.telefon,
            delivery_type=delivery_type,
            time_window_start=time_start,
            time_window_end=time_end,
            latitude=lat,
            longitude=lon,
            courier_id=current_user.id,
            status=PackageStatus.PENDING  # Use PENDING instead of PICKED_UP
        )
        
        db.add(db_package)
        db.commit()
        db.refresh(db_package)
        
        return db_package
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to process QR code data: {str(e)}"
        )
