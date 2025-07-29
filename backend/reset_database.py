#!/usr/bin/env python3
"""
Database Reset Script
Recreates the database with fixed datetime columns
"""

import os
import sys
from sqlalchemy import create_engine, text
from database import Base, DATABASE_URL, SessionLocal
from models.courier import Courier
from models.package import Package
from models.delivery_route import DeliveryRoute

def reset_database():
    """Reset the database with corrected schema"""
    print("🔄 Resetting database...")
    
    # Remove existing database file if SQLite
    if DATABASE_URL.startswith("sqlite"):
        db_file = DATABASE_URL.replace("sqlite:///", "").replace("./", "")
        if os.path.exists(db_file):
            os.remove(db_file)
            print(f"✅ Removed existing database file: {db_file}")
    
    # Create engine
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {})
    
    # Create all tables
    Base.metadata.create_all(bind=engine)
    print("✅ Created all tables with corrected schema")
    
    # Create test user
    print("👤 Creating test user...")
    db = SessionLocal()
    try:
        # Check if test user exists
        existing_user = db.query(Courier).filter(Courier.email == "test@example.com").first()
        if not existing_user:
            test_user = Courier(
                email="test@example.com",
                hashed_password=Courier.get_password_hash("testpassword"),
                full_name="Test Courier",
                phone="+1234567890"
            )
            db.add(test_user)
            db.commit()
            print("✅ Test user created successfully")
        else:
            print("✅ Test user already exists")
    except Exception as e:
        print(f"❌ Error creating test user: {e}")
        db.rollback()
    finally:
        db.close()
    
    print("🎉 Database reset completed successfully!")

if __name__ == "__main__":
    reset_database()
