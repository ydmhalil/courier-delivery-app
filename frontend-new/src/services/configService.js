import Constants from 'expo-constants';

/**
 * Configuration Service
 * Secure environment variable management
 */
class ConfigService {
  constructor() {
    this.config = this.loadConfig();
    this.validateConfig();
  }

  loadConfig() {
    // Get environment variables from Expo Constants
    const env = Constants.expoConfig?.extra || {};
    
    // Fallback to hardcoded values for development
    const fallbackConfig = {
      API_BASE_URL: 'http://192.168.1.108:8000',
      API_TIMEOUT: '15000',
      DEBUG_MODE: 'true',
      APP_VERSION: '1.0.0',
      LOCATION_TIMEOUT: '15000',
      LOCATION_ACCURACY: 'high'
    };
    
    return {
      // API Configuration with fallback
      apiBaseUrl: env.API_BASE_URL || fallbackConfig.API_BASE_URL,
      apiTimeout: parseInt(env.API_TIMEOUT || fallbackConfig.API_TIMEOUT),
      
      // App Configuration
      appName: env.APP_NAME || 'Cargo Delivery',
      appVersion: env.APP_VERSION || fallbackConfig.APP_VERSION,
      debugMode: (env.DEBUG_MODE || fallbackConfig.DEBUG_MODE) === 'true',
      
      // Location Settings
      locationTimeout: parseInt(env.LOCATION_TIMEOUT || fallbackConfig.LOCATION_TIMEOUT),
      locationAccuracy: env.LOCATION_ACCURACY || fallbackConfig.LOCATION_ACCURACY,
      
      // Google Cloud (for production)
      googleCloudProjectId: env.GOOGLE_CLOUD_PROJECT_ID,
      
      // Security
      enableSecurity: true,
      enableLogging: (env.DEBUG_MODE || fallbackConfig.DEBUG_MODE) === 'true',
      
      // Development vs Production
      isDevelopment: __DEV__,
      isProduction: !__DEV__
    };
  }

  validateConfig() {
    const required = ['apiBaseUrl'];
    const missing = required.filter(key => !this.config[key]);
    
    if (missing.length > 0) {
      console.error('❌ Config Error: Missing required configuration:', missing);
      throw new Error(`Missing required configuration: ${missing.join(', ')}`);
    }

    console.log('✅ Configuration loaded successfully');
    
    if (this.config.debugMode) {
      console.log('🔧 Debug Mode Configuration:', {
        apiBaseUrl: this.config.apiBaseUrl,
        appVersion: this.config.appVersion,
        isDevelopment: this.config.isDevelopment
      });
    }
  }

  get(key) {
    return this.config[key];
  }

  getApiConfig() {
    return {
      baseURL: this.config.apiBaseUrl,
      timeout: this.config.apiTimeout,
      headers: {
        'Content-Type': 'application/json',
        'X-App-Version': this.config.appVersion
      }
    };
  }

  getLocationConfig() {
    return {
      timeout: this.config.locationTimeout,
      accuracy: this.config.locationAccuracy
    };
  }

  isSecure() {
    return this.config.enableSecurity && this.config.isProduction;
  }

  shouldLog() {
    return this.config.enableLogging || this.config.debugMode;
  }
}

// Export singleton instance
export const configService = new ConfigService();
export default configService;
