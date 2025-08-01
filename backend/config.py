import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class Settings:
    # Database
    DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./courier.db")
    
    # JWT Settings
    SECRET_KEY = os.getenv("SECRET_KEY", "your-super-secret-jwt-key-change-in-production")
    ALGORITHM = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))
    
    # Google Services
    GOOGLE_MAPS_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY")
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

settings = Settings()
