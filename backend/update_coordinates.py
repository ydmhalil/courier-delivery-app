"""
Update existing packages with Istanbul coordinates
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal
from models.package import Package

def update_package_coordinates():
    db = SessionLocal()
    
    try:
        # Istanbul coordinates for each Kadıköy area
        coordinates_map = {
            "KDK001": {"latitude": 40.9877, "longitude": 29.0283},  # Fenerbahçe
            "KDK002": {"latitude": 40.9742, "longitude": 29.0865},  # Kozyatağı  
            "KDK003": {"latitude": 40.9755, "longitude": 29.0348},  # Göztepe
            "KDK004": {"latitude": 40.9877, "longitude": 29.0249},  # Moda
            "KDK005": {"latitude": 40.9764, "longitude": 29.0405},  # Caddebostan
            "KDK006": {"latitude": 40.9703, "longitude": 29.0437},  # Erenköy
            "KDK007": {"latitude": 40.9634, "longitude": 29.0513},  # Suadiye
            "KDK008": {"latitude": 40.9551, "longitude": 29.0621},  # Bostancı
            "KDK009": {"latitude": 40.9883, "longitude": 29.0394},  # Acıbadem
            "KDK010": {"latitude": 40.9987, "longitude": 29.0519}   # Fikirtepe
        }
        
        # Update each package
        for kargo_id, coords in coordinates_map.items():
            package = db.query(Package).filter(Package.kargo_id == kargo_id).first()
            if package:
                package.latitude = coords["latitude"]
                package.longitude = coords["longitude"]
                print(f"✅ Updated {kargo_id}: {coords['latitude']}, {coords['longitude']}")
            else:
                print(f"❌ Package {kargo_id} not found")
        
        db.commit()
        print("\n🎉 All package coordinates updated successfully!")
        
        # Verify updates
        print("\n📍 Verification:")
        packages = db.query(Package).all()
        for pkg in packages:
            if pkg.latitude and pkg.longitude:
                print(f"✅ {pkg.kargo_id}: ({pkg.latitude}, {pkg.longitude})")
            else:
                print(f"❌ {pkg.kargo_id}: No coordinates")
                
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    update_package_coordinates()
