#!/usr/bin/env python3
"""
Load Real Istanbul Addresses
Creates packages with real Istanbul addresses and coordinates
"""

import json
import os
import sys
from sqlalchemy import create_engine, text
from database import Base, DATABASE_URL, SessionLocal
from models.courier import Courier
from models.package import Package, DeliveryType, PackageStatus

def load_istanbul_addresses():
    """Load real Istanbul addresses into database"""
    print("🏠 Loading real Istanbul addresses...")
    
    # Load JSON data
    with open('istanbul_addresses.json', 'r', encoding='utf-8') as f:
        addresses = json.load(f)
    
    db = SessionLocal()
    try:
        # Get test user
        test_user = db.query(Courier).filter(Courier.email == "test@example.com").first()
        if not test_user:
            print("❌ Test user not found! Please run clean_database.py first.")
            return
        
        print(f"📦 Loading {len(addresses)} packages for {test_user.email}...")
        
        # Create packages
        for addr_data in addresses:
            # Map delivery type
            delivery_type_map = {
                "express": DeliveryType.EXPRESS,
                "standard": DeliveryType.STANDARD,
                "scheduled": DeliveryType.SCHEDULED
            }
            
            # Parse time window
            time_start = None
            time_end = None
            if addr_data.get("zaman_penceresi"):
                time_range = addr_data["zaman_penceresi"].split("-")
                if len(time_range) == 2:
                    time_start = time_range[0]
                    time_end = time_range[1]
            
            package = Package(
                kargo_id=addr_data["kargo_id"],
                courier_id=test_user.id,
                recipient_name=addr_data["alici"],
                address=addr_data["adres"],
                phone=addr_data["telefon"],
                delivery_type=delivery_type_map[addr_data["teslimat_turu"]],
                time_window_start=time_start,
                time_window_end=time_end,
                latitude=addr_data["koordinatlar"]["latitude"],
                longitude=addr_data["koordinatlar"]["longitude"],
                status=PackageStatus.PENDING
            )
            db.add(package)
        
        db.commit()
        print(f"✅ Successfully loaded {len(addresses)} packages!")
        print("📱 Login Credentials:")
        print("Email: test@example.com")
        print("Password: testpassword")
        print("\n📦 Sample QR Code Data (copy and generate QR code):")
        print(json.dumps(addresses[0], indent=2, ensure_ascii=False))
        
    except Exception as e:
        print(f"❌ Error loading addresses: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    load_istanbul_addresses()
