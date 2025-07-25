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
from services.route_optimizer import RouteOptimizer

router = APIRouter()

@router.get("/test")
async def test_route():
    """Test endpoint to verify routes are working"""
    print("TEST ROUTE CALLED!")
    return {"message": "Routes are working!", "status": "success"}

@router.get("/", response_model=OptimizedRoute)
async def get_optimized_route(
    route_date: date = None,
    current_user: Courier = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get optimized delivery route for current day or specified date"""
    print(f"=== ROUTE OPTIMIZATION REQUEST ===")
    print(f"User: {current_user.id} ({current_user.email})")
    print(f"Date: {route_date}")
    
    if not route_date:
        route_date = date.today()
    
    # Get packages that need delivery for the courier
    packages = db.query(Package).filter(
        Package.courier_id == current_user.id,
        Package.status.in_([PackageStatus.PENDING, PackageStatus.IN_TRANSIT])
    ).all()
    
    print(f"Found {len(packages)} packages for courier {current_user.id}")
    for pkg in packages:
        print(f"Package {pkg.kargo_id}: {pkg.address} (status: {pkg.status})")
    
    if not packages:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No packages found for route optimization"
        )
    
    # Initialize route optimizer
    print("Initializing route optimizer...")
    optimizer = RouteOptimizer()
    
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
                'longitude': pkg.longitude
            })
        else:
            print(f"Warning: Package {pkg.kargo_id} has no coordinates")
    
    print(f"Converted {len(package_data)} packages with valid coordinates")
    
    if not package_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No packages with valid coordinates found"
        )
    
    # Optimize route
    print("Starting route optimization...")
    try:
        optimized_route = optimizer.optimize_route(package_data)
        print("Route optimization completed successfully")
    except Exception as e:
        print(f"Route optimization failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Route optimization failed: {str(e)}"
        )
    
    # Save route to database
    print("Saving route to database...")
    route_data_json = json.dumps(optimized_route)
    db_route = DeliveryRoute(
        courier_id=current_user.id,
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
        estimated_duration=optimized_route['estimated_duration'],
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
