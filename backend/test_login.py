import requests
import json

# Test login with JSON
data = {
    "email": "test@test.com",
    "password": "test123"
}

try:
    response = requests.post(
        'http://localhost:8000/auth/login', 
        json=data,
        headers={'Content-Type': 'application/json'}
    )
    print(f'Status: {response.status_code}')
    print(f'Response: {response.text}')
    
    if response.status_code == 200:
        token_data = response.json()
        token = token_data['access_token']
        print(f'Token received: {token[:50]}...')
        
        # Test authenticated endpoint
        auth_headers = {'Authorization': f'Bearer {token}'}
        me_response = requests.get('http://localhost:8000/auth/me', headers=auth_headers)
        print(f'Me endpoint: {me_response.status_code}')
        print(f'Me response: {me_response.text}')
        
except Exception as e:
    print(f'Error: {e}')
