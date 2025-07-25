import axios from 'axios';

const API_BASE_URL = 'http://192.168.1.108:8000';

class AuthService {
  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  setAuthToken(token) {
    if (token) {
      this.api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete this.api.defaults.headers.common['Authorization'];
    }
  }

  async login(email, password) {
    const response = await this.api.post('/auth/login', {
      email,
      password,
    });
    return response.data;
  }

  async register(userData) {
    const response = await this.api.post('/auth/register', userData);
    return response.data;
  }

  async getCurrentUser() {
    const response = await this.api.get('/auth/me');
    return response.data;
  }

  async resetPassword(email) {
    const response = await this.api.post('/auth/reset-password', { email });
    return response.data;
  }
}

export const authService = new AuthService();
