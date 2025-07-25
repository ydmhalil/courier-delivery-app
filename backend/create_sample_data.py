"""
Mock data script for testing the Courier Delivery Application
Run this after setting up the database to populate with sample data
"""

import asyncio
import json
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

# Assuming you've set up the backend properly
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal, engine
from models.courier import Courier
from models.package import Package, DeliveryType, PackageStatus
from models.delivery_route import DeliveryRoute

def create_sample_data():
    db = SessionLocal()
    
    try:
        # Create sample courier
        sample_courier = Courier(
            email="demo@courier.com",
            hashed_password=Courier.get_password_hash("demo123"),
            full_name="Demo Courier",
            phone="+1-555-0000"
        )
        db.add(sample_courier)
        db.commit()
        db.refresh(sample_courier)
        
        print(f"✅ Created sample courier: {sample_courier.email}")
        
        # Sample packages data
        packages_data = [
            {
                "kargo_id": "PKT001",
                "recipient_name": "John Doe",
                "address": "123 Main Street, New York, NY 10001",
                "phone": "+1-555-0123",
                "delivery_type": DeliveryType.EXPRESS,
                "latitude": 40.7128,
                "longitude": -74.0060
            },
            {
                "kargo_id": "PKT002",
                "recipient_name": "Jane Smith",
                "address": "456 Oak Avenue, Los Angeles, CA 90210",
                "phone": "+1-555-0456",
                "delivery_type": DeliveryType.SCHEDULED,
                "time_window_start": "14:00",
                "time_window_end": "16:00",
                "latitude": 34.0522,
                "longitude": -118.2437
            },
            {
                "kargo_id": "PKT003",
                "recipient_name": "Bob Johnson",
                "address": "789 Pine Road, Chicago, IL 60601",
                "phone": "+1-555-0789",
                "delivery_type": DeliveryType.STANDARD,
                "latitude": 41.8781,
                "longitude": -87.6298
            },
            {
                "kargo_id": "PKT004",
                "recipient_name": "Alice Wilson",
                "address": "321 Elm Street, Houston, TX 77001",
                "phone": "+1-555-0321",
                "delivery_type": DeliveryType.EXPRESS,
                "latitude": 29.7604,
                "longitude": -95.3698
            },
            {
                "kargo_id": "PKT005",
                "recipient_name": "Charlie Brown",
                "address": "654 Maple Drive, Phoenix, AZ 85001",
                "phone": "+1-555-0654",
                "delivery_type": DeliveryType.SCHEDULED,
                "time_window_start": "09:00",
                "time_window_end": "12:00",
                "latitude": 33.4484,
                "longitude": -112.0740
            }
        ]
        
        # Create sample packages
        for pkg_data in packages_data:
            package = Package(
                courier_id=sample_courier.id,
                **pkg_data
            )
            db.add(package)
        
        db.commit()
        print(f"✅ Created {len(packages_data)} sample packages")
        
        # Create a sample optimized route
        route_data = {
            "stops": [
                {
                    "id": 1,
                    "kargo_id": "PKT001",
                    "address": "123 Main Street, New York, NY 10001",
                    "recipient_name": "John Doe",
                    "delivery_type": "express",
                    "latitude": 40.7128,
                    "longitude": -74.0060,
                    "estimated_arrival": "08:30",
                    "sequence": 1
                },
                {
                    "id": 4,
                    "kargo_id": "PKT004",
                    "address": "321 Elm Street, Houston, TX 77001",
                    "recipient_name": "Alice Wilson",
                    "delivery_type": "express",
                    "latitude": 29.7604,
                    "longitude": -95.3698,
                    "estimated_arrival": "09:15",
                    "sequence": 2
                }
            ],
            "total_distance": 1628.5,
            "estimated_duration": 180
        }
        
        sample_route = DeliveryRoute(
            courier_id=sample_courier.id,
            route_data=json.dumps(route_data),
            total_distance=1628.5,
            estimated_duration=180,
            route_date=datetime.now()
        )
        db.add(sample_route)
        db.commit()
        
        print("✅ Created sample optimized route")
        
        print("\n🎉 Sample data created successfully!")
        print("\n📱 Test Login Credentials:")
        print("Email: demo@courier.com")
        print("Password: demo123")
        
        print("\n📦 Sample QR Code Data (copy and generate QR codes):")
        sample_qr_data = {
            "kargo_id": "PKT006",
            "alici": "Test Customer",
            "adres": "999 Test Street, Test City, TC 12345",
            "telefon": "+1-555-9999",
            "teslimat_turu": "express",
            "zaman_penceresi": None
        }
        print(json.dumps(sample_qr_data, indent=2))
        
    except Exception as e:
        print(f"❌ Error creating sample data: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print("🚀 Creating sample data for Courier Delivery App...")
    create_sample_data()
