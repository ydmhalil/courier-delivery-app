from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional
import logging

from database import get_db
from schemas.courier import TokenData
from routers.auth import get_current_user
from services.gemini_service import gemini_service
from services.package_service import PackageService
from services.weather_service import weather_service
from services.database_service import DatabaseService
from models.courier import Courier
from pydantic import BaseModel

# Configure logging
logger = logging.getLogger(__name__)

router = APIRouter()

class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    response: str
    context_used: bool = False

@router.post("/chat", response_model=ChatResponse)
async def chat_with_ai(
    request: ChatRequest,
    db: Session = Depends(get_db),
    current_courier: Courier = Depends(get_current_user)
):
    """
    Chat with AI assistant for courier-related queries
    """
    try:
        # Get comprehensive database context
        db_service = DatabaseService(db)
        full_context = db_service.get_full_courier_context(current_courier.id)
        
        logger.info(f"Full context keys: {list(full_context.keys())}")
        
        # Add weather information if requested
        query_lower = request.message.lower()
        if any(keyword in query_lower for keyword in ['hava', 'weather', 'yağmur', 'güneş', 'rüzgar', 'sıcaklık']):
            if full_context.get('packages'):
                weather_summary = await weather_service.get_weather_summary(full_context['packages'])
                full_context['weather_info'] = weather_summary
        
        # Handle specific search queries
        if any(keyword in query_lower for keyword in ['ara', 'bul', 'search']):
            # Extract search term (simple implementation)
            search_terms = query_lower.replace('ara', '').replace('bul', '').replace('search', '').strip()
            if search_terms:
                search_results = db_service.search_packages(current_courier.id, search_terms)
                full_context['search_results'] = search_results
                logger.info(f"Search results type: {type(search_results)}, length: {len(search_results) if isinstance(search_results, list) else 'not a list'}")
        
        # Handle area-specific queries
        for area in ['kadıköy', 'beşiktaş', 'şişli', 'beyoğlu', 'maltepe', 'kartal', 'bakırköy', 'bahçelievler']:
            if area in query_lower:
                area_packages = db_service.get_packages_by_area(current_courier.id, area)
                full_context[f'{area}_packages'] = area_packages
                logger.info(f"Area packages for {area}: type={type(area_packages)}, count={len(area_packages) if isinstance(area_packages, list) else 'not a list'}")
                break
        
        # Generate AI response with full context
        ai_response = await gemini_service.generate_response(
            query=request.message,
            context_data=full_context
        )
        
        return ChatResponse(
            response=ai_response,
            context_used=full_context is not None
        )
        
    except Exception as e:
        logger.error(f"Error in chat endpoint: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="AI hizmetinde bir sorun oluştu. Lütfen daha sonra tekrar deneyin."
        )

@router.get("/chat/health")
async def chat_health_check():
    """Check if AI chat service is available"""
    try:
        # Test the AI service with a simple query
        test_response = await gemini_service.generate_response("Test")
        return {
            "status": "healthy",
            "ai_service": "available",
            "test_response_length": len(test_response)
        }
    except Exception as e:
        logger.error(f"AI service health check failed: {e}")
        return {
            "status": "unhealthy", 
            "ai_service": "unavailable",
            "error": str(e)
        }
