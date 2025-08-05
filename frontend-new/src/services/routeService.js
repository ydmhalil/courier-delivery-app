import axios from 'axios';
import configService from './configService';

// Environment variable'dan API URL'i al
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || configService.getApiConfig().baseURL;

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

  async getOptimizedRoute(date = null, startingLocation = null) {
    console.log('🗺️ RouteService: Getting optimized route...');
    console.log('🗺️ RouteService: Date parameter:', date);
    console.log('🗺️ RouteService: Starting location:', startingLocation);
    console.log('🗺️ RouteService: Auth header:', this.api.defaults.headers.common['Authorization']);
    
    const params = {};
    if (date) params.route_date = date;
    if (startingLocation) {
      params.start_lat = startingLocation.latitude;
      params.start_lng = startingLocation.longitude;
      params.start_address = startingLocation.name || startingLocation.address || 'Selected Location';
    }
    
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
