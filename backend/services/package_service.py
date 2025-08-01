from sqlalchemy.orm import Session
from models.package import Package, PackageStatus
from typing import List, Dict, Any
import logging

logger = logging.getLogger(__name__)

class PackageService:
    def __init__(self, db: Session):
        self.db = db
    
    def get_packages_by_courier(self, courier_id: int) -> List[Dict[str, Any]]:
        """Get all packages for a specific courier"""
        try:
            packages = self.db.query(Package).filter(Package.courier_id == courier_id).all()
            
            # Convert to dict for easier processing
            package_list = []
            for package in packages:
                package_dict = {
                    'id': package.id,
                    'status': package.status.value if package.status else 'pending',
                    'delivery_type': package.delivery_type.value if package.delivery_type else 'standard',
                    'customer_name': package.recipient_name,
                    'customer_address': package.address,
                    'customer_phone': package.phone,
                    'latitude': package.latitude,
                    'longitude': package.longitude,
                    'created_at': package.created_at,
                    'delivered_at': getattr(package, 'delivered_at', None)
                }
                package_list.append(package_dict)
            
            return package_list
            
        except Exception as e:
            logger.error(f"Error getting packages for courier {courier_id}: {e}")
            return []
    
    def get_packages_stats(self, courier_id: int) -> Dict[str, Any]:
        """Get package statistics for a courier"""
        try:
            total = self.db.query(Package).filter(Package.courier_id == courier_id).count()
            delivered = self.db.query(Package).filter(
                Package.courier_id == courier_id,
                Package.status == PackageStatus.DELIVERED
            ).count()
            pending = self.db.query(Package).filter(
                Package.courier_id == courier_id,
                Package.status.in_([PackageStatus.PENDING, PackageStatus.IN_TRANSIT])
            ).count()
            failed = self.db.query(Package).filter(
                Package.courier_id == courier_id,
                Package.status == PackageStatus.FAILED
            ).count()
            
            return {
                'total': total,
                'delivered': delivered,
                'pending': pending,
                'failed': failed,
                'success_rate': (delivered / total * 100) if total > 0 else 0
            }
            
        except Exception as e:
            logger.error(f"Error getting package stats for courier {courier_id}: {e}")
            return {'total': 0, 'delivered': 0, 'pending': 0, 'failed': 0, 'success_rate': 0}
