"""
Create a test user for frontend login
"""

from sqlalchemy.orm import Session
from passlib.context import CryptContext
from database import SessionLocal, engine
from models.courier import Courier

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_test_user():
    """Create a test user for frontend login"""
    
    db = SessionLocal()
    
    try:
        # Check if test user already exists
        existing_user = db.query(Courier).filter(Courier.email == "test@test.com").first()
        
        if existing_user:
            print("✅ Test user already exists:")
            print(f"   Email: {existing_user.email}")
            print(f"   Name: {existing_user.name}")
            return
        
        # Create test user
        hashed_password = pwd_context.hash("test123")
        
        test_user = Courier(
            name="Test User",
            email="test@test.com",
            phone="5551234567",
            hashed_password=hashed_password,
            is_active=True
        )
        
        db.add(test_user)
        db.commit()
        db.refresh(test_user)
        
        print("✅ Test user created successfully!")
        print(f"   Email: test@test.com")
        print(f"   Password: test123")
        print(f"   ID: {test_user.id}")
        
    except Exception as e:
        print(f"❌ Error creating test user: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_test_user()
