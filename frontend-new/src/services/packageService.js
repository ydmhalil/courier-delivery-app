import axios from 'axios';

const API_BASE_URL = 'http://192.168.1.108:8000';

class PackageService {
  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    // Add request interceptor to include auth token
    this.api.interceptors.request.use((config) => {
      // The auth token will be set by AuthService
      return config;
    });
  }

  setAuthToken(token) {
    console.log('📦 PackageService: Setting auth token:', !!token);
    if (token) {
      this.api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      console.log('📦 PackageService: Authorization header set');
    } else {
      delete this.api.defaults.headers.common['Authorization'];
      console.log('📦 PackageService: Authorization header removed');
    }
  }

  async getAllPackages() {
    console.log('📦 PackageService: Getting all packages...');
    console.log('📦 PackageService: Auth header:', this.api.defaults.headers.common['Authorization']);
    const response = await this.api.get('/api/packages');
    return response.data;
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

  // Helper method to process QR code data
  processQRData(qrCodeText) {
    try {
      const qrData = JSON.parse(qrCodeText);
      
      // Validate required fields
      if (!qrData.kargo_id || !qrData.alici || !qrData.adres) {
        throw new Error('Invalid QR code data');
      }
      
      return {
        kargo_id: qrData.kargo_id,
        alici: qrData.alici,
        adres: qrData.adres,
        telefon: qrData.telefon || '',
        teslimat_turu: qrData.teslimat_turu || 'standard',
        zaman_penceresi: qrData.zaman_penceresi || null
      };
    } catch (error) {
      throw new Error('Invalid QR code format');
    }
  }
}

export const packageService = new PackageService();
