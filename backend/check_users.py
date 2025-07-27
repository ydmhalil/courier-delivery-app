"""
Check existing users and create test users if needed
"""

from sqlalchemy.orm import Session
from passlib.context import CryptContext
from database import SessionLocal
from models.courier import Courier

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def check_and_create_users():
    """Check existing users and create test users if needed"""
    
    db = SessionLocal()
    
    try:
        # Check all existing users
        users = db.query(Courier).all()
        
        print("🔍 EXISTING USERS:")
        if users:
            for user in users:
                for courier in couriers:
            print(f"ID: {courier.id}, Email: {courier.email}, Name: {courier.full_name}, Active: {courier.is_active}")
        else:
            print("   No users found in database")
        
        print("\n🔧 CREATING TEST USERS...")
        
        # Create test@example.com if not exists
        user1 = db.query(Courier).filter(Courier.email == "test@example.com").first()
        if not user1:
            hashed_password = pwd_context.hash("password")
            user1 = Courier(
                name="Test User 1",
                email="test@example.com",
                phone="5551234567",
                hashed_password=hashed_password,
                is_active=True
            )
            db.add(user1)
            print("✅ Created test@example.com")
        else:
            print("✅ test@example.com already exists")
        
        # Create test@test.com if not exists
        user2 = db.query(Courier).filter(Courier.email == "test@test.com").first()
        if not user2:
            hashed_password = pwd_context.hash("test123")
            user2 = Courier(
                name="Test User 2",
                email="test@test.com",
                phone="5559876543",
                hashed_password=hashed_password,
                is_active=True
            )
            db.add(user2)
            print("✅ Created test@test.com")
        else:
            print("✅ test@test.com already exists")
        
        db.commit()
        
        print("\n🎯 LOGIN CREDENTIALS:")
        print("   Email: test@example.com, Password: password")
        print("   Email: test@test.com, Password: test123")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    check_and_create_users()
