from sqlalchemy.orm import Session
from typing import Dict, List, Any, Optional
import logging
from datetime import datetime, timedelta

from models.package import Package, PackageStatus, DeliveryType
from models.courier import Courier

logger = logging.getLogger(__name__)

class DatabaseService:
    """Comprehensive database service for AI chatbot"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_full_courier_context(self, courier_id: int) -> Dict[str, Any]:
        """Get comprehensive courier data for AI context"""
        try:
            context = {}
            
            # Courier basic info
            courier = self.db.query(Courier).filter(Courier.id == courier_id).first()
            if courier:
                context['courier_info'] = {
                    'name': courier.full_name,
                    'email': courier.email,
                    'phone': courier.phone,
                    'id': courier.id
                }
            
            # All packages
            packages = self.db.query(Package).filter(Package.courier_id == courier_id).all()
            
            # Package statistics
            context['package_stats'] = {
                'total': len(packages),
                'pending': len([p for p in packages if p.status == PackageStatus.PENDING]),
                'in_transit': len([p for p in packages if p.status == PackageStatus.IN_TRANSIT]),
                'delivered': len([p for p in packages if p.status == PackageStatus.DELIVERED]),
                'failed': len([p for p in packages if p.status == PackageStatus.FAILED])
            }
            
            # Undelivered count
            context['package_stats']['undelivered'] = (
                context['package_stats']['pending'] + 
                context['package_stats']['in_transit']
            )
            
            # Package details
            context['packages'] = []
            for package in packages:
                package_data = {
                    'id': package.id,
                    'kargo_id': package.kargo_id,
                    'recipient_name': package.recipient_name,
                    'address': package.address,
                    'phone': package.phone,
                    'status': package.status.value if package.status else 'unknown',
                    'delivery_type': package.delivery_type.value if package.delivery_type else 'standard',
                    'time_window_start': package.time_window_start,
                    'time_window_end': package.time_window_end,
                    'latitude': package.latitude,
                    'longitude': package.longitude,
                    'created_at': package.created_at.isoformat() if package.created_at else None
                }
                context['packages'].append(package_data)
            
            # Delivery areas analysis
            areas = {}
            districts = {}
            for package in packages:
                if package.address:
                    address_parts = package.address.split(',')
                    if len(address_parts) >= 2:
                        district = address_parts[-2].strip()
                        districts[district] = districts.get(district, 0) + 1
                        
                        if len(address_parts) >= 3:
                            area = address_parts[-3].strip()
                            areas[area] = areas.get(area, 0) + 1
            
            context['delivery_areas'] = {
                'districts': districts,
                'areas': areas,
                'total_areas': len(areas),
                'total_districts': len(districts)
            }
            
            # Time-based analysis
            today = datetime.now().date()
            yesterday = today - timedelta(days=1)
            this_week_start = today - timedelta(days=today.weekday())
            
            today_packages = [p for p in packages if p.created_at and p.created_at.date() == today]
            yesterday_packages = [p for p in packages if p.created_at and p.created_at.date() == yesterday]
            week_packages = [p for p in packages if p.created_at and p.created_at.date() >= this_week_start]
            
            context['time_analysis'] = {
                'today_count': len(today_packages),
                'yesterday_count': len(yesterday_packages),
                'this_week_count': len(week_packages),
                'today_delivered': len([p for p in today_packages if p.status == PackageStatus.DELIVERED]),
                'week_delivered': len([p for p in week_packages if p.status == PackageStatus.DELIVERED])
            }
            
            # Delivery type analysis
            express_count = len([p for p in packages if p.delivery_type == DeliveryType.EXPRESS])
            scheduled_count = len([p for p in packages if p.delivery_type == DeliveryType.SCHEDULED])
            standard_count = len([p for p in packages if p.delivery_type == DeliveryType.STANDARD])
            
            context['delivery_types'] = {
                'express': express_count,
                'scheduled': scheduled_count,
                'standard': standard_count
            }
            
            # Problem packages (failed deliveries)
            failed_packages = [p for p in packages if p.status == PackageStatus.FAILED]
            context['problem_packages'] = len(failed_packages)
            
            return context
            
        except Exception as e:
            logger.error(f"Error getting courier context: {e}")
            return {}
    
    def search_packages(self, courier_id: int, query: str) -> List[Dict[str, Any]]:
        """Search packages by various criteria"""
        try:
            packages = self.db.query(Package).filter(Package.courier_id == courier_id).all()
            
            query_lower = query.lower()
            matching_packages = []
            
            for package in packages:
                # Search in recipient name, address, kargo_id
                searchable_text = (
                    f"{package.recipient_name or ''} "
                    f"{package.address or ''} "
                    f"{package.kargo_id or ''} "
                    f"{package.phone or ''}"
                ).lower()
                
                if query_lower in searchable_text:
                    matching_packages.append({
                        'id': package.id,
                        'kargo_id': package.kargo_id,
                        'recipient_name': package.recipient_name,
                        'address': package.address,
                        'phone': package.phone,
                        'status': package.status.value if package.status else 'unknown',
                        'delivery_type': package.delivery_type.value if package.delivery_type else 'standard'
                    })
            
            return matching_packages
            
        except Exception as e:
            logger.error(f"Error searching packages: {e}")
            return []
    
    def get_packages_by_area(self, courier_id: int, area: str) -> List[Dict[str, Any]]:
        """Get packages for a specific area/district"""
        try:
            packages = self.db.query(Package).filter(Package.courier_id == courier_id).all()
            
            area_lower = area.lower()
            area_packages = []
            
            for package in packages:
                if package.address and area_lower in package.address.lower():
                    area_packages.append({
                        'id': package.id,
                        'kargo_id': package.kargo_id,
                        'recipient_name': package.recipient_name,
                        'address': package.address,
                        'status': package.status.value if package.status else 'unknown',
                        'delivery_type': package.delivery_type.value if package.delivery_type else 'standard'
                    })
            
            return area_packages
            
        except Exception as e:
            logger.error(f"Error getting packages by area: {e}")
            return []
    
    def get_packages_by_status(self, courier_id: int, status: str) -> List[Dict[str, Any]]:
        """Get packages by status"""
        try:
            status_map = {
                'bekleyen': PackageStatus.PENDING,
                'pending': PackageStatus.PENDING,
                'yolda': PackageStatus.IN_TRANSIT,
                'in_transit': PackageStatus.IN_TRANSIT,
                'teslim': PackageStatus.DELIVERED,
                'delivered': PackageStatus.DELIVERED,
                'başarısız': PackageStatus.FAILED,
                'failed': PackageStatus.FAILED
            }
            
            target_status = status_map.get(status.lower())
            if not target_status:
                return []
            
            packages = self.db.query(Package).filter(
                Package.courier_id == courier_id,
                Package.status == target_status
            ).all()
            
            result = []
            for package in packages:
                result.append({
                    'id': package.id,
                    'kargo_id': package.kargo_id,
                    'recipient_name': package.recipient_name,
                    'address': package.address,
                    'phone': package.phone,
                    'delivery_type': package.delivery_type.value if package.delivery_type else 'standard'
                })
            
            return result
            
        except Exception as e:
            logger.error(f"Error getting packages by status: {e}")
            return []
