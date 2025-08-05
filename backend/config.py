import os
from dotenv import load_dotenv
from pathlib import Path

# Get the directory where this config.py file is located
BASE_DIR = Path(__file__).resolve().parent

# Load environment variables
load_dotenv()  # Önce .env dosyasını yükle
load_dotenv(BASE_DIR / '.env.local', override=True)  # Sonra local ile override et

# Debug: Print loaded environment variables (only in debug mode)
if os.getenv("DEBUG_MODE", "false").lower() == "true":
    print(f"🔧 Config Debug:")
    print(f"   BASE_DIR: {BASE_DIR}")
    print(f"   GEMINI_API_KEY: {'✅ Set' if os.getenv('GEMINI_API_KEY') else '❌ Missing'}")
    print(f"   GOOGLE_CLOUD_PROJECT_ID: {os.getenv('GOOGLE_CLOUD_PROJECT_ID') or '❌ Missing'}")
    print(f"   GOOGLE_APPLICATION_CREDENTIALS: {os.getenv('GOOGLE_APPLICATION_CREDENTIALS') or '❌ Missing'}")
    
    # Check if credentials file exists
    cred_path = os.getenv('GOOGLE_APPLICATION_CREDENTIALS')
    if cred_path and os.path.exists(cred_path):
        print(f"   Credentials file: ✅ Found at {cred_path}")
    else:
        print(f"   Credentials file: ❌ Not found at {cred_path}")

class Settings:
    # Database
    DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./courier.db")
    
    # JWT Settings
    SECRET_KEY = os.getenv("SECRET_KEY", "your-super-secret-jwt-key-change-in-production")
    ALGORITHM = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))
    
    # AI Integration
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
    
    # Google Cloud Services
    GOOGLE_CLOUD_PROJECT_ID = os.getenv("GOOGLE_CLOUD_PROJECT_ID")
    GOOGLE_APPLICATION_CREDENTIALS = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
    
    # Route Optimization Settings
    PREFER_GOOGLE_CLOUD = os.getenv("PREFER_GOOGLE_CLOUD", "true").lower() == "true"
    MAX_PACKAGES_FOR_GOOGLE = int(os.getenv("MAX_PACKAGES_FOR_GOOGLE", "100"))
    ENABLE_ALGORITHM_COMPARISON = os.getenv("ENABLE_ALGORITHM_COMPARISON", "false").lower() == "true"
    
    # Weather Service (Optional)
    WEATHER_API_KEY = os.getenv("WEATHER_API_KEY", "demo_key")
    WEATHER_API_URL = os.getenv("WEATHER_API_URL", "http://api.openweathermap.org/data/2.5/weather")
    
    # Application Settings
    DEBUG_MODE = os.getenv("DEBUG_MODE", "false").lower() == "true" 
    LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
    CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")

settings = Settings()
