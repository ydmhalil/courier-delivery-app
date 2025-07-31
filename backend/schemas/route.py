from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime

class RouteStop(BaseModel):
    package_id: int
    kargo_id: str
    address: str
    recipient_name: str
    delivery_type: str
    time_window_start: Optional[str] = None
    time_window_end: Optional[str] = None
    latitude: float
    longitude: float
    estimated_arrival: Optional[str] = None
    sequence: int

class OptimizedRoute(BaseModel):
    stops: List[RouteStop]
    total_distance: float
    estimated_duration: int
    route_date: datetime
    status: Optional[str] = "success"
    message: Optional[str] = None

class RouteResponse(BaseModel):
    id: int
    courier_id: int
    route_data: Dict[str, Any]
    total_distance: float
    estimated_duration: int
    created_at: datetime
    route_date: datetime
    
    class Config:
        from_attributes = True
