import axios from 'axios';
import { configService } from './configService';
import { errorService } from './errorService';
import { validationService } from './validationService';

class PackageService {
  constructor() {
    // Get API configuration from config service
    const apiConfig = configService.getApiConfig();
    
    this.api = axios.create(apiConfig);
    
    this.shouldLog = configService.shouldLog();
    
    // Add request interceptor
    this.api.interceptors.request.use(
      (config) => {
        if (this.shouldLog) {
          console.log('📦 PackageService Request:', config.method?.toUpperCase(), config.url);
        }
        return config;
      },
      (error) => {
        errorService.handleError(error, 'PackageService Request');
        return Promise.reject(error);
      }
    );
    
    // Add response interceptor
    this.api.interceptors.response.use(
      (response) => {
        if (this.shouldLog) {
          console.log('📦 PackageService Response:', response.status, response.config.url);
        }
        return response;
      },
      (error) => {
        const errorInfo = errorService.handleError(error, 'PackageService Response', { silent: true });
        
        // Add retry logic for network errors
        if (errorInfo.category === 'Network' && !error.config._retry) {
          error.config._retry = true;
          if (this.shouldLog) {
            console.log('📦 PackageService: Retrying request...');
          }
          return this.api.request(error.config);
        }
        
        return Promise.reject(error);
      }
    );
  }

  setAuthToken(token) {
    if (this.shouldLog) {
      console.log('📦 PackageService: Setting auth token:', !!token);
    }
    
    if (token) {
      this.api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete this.api.defaults.headers.common['Authorization'];
    }
  }

  async getAllPackages() {
    try {
      if (this.shouldLog) {
        console.log('📦 PackageService: Getting all packages...');
        console.log('📦 PackageService: Auth header:', this.api.defaults.headers.common['Authorization']);
      }
      
      const response = await this.api.get('/api/packages');
      
      if (this.shouldLog) {
        console.log('📦 PackageService: Packages retrieved:', response.data?.length || 0);
      }
      
      return response.data || [];
    } catch (error) {
      if (this.shouldLog) {
        console.error('📦 PackageService: Error getting packages:', error);
      }
      
      // Let error service handle the error
      errorService.handleError(error, 'Package Service - Get All Packages', { silent: true });
      throw error;
    }
  }

  async getPackageById(id) {
    const response = await this.api.get(`/api/packages/${id}`);
    return response.data;
  }

  async createPackage(packageData) {
    const response = await this.api.post('/api/packages', packageData);
    return response.data;
  }

  async createPackageFromQR(qrData) {
    const response = await this.api.post('/api/packages/qr-scan', qrData);
    return response.data;
  }

  async updatePackage(id, updates) {
    const response = await this.api.put(`/api/packages/${id}`, updates);
    return response.data;
  }

  async deletePackage(id) {
    const response = await this.api.delete(`/api/packages/${id}`);
    return response.data;
  }

  async updateDeliveryStatus(id, deliveryUpdate) {
    const response = await this.api.patch(`/api/packages/${id}/delivery-status`, deliveryUpdate);
    return response.data;
  }

  async getDeliveryStats() {
    const response = await this.api.get('/api/packages/delivery-stats');
    return response.data;
  }

  // Enhanced QR code processing with validation
  processQRData(qrCodeText) {
    try {
      if (this.shouldLog) {
        console.log('📱 PackageService: Processing QR data...');
      }
      
      // Use validation service for comprehensive validation
      const validationResult = validationService.validateQRData(qrCodeText);
      
      if (!validationResult.isValid) {
        throw new Error(validationResult.error);
      }
      
      const qrData = validationResult.data;
      
      // Log warnings if any
      if (validationResult.warnings.length > 0 && this.shouldLog) {
        console.warn('⚠️ QR Data Warnings:', validationResult.warnings);
      }
      
      // Process coordinate data with validation
      let coordinates = null;
      if (qrData.latitude && qrData.longitude) {
        const coordValidation = validationService.validateCoordinates(qrData.latitude, qrData.longitude);
        
        if (coordValidation.isValid) {
          coordinates = {
            latitude: qrData.latitude,
            longitude: qrData.longitude
          };
          
          if (this.shouldLog) {
            console.log('📍 PackageService: Valid coordinates found in QR:', coordinates);
          }
        } else {
          console.warn('❌ PackageService: Invalid coordinates in QR:', coordValidation.errors);
        }
      }
      
      // Build processed data structure
      const processedData = {
        kargo_id: qrData.kargo_id,
        alici: qrData.alici,
        adres: qrData.adres,
        telefon: qrData.telefon || '',
        teslimat_turu: qrData.teslimat_turu || 'standard',
        zaman_penceresi: qrData.zaman_penceresi || null,
        // Coordinate data for route optimization and mapping
        latitude: coordinates?.latitude || null,
        longitude: coordinates?.longitude || null,
        koordinatlar: coordinates, // Alternative field name for compatibility
        // Additional metadata
        geocode_required: !coordinates, // True if coordinates missing and geocoding needed
        validation_warnings: validationResult.warnings,
        processed_at: new Date().toISOString()
      };
      
      if (this.shouldLog) {
        console.log('✅ PackageService: QR data processed successfully:', {
          kargo_id: processedData.kargo_id,
          has_coordinates: !!coordinates,
          warnings_count: validationResult.warnings.length
        });
      }
      
      return processedData;
      
    } catch (error) {
      errorService.handleError(error, 'QR Processing');
      throw error;
    }
  }
}

export const packageService = new PackageService();
