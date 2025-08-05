import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()  # .env dosyası
load_dotenv('.env.local')  # Yerel geliştirme için gerçek key'ler

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
