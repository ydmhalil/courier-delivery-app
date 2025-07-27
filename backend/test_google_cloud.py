import os
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv
load_dotenv()

from services.google_cloud_optimizer import GoogleCloudRouteOptimizer

def test_google_cloud():
    print("=== Google Cloud Route Optimizer Test ===")
    
    # Check environment variables
    project_id = os.getenv('GOOGLE_CLOUD_PROJECT_ID')
    credentials_path = os.getenv('GOOGLE_APPLICATION_CREDENTIALS')
    
    print(f"Project ID: {project_id}")
    print(f"Credentials Path: {credentials_path}")
    print(f"Credentials file exists: {os.path.exists(credentials_path) if credentials_path else 'No path'}")
    
    # Initialize optimizer
    optimizer = GoogleCloudRouteOptimizer(project_id, credentials_path)
    
    print(f"Google Cloud Available: {optimizer.is_available()}")
    
    if optimizer.is_available():
        print("✅ Google Cloud Route Optimization API is READY!")
        
        # Test with sample data
        test_packages = [
            {
                'id': 1,
                'kargo_id': 'TEST001',
                'address': 'Test Address 1',
                'recipient_name': 'Test Recipient 1',
                'delivery_type': 'standard',
                'latitude': 41.0082,
                'longitude': 28.9784,
                'weight': 1,
                'volume': 1
            },
            {
                'id': 2,
                'kargo_id': 'TEST002',
                'address': 'Test Address 2',
                'recipient_name': 'Test Recipient 2',
                'delivery_type': 'standard',
                'latitude': 41.0182,
                'longitude': 28.9884,
                'weight': 1,
                'volume': 1
            }
        ]
        
        depot = {
            'latitude': 41.0082,
            'longitude': 28.9784,
            'address': 'Test Depot'
        }
        
        try:
            result = optimizer.optimize_route(test_packages, depot)
            print(f"✅ Test optimization completed!")
            print(f"   Distance: {result['total_distance_km']:.1f}km")
            print(f"   Duration: {result['total_duration_minutes']:.0f}min")
            print(f"   API Used: {result.get('api_used', 'unknown')}")
        except Exception as e:
            print(f"❌ Test optimization failed: {e}")
    else:
        print("❌ Google Cloud Route Optimization API is NOT available")
        print("Checking possible issues:")
        
        if not project_id:
            print("  - Missing GOOGLE_CLOUD_PROJECT_ID")
        if not credentials_path:
            print("  - Missing GOOGLE_APPLICATION_CREDENTIALS")
        elif not os.path.exists(credentials_path):
            print(f"  - Credentials file not found: {credentials_path}")

if __name__ == "__main__":
    test_google_cloud()
