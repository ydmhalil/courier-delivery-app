from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import HTTPBearer
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import uvicorn
import os
from dotenv import load_dotenv

from database import engine, SessionLocal, Base, get_db
from routers import auth, packages, routes, chatbot
from models import courier, package, delivery_route

# Load environment variables
load_dotenv()

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Courier Delivery Management API",
    description="AI-powered route optimization and package management for couriers",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()

# Include routers
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(packages.router, prefix="/api/packages", tags=["Packages"])
app.include_router(routes.router, prefix="/api/routes", tags=["Routes"])
app.include_router(chatbot.router, prefix="/api/chatbot", tags=["AI Chatbot"])

@app.get("/")
async def root():
    return {"message": "Courier Delivery Management API", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
