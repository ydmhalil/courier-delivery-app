import requests
import json

# Test login with the real IP address
data = {
    "email": "test@test.com",
    "password": "test123"
}

try:
    # Test with real IP
    response = requests.post(
        'http://192.168.1.108:8000/auth/login', 
        json=data,
        headers={'Content-Type': 'application/json'}
    )
    print(f'Status: {response.status_code}')
    print(f'Response: {response.text}')
    
    if response.status_code == 200:
        print("✅ Backend accessible from real IP!")
    else:
        print("❌ Backend not accessible from real IP")
        
except Exception as e:
    print(f'❌ Error connecting to real IP: {e}')
    
# Also test health endpoint
try:
    health_response = requests.get('http://192.168.1.108:8000/health')
    print(f'Health check: {health_response.status_code} - {health_response.text}')
except Exception as e:
    print(f'❌ Health check failed: {e}')
