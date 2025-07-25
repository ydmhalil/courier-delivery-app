from sqlalchemy import Column, Integer, String, DateTime, Float, ForeignKey, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base

class DeliveryRoute(Base):
    __tablename__ = "delivery_routes"

    id = Column(Integer, primary_key=True, index=True)
    courier_id = Column(Integer, ForeignKey("couriers.id"), nullable=False)
    
    # Route details
    route_data = Column(Text)  # JSON string containing optimized route
    total_distance = Column(Float)  # Total distance in kilometers
    estimated_duration = Column(Integer)  # Estimated duration in minutes
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    route_date = Column(DateTime(timezone=True), nullable=False)
    
    # Relationships
    courier = relationship("Courier", back_populates="routes")

# Add relationship to Courier model
from models.courier import Courier
Courier.routes = relationship("DeliveryRoute", back_populates="courier")
