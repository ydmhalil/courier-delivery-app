# Courier Delivery Management System

A comprehensive mobile application for couriers to manage optimized cargo deliveries with AI-powered route optimization and QR code data processing.

## 🚀 Features

- **Authentication System**: Secure JWT-based login/registration for couriers
- **Dashboard**: Daily delivery summary with quick actions and statistics
- **QR Code Scanner**: Instant package addition via QR code scanning
- **Package Management**: Full CRUD operations for delivery packages
- **AI Route Optimization**: Google OR-Tools powered route optimization with priority handling
- **Interactive Maps**: Real-time route visualization with React Native Maps
- **Responsive Design**: Mobile-first design with intuitive navigation

## 🏗️ Architecture

### Frontend (React Native + Expo)
- **Framework**: React Native with Expo
- **Navigation**: React Navigation (Stack + Bottom Tabs)
- **State Management**: React Context API
- **Styling**: Custom styles (Tailwind-inspired)
- **Maps**: React Native Maps
- **QR Scanner**: Expo Barcode Scanner

### Backend (FastAPI + Python)
- **Framework**: FastAPI with Python
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Authentication**: JWT tokens
- **Route Optimization**: Google OR-Tools
- **Geocoding**: Geopy library
- **API Documentation**: Auto-generated OpenAPI/Swagger

## 📦 Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- Python 3.8+
- PostgreSQL
- Expo CLI
- Android Studio / Xcode (for device testing)

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   venv\Scripts\activate  # On Windows
   # source venv/bin/activate  # On macOS/Linux
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Setup PostgreSQL Database**
   ```bash
   # Create database
   createdb courier_db
   
   # Create user (optional)
   psql -c "CREATE USER courier_user WITH PASSWORD 'courier_pass';"
   psql -c "GRANT ALL PRIVILEGES ON DATABASE courier_db TO courier_user;"
   ```

5. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env file with your database credentials
   ```

6. **Run database migrations**
   ```bash
   # The app will create tables automatically on startup
   ```

7. **Start the backend server**
   ```bash
   python main.py
   ```
   The API will be available at `http://localhost:8000`

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npx expo start
   ```

4. **Run on device/simulator**
   - Install Expo Go app on your mobile device
   - Scan the QR code from the terminal
   - Or press 'a' for Android emulator, 'i' for iOS simulator

## 🎯 API Endpoints

### Authentication
- `POST /auth/register` - Register new courier
- `POST /auth/login` - Login courier
- `GET /auth/me` - Get current user info
- `POST /auth/reset-password` - Reset password

### Packages
- `GET /api/packages` - Get all packages
- `POST /api/packages` - Create new package
- `POST /api/packages/qr-scan` - Create package from QR code
- `GET /api/packages/{id}` - Get package details
- `PUT /api/packages/{id}` - Update package
- `DELETE /api/packages/{id}` - Delete package

### Routes
- `GET /api/routes` - Get optimized route
- `GET /api/routes/history` - Get route history

## 📱 QR Code Data Format

```json
{
  "kargo_id": "PKT123456",
  "alici": "Ahmet Yılmaz",
  "adres": "İlkadım Mah. Atatürk Cad. No:15, Samsun",
  "telefon": "0555 123 45 67",
  "teslimat_turu": "express",
  "zaman_penceresi": ["10:00", "18:00"]
}
```

## 🤖 AI Route Optimization

The system uses Google OR-Tools for intelligent route optimization with:

- **Priority Handling**: Express > Scheduled > Standard deliveries
- **Time Windows**: Respect scheduled delivery time constraints
- **Distance Optimization**: Minimize total travel distance
- **Real-time Adaptation**: Dynamic route updates based on package status

### Priority Logic
1. **Express**: High penalty if not delivered (priority 1)
2. **Scheduled**: Must be delivered within time window (priority 2)
3. **Standard**: Flexible delivery timing (priority 3)

## 🎨 UI/UX Design

- **Color Coding**:
  - Express: Red (#EF4444)
  - Scheduled: Amber (#F59E0B)
  - Standard: Green (#10B981)

- **Navigation**: Bottom tab navigation with intuitive icons
- **Maps**: Interactive delivery route visualization
- **Responsive**: Mobile-optimized interface

## 🔧 Development

### Adding New Features

1. **Backend**: Add new endpoints in `routers/`
2. **Frontend**: Create new screens in `src/screens/`
3. **Services**: Add API calls in `src/services/`
4. **Navigation**: Update navigation in `src/navigation/`

### Database Schema

- **Couriers**: User authentication and profile
- **Packages**: Delivery package information
- **Routes**: Optimized delivery routes

## 🧪 Testing

### Sample QR Codes for Testing

```json
// Express Delivery
{
  "kargo_id": "PKT001",
  "alici": "John Doe",
  "adres": "123 Main St, New York, NY",
  "telefon": "+1-555-0123",
  "teslimat_turu": "express",
  "zaman_penceresi": null
}

// Scheduled Delivery
{
  "kargo_id": "PKT002",
  "alici": "Jane Smith",
  "adres": "456 Oak Ave, Los Angeles, CA",
  "telefon": "+1-555-0456",
  "teslimat_turu": "scheduled",
  "zaman_penceresi": ["14:00", "16:00"]
}

// Standard Delivery
{
  "kargo_id": "PKT003",
  "alici": "Bob Johnson",
  "adres": "789 Pine Rd, Chicago, IL",
  "telefon": "+1-555-0789",
  "teslimat_turu": "standard",
  "zaman_penceresi": null
}
```

### Test User Credentials

Create a test user by registering through the app or use the API:

```json
{
  "email": "test@courier.com",
  "password": "password123",
  "full_name": "Test Courier",
  "phone": "+1-555-0000"
}
```

## 📚 API Documentation

Once the backend is running, visit:
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

## 🔒 Security

- JWT-based authentication
- Password hashing with bcrypt
- CORS configuration for cross-origin requests
- Input validation and sanitization

## 🚀 Deployment

### Backend Deployment
1. Configure production database
2. Set environment variables
3. Deploy to cloud provider (AWS, Google Cloud, etc.)

### Frontend Deployment
1. Build for production: `expo build`
2. Deploy to app stores or web

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Add tests
5. Submit pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Check the API documentation
- Review the code comments
- Create an issue in the repository

---

**Built with ❤️ for efficient courier delivery management**
