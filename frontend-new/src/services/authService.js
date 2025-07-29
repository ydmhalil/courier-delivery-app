import axios from 'axios';
import { configService } from './configService';
import { errorService } from './errorService';

class AuthService {
  constructor() {
    // Get API configuration from config service
    const apiConfig = configService.getApiConfig();
    
    this.api = axios.create(apiConfig);
    this.shouldLog = configService.shouldLog();
    
    // Add request/response interceptors with enhanced error handling
    this.setupInterceptors();
  }

  setupInterceptors() {
    // Request interceptor
    this.api.interceptors.request.use(
      (config) => {
        if (this.shouldLog) {
          console.log('🔐 AuthService Request:', config.method?.toUpperCase(), config.url);
        }
        return config;
      },
      (error) => {
        errorService.handleError(error, 'AuthService Request');
        return Promise.reject(error);
      }
    );

    // Response interceptor with retry logic
    this.api.interceptors.response.use(
      (response) => {
        if (this.shouldLog) {
          console.log('🔐 AuthService Response:', response.status, response.config.url);
        }
        return response;
      },
      async (error) => {
        const errorInfo = errorService.handleError(error, 'AuthService Response', { silent: true });
        
        // Retry logic for network errors
        if (errorInfo.category === 'Network' && !error.config._retry) {
          error.config._retry = true;
          
          if (this.shouldLog) {
            console.log('🔐 AuthService: Retrying request after network error...');
          }
          
          // Wait 1 second before retry
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          try {
            return await this.api.request(error.config);
          } catch (retryError) {
            console.error('🔐 AuthService: Retry failed:', retryError);
          }
        }
        
        return Promise.reject(error);
      }
    );
  }

  setAuthToken(token) {
    if (this.shouldLog) {
      console.log('🔐 AuthService: Setting auth token:', !!token);
    }
    
    if (token) {
      this.api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete this.api.defaults.headers.common['Authorization'];
    }
  }

  async login(email, password) {
    try {
      if (this.shouldLog) {
        console.log('🔐 AuthService: Attempting login for:', email);
      }
      
      const response = await this.api.post('/auth/login', {
        email,
        password,
      });
      
      if (this.shouldLog) {
        console.log('✅ AuthService: Login successful');
      }
      
      return response.data;
    } catch (error) {
      // Backend'ten gelen detaylı hata mesajını kullan
      const errorMessage = error.response?.data?.detail || 'Giriş yapılırken bir hata oluştu';
      
      if (this.shouldLog) {
        console.log('❌ AuthService: Login failed:', errorMessage);
      }
      
      throw new Error(errorMessage);
    }
  }

  async register(userData) {
    try {
      if (this.shouldLog) {
        console.log('🔐 AuthService: Attempting registration for:', userData.email);
      }
      
      const response = await this.api.post('/auth/register', userData);
      
      if (this.shouldLog) {
        console.log('✅ AuthService: Registration successful');
      }
      
      return response.data;
    } catch (error) {
      // Backend'ten gelen detaylı hata mesajını kullan
      let errorMessage = 'Kayıt olurken bir hata oluştu';
      
      if (error.response?.data?.detail) {
        if (Array.isArray(error.response.data.detail)) {
          // Pydantic validation errors
          errorMessage = error.response.data.detail[0]?.msg || errorMessage;
        } else {
          // String error message
          errorMessage = error.response.data.detail;
        }
      }
      
      if (this.shouldLog) {
        console.log('❌ AuthService: Registration failed:', errorMessage);
      }
      
      throw new Error(errorMessage);
    }
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
