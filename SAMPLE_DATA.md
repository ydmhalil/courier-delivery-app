# Sample QR Codes for Testing

Generate QR codes with the following JSON data for testing the application:

## Express Delivery Sample
```json
{
  "kargo_id": "PKT001",
  "alici": "John Doe",
  "adres": "123 Main Street, New York, NY 10001",
  "telefon": "+1-555-0123",
  "teslimat_turu": "express",
  "zaman_penceresi": null
}
```

## Scheduled Delivery Sample
```json
{
  "kargo_id": "PKT002",
  "alici": "Jane Smith",
  "adres": "456 Oak Avenue, Los Angeles, CA 90210",
  "telefon": "+1-555-0456",
  "teslimat_turu": "scheduled",
  "zaman_penceresi": ["14:00", "16:00"]
}
```

## Standard Delivery Sample
```json
{
  "kargo_id": "PKT003",
  "alici": "Bob Johnson",
  "adres": "789 Pine Road, Chicago, IL 60601",
  "telefon": "+1-555-0789",
  "teslimat_turu": "standard",
  "zaman_penceresi": null
}
```

## Turkish Sample (Original Format)
```json
{
  "kargo_id": "PKT004",
  "alici": "Ahmet Yılmaz",
  "adres": "İlkadım Mah. Atatürk Cad. No:15, Samsun",
  "telefon": "0555 123 45 67",
  "teslimat_turu": "express",
  "zaman_penceresi": ["10:00", "18:00"]
}
```

## How to Generate QR Codes

1. Copy one of the JSON samples above
2. Go to any QR code generator website (e.g., qr-code-generator.com)
3. Paste the JSON data
4. Generate the QR code
5. Save or print the QR code
6. Use the mobile app to scan it

## API Testing with Postman/cURL

### Register a new courier:
```bash
curl -X POST "http://localhost:8000/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@courier.com",
    "password": "password123",
    "full_name": "Test Courier",
    "phone": "+1-555-0000"
  }'
```

### Login:
```bash
curl -X POST "http://localhost:8000/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@courier.com",
    "password": "password123"
  }'
```

### Add a package manually:
```bash
curl -X POST "http://localhost:8000/api/packages" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "kargo_id": "PKT123",
    "recipient_name": "Test Recipient",
    "address": "123 Test Street, Test City",
    "phone": "+1-555-1234",
    "delivery_type": "standard"
  }'
```

### Get optimized route:
```bash
curl -X GET "http://localhost:8000/api/routes" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```
