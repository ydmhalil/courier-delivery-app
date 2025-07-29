from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, date
from typing import List
import json

from database import get_db
from models.package import Package, DeliveryType, PackageStatus
from models.delivery_route import DeliveryRoute
from models.courier import Courier
from schemas.route import OptimizedRoute, RouteResponse, RouteStop
from routers.auth import get_current_user
from services.google_cloud_optimizer import GoogleCloudRouteOptimizer
import os

router = APIRouter()

# Initialize Google Cloud optimizer (singleton pattern)
_google_optimizer = None

def get_google_optimizer():
    """Get singleton Google Cloud optimizer instance"""
    global _google_optimizer
    if _google_optimizer is None:
        google_project_id = os.getenv('GOOGLE_CLOUD_PROJECT_ID')
        google_credentials_path = os.getenv('GOOGLE_APPLICATION_CREDENTIALS')
        _google_optimizer = GoogleCloudRouteOptimizer(google_project_id, google_credentials_path)
    return _google_optimizer

@router.get("/test")
async def test_route():
    """Test endpoint to verify routes are working"""
    print("TEST ROUTE CALLED!")
    return {"message": "Routes are working!", "status": "success"}

@router.get("/optimizer/status")
async def get_optimizer_status():
    """Get status of Google Cloud route optimizer"""
    optimizer = get_google_optimizer()
    
    if optimizer.is_available():
        return {
            "message": "Google Cloud Route Optimizer Status",
            "status": "Ready",
            "api_available": True,
            "project_id": optimizer.project_id or "Not configured"
        }
    else:
        return {
            "message": "Google Cloud Route Optimizer Status", 
            "status": "Not configured",
            "api_available": False,
            "error": "Google Cloud credentials or project ID not set"
        }

@router.get("/", response_model=OptimizedRoute)
async def get_optimized_route(
    route_date: date = None,
    start_lat: float = 41.0082,
    start_lng: float = 28.9784,
    start_address: str = "Istanbul Merkez Depo",
    db: Session = Depends(get_db)
):
    """
    Get optimized delivery route using Google Cloud Route Optimization API
    
    Args:
        route_date: Date for route optimization (default: today)
        start_lat: Starting location latitude (default: Istanbul depot)
        start_lng: Starting location longitude (default: Istanbul depot)
        start_address: Starting location address (default: Istanbul Merkez Depo)
    """
    print(f"=== GOOGLE CLOUD ROUTE OPTIMIZATION REQUEST ===")
    print(f"Date: {route_date}")
    print(f"Starting location: {start_address} ({start_lat}, {start_lng})")
    
    if not route_date:
        route_date = date.today()
    
    # Get all packages that need delivery (for testing without authentication)
    packages = db.query(Package).filter(
        Package.status.in_([PackageStatus.PENDING, PackageStatus.IN_TRANSIT])
    ).all()
    
    print(f"Found {len(packages)} packages")
    for pkg in packages:
        print(f"Package {pkg.kargo_id}: {pkg.address} (status: {pkg.status})")
    
    if not packages:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No packages found for route optimization"
        )
    
    # Initialize Google Cloud route optimizer
    print("Initializing Google Cloud route optimizer...")
    optimizer = get_google_optimizer()
    
    # Convert packages to optimizer format
    package_data = []
    print("Converting packages to optimizer format...")
    for pkg in packages:
        if pkg.latitude and pkg.longitude:
            package_data.append({
                'id': pkg.id,
                'kargo_id': pkg.kargo_id,
                'address': pkg.address,
                'recipient_name': pkg.recipient_name,
                'delivery_type': pkg.delivery_type.value,
                'time_window_start': pkg.time_window_start,
                'time_window_end': pkg.time_window_end,
                'latitude': pkg.latitude,
                'longitude': pkg.longitude,
                'weight': getattr(pkg, 'weight', 1),
                'volume': getattr(pkg, 'volume', 1),
                'scheduled_hour': getattr(pkg, 'scheduled_hour', 10)
            })
        else:
            print(f"Warning: Package {pkg.kargo_id} has no coordinates")
    
    print(f"Converted {len(package_data)} packages with valid coordinates")
    
    if not package_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No packages with valid coordinates found"
        )
    
    # Check if Google Cloud API is available
    if not optimizer.is_available():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Google Cloud Route Optimization API is not available. Please configure your credentials."
        )
    
    # Optimize route
    print("Starting Google Cloud route optimization...")
    try:
        depot_location = {
            'latitude': start_lat,
            'longitude': start_lng,
            'address': start_address
        }
        
        optimized_result = optimizer.optimize_route(
            packages=package_data,
            depot_location=depot_location
        )
        
        print(f"✅ Google Cloud optimization completed")
        print(f"   Distance: {optimized_result['total_distance_km']:.1f}km")
        print(f"   Duration: {optimized_result['total_duration_minutes']:.0f}min")
        
        # Convert Google Cloud result to response format
        optimized_route = {
            'stops': [],
            'total_distance': optimized_result['total_distance_km'],
            'total_distance_km': optimized_result['total_distance_km'],
            'estimated_duration': int(optimized_result['total_duration_minutes']),
            'optimization_metadata': optimized_result.get('optimization_metadata', {}),
            'algorithm_details': {
                'name': 'Google Cloud Route Optimization',
                'version': 'Production API',
                'features': ['Real-time traffic', 'Vehicle constraints', 'Time windows']
            },
            'api_used': 'google_cloud'
        }
        
        # Convert optimized stops to response format
        # Add depot as starting point
        depot_stop = {
            'id': 0,
            'kargo_id': 'DEPOT-START',
            'address': depot_location['address'],
            'recipient_name': 'Başlangıç Noktası',
            'delivery_type': 'depot',
            'latitude': depot_location['latitude'],
            'longitude': depot_location['longitude'],
            'sequence': 0,
            'arrival_time': '08:00',
            'departure_time': '08:00',
            'distance_from_previous': 0,
            'duration_from_previous': 0
        }
        optimized_route['stops'].append(depot_stop)
        
        for stop_data in optimized_result['optimized_stops']:
            # Google Cloud format
            package = stop_data['package']
            stop = {
                'id': package['id'],
                'kargo_id': package['kargo_id'],
                'address': package['address'],
                'recipient_name': package['recipient_name'],
                'delivery_type': package['delivery_type'],
                'latitude': package['latitude'],
                'longitude': package['longitude'],
                'sequence': stop_data.get('sequence', len(optimized_route['stops'])),
                'arrival_time': stop_data.get('arrival_time'),
                'departure_time': stop_data.get('departure_time'),
                'distance_from_previous': stop_data.get('distance_from_previous_m', 0) / 1000,
                'duration_from_previous': stop_data.get('duration_from_previous_s', 0) / 60
            }
            optimized_route['stops'].append(stop)
        
        print("Google Cloud route optimization completed successfully")
    except Exception as e:
        print(f"Google Cloud route optimization failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Google Cloud route optimization failed: {str(e)}"
        )
    
    # Save route to database
    print("Saving route to database...")
    route_data_json = json.dumps(optimized_route)
    db_route = DeliveryRoute(
        courier_id=1,  # Default courier ID for testing
        route_data=route_data_json,
        total_distance=optimized_route['total_distance'],
        estimated_duration=optimized_route['estimated_duration'],
        route_date=datetime.combine(route_date, datetime.min.time())
    )
    
    db.add(db_route)
    db.commit()
    print("Route saved to database")
    
    # Convert to response format
    stops = []
    for i, stop in enumerate(optimized_route['stops']):
        route_stop = RouteStop(
            package_id=stop['id'],
            kargo_id=stop['kargo_id'],
            address=stop['address'],
            recipient_name=stop['recipient_name'],
            delivery_type=stop['delivery_type'],
            time_window_start=stop.get('time_window_start'),
            time_window_end=stop.get('time_window_end'),
            latitude=stop['latitude'],
            longitude=stop['longitude'],
            estimated_arrival=stop.get('estimated_arrival'),
            sequence=i + 1
        )
        stops.append(route_stop)
    
    print(f"Returning optimized route with {len(stops)} stops")
    return OptimizedRoute(
        stops=stops,
        total_distance=optimized_route['total_distance'],
        estimated_duration=int(optimized_route['estimated_duration']),
        route_date=datetime.combine(route_date, datetime.min.time())
    )

@router.get("/history", response_model=List[RouteResponse])
async def get_route_history(
    current_user: Courier = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get route history for the courier"""
    routes = db.query(DeliveryRoute).filter(
        DeliveryRoute.courier_id == current_user.id
    ).order_by(DeliveryRoute.created_at.desc()).limit(10).all()
    
    response_routes = []
    for route in routes:
        route_data = json.loads(route.route_data) if route.route_data else {}
        response_routes.append(RouteResponse(
            id=route.id,
            courier_id=route.courier_id,
            total_distance=route.total_distance,
            estimated_duration=route.estimated_duration,
            route_date=route.route_date,
            created_at=route.created_at,
            stops=route_data.get('stops', [])
        ))
    
    return response_routes
