import axios from 'axios';

// For development - replace with your computer's IP address
// Run 'ipconfig' in terminal to find your IPv4 Address
const API_BASE_URL = 'http://192.168.1.108:8000'; // Update this with your actual IP

class RouteService {
  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  setAuthToken(token) {
    console.log('🗺️ RouteService: Setting auth token:', !!token);
    if (token) {
      this.api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      console.log('🗺️ RouteService: Authorization header set');
    } else {
      delete this.api.defaults.headers.common['Authorization'];
      console.log('🗺️ RouteService: Authorization header removed');
    }
  }

  async getOptimizedRoute(date = null) {
    console.log('🗺️ RouteService: Getting optimized route...');
    console.log('🗺️ RouteService: Date parameter:', date);
    console.log('🗺️ RouteService: Auth header:', this.api.defaults.headers.common['Authorization']);
    const params = date ? { route_date: date } : {};
    const response = await this.api.get('/api/routes', { params });
    console.log('🗺️ RouteService: Route response:', response.data);
    return response.data;
  }

  async getRouteHistory() {
    const response = await this.api.get('/api/routes/history');
    return response.data;
  }

  async testRoute() {
    console.log('🧪 RouteService: Testing route endpoint...');
    console.log('🧪 RouteService: Base URL:', this.api.defaults.baseURL);
    console.log('🧪 RouteService: Full URL will be:', `${this.api.defaults.baseURL}/api/routes/test`);
    const response = await this.api.get('/api/routes/test');
    console.log('🧪 RouteService: Test response:', response.data);
    return response.data;
  }
}

export const routeService = new RouteService();
