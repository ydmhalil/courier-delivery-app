#!/usr/bin/env python3
"""
Clean Database Script
Removes sample data but keeps essential users
"""

import os
import sys
from sqlalchemy import create_engine, text
from database import Base, DATABASE_URL, SessionLocal
from models.courier import Courier
from models.package import Package
from models.delivery_route import DeliveryRoute

def clean_database():
    """Clean database from sample data but keep essential users"""
    print("🧹 Cleaning database from sample data...")
    
    db = SessionLocal()
    try:
        # Delete all packages
        packages_deleted = db.query(Package).delete()
        print(f"✅ Deleted {packages_deleted} sample packages")
        
        # Delete all delivery routes
        routes_deleted = db.query(DeliveryRoute).delete()
        print(f"✅ Deleted {routes_deleted} sample routes")
        
        # Delete demo courier but keep test@example.com
        demo_user = db.query(Courier).filter(Courier.email == "demo@courier.com").first()
        if demo_user:
            db.delete(demo_user)
            print("✅ Deleted demo@courier.com user")
        
        # Ensure test@example.com exists
        test_user = db.query(Courier).filter(Courier.email == "test@example.com").first()
        if not test_user:
            test_user = Courier(
                email="test@example.com",
                hashed_password=Courier.get_password_hash("testpassword"),
                full_name="Test Courier",
                phone="+1234567890"
            )
            db.add(test_user)
            print("✅ Created test@example.com user")
        else:
            print("✅ test@example.com user already exists")
        
        db.commit()
        print("🎉 Database cleaned successfully!")
        print("📱 Available Login Credentials:")
        print("Email: test@example.com")
        print("Password: testpassword")
        
    except Exception as e:
        print(f"❌ Error cleaning database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    clean_database()
