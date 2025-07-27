import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import get_db
from models.courier import Courier

def list_all_users():
    db = next(get_db())
    try:
        # List all couriers
        couriers = db.query(Courier).all()
        print("\nAll Couriers:")
        for courier in couriers:
            print(f"ID: {courier.id}, Email: {courier.email}, Name: {courier.full_name}, Active: {courier.is_active}")
        
        return couriers
    except Exception as e:
        print(f"Error listing users: {e}")
        return []
    finally:
        db.close()

def create_test_user():
    db = next(get_db())
    try:
        # Check if test user already exists
        existing_user = db.query(Courier).filter(Courier.email == "test@test.com").first()
        if existing_user:
            print("Test user already exists!")
            return existing_user
        
        # Create new test user
        new_user = Courier(
            email="test@test.com",
            hashed_password=Courier.get_password_hash("test123"),
            full_name="Test User",
            phone="1234567890"
        )
        
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        print(f"Created test user: {new_user.email}")
        return new_user
        
    except Exception as e:
        print(f"Error creating test user: {e}")
        db.rollback()
        return None
    finally:
        db.close()

if __name__ == "__main__":
    print("=== User Database Check ===")
    
    # List existing users
    users = list_all_users()
    
    if not users:
        print("No users found. Creating test user...")
        create_test_user()
        # List again to confirm
        list_all_users()
    else:
        print(f"Found {len(users)} users in database")
        
    # Try to create another test user if needed
    create_test_user()
