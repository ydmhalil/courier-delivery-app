import * as Location from 'expo-location';
import { Alert } from 'react-native';
import { configService } from './configService';

class LocationService {
  constructor() {
    this.locationPermission = null;
    this.currentLocation = null;
    this.locationCache = new Map(); // Performance: Cache locations
    this.watchSubscription = null;
    this.isTracking = false;
    
    // Configuration from config service
    this.config = configService.getLocationConfig();
    this.shouldLog = configService.shouldLog();
    
    // Performance: Debounce location updates
    this.lastLocationUpdate = 0;
    this.UPDATE_THROTTLE = 2000; // 2 seconds minimum between updates
  }

  /**
   * Request location permissions with enhanced error handling
   */
  async requestLocationPermission() {
    try {
      if (this.shouldLog) {
        console.log('📍 LocationService: Requesting location permission...');
      }
      
      // Check if location services are enabled
      const enabled = await Location.hasServicesEnabledAsync();
      if (!enabled) {
        Alert.alert(
          'Konum Servisleri Kapalı',
          'Lütfen cihazınızın konum servislerini açın.',
          [{ text: 'Tamam' }]
        );
        return false;
      }

      // Request permission with error handling
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        
        if (this.shouldLog) {
          console.log('📍 LocationService: Permission status:', status);
        }
        
        this.locationPermission = status;
        
        if (status !== 'granted') {
          Alert.alert(
            'Konum İzni Gerekli',
            'Başlangıç konumunu otomatik belirlemek için konum iznine ihtiyacımız var.',
            [{ text: 'Tamam' }]
          );
          return false;
        }

        if (this.shouldLog) {
          console.log('✅ LocationService: Location permission granted');
        }
        return true;
        
      } catch (permissionError) {
        console.error('❌ LocationService: Permission request failed:', permissionError);
        Alert.alert(
          'İzin Hatası', 
          'Konum izni alınırken bir hata oluştu. Lütfen uygulama ayarlarından izin verin.'
        );
        return false;
      }
      
    } catch (error) {
      console.error('❌ LocationService: Critical error requesting permission:', error);
      Alert.alert('Kritik Hata', 'Konum servisleri kullanılamıyor.');
      return false;
    }
  }

  /**
   * Get current location with caching and error recovery
   */
  async getCurrentLocation(useCache = true) {
    try {
      if (this.shouldLog) {
        console.log('📍 LocationService: Getting current location...');
      }
      
      // Check cache first for performance
      const cacheKey = 'current_location';
      if (useCache && this.locationCache.has(cacheKey)) {
        const cached = this.locationCache.get(cacheKey);
        const cacheAge = Date.now() - cached.timestamp.getTime();
        
        // Use cache if less than 1 minute old
        if (cacheAge < 60000) {
          if (this.shouldLog) {
            console.log('📍 LocationService: Using cached location:', cached);
          }
          return cached;
        }
      }
      
      // Check permission first
      if (this.locationPermission !== 'granted') {
        const hasPermission = await this.requestLocationPermission();
        if (!hasPermission) {
          return null;
        }
      }

      // Get current position with configuration
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeout: this.config.timeout,
        maximumAge: 60000, // Cache for 1 minute
      });

      if (this.shouldLog) {
        console.log('📍 LocationService: Current location obtained:', location.coords);
      }
      
      this.currentLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
        timestamp: new Date(location.timestamp),
      };

      // Cache the location
      this.locationCache.set(cacheKey, this.currentLocation);

      return this.currentLocation;
    } catch (error) {
      console.error('❌ LocationService: Error getting current location:', error);
      
      // Enhanced error handling
      if (error.code === 'E_LOCATION_TIMEOUT') {
        Alert.alert(
          'Zaman Aşımı', 
          'Konum alınırken zaman aşımına uğradı. Tekrar deneyin.',
          [
            { text: 'Tekrar Dene', onPress: () => this.getCurrentLocation(false) },
            { text: 'İptal', style: 'cancel' }
          ]
        );
      } else if (error.code === 'E_LOCATION_UNAVAILABLE') {
        Alert.alert(
          'Konum Bulunamadı', 
          'Konum servisleri şu anda kullanılamıyor. GPS açık olduğundan emin olun.'
        );
      } else if (error.code === 'E_LOCATION_PERMISSION_DENIED') {
        Alert.alert(
          'İzin Reddedildi',
          'Konum izni reddedildi. Ayarlardan izin verebilirsiniz.',
          [
            { text: 'Ayarlara Git', onPress: () => this.requestLocationPermission() },
            { text: 'İptal', style: 'cancel' }
          ]
        );
      } else {
        Alert.alert('Hata', 'Konum alınırken bir hata oluştu.');
      }
      
      return null;
    }
  }

  /**
   * Convert coordinates to address using reverse geocoding
   */
  async getAddressFromCoordinates(latitude, longitude) {
    try {
      console.log('🗺️ LocationService: Getting address for coordinates:', latitude, longitude);
      
      const addresses = await Location.reverseGeocodeAsync({
        latitude,
        longitude
      });

      if (addresses && addresses.length > 0) {
        const address = addresses[0];
        console.log('🗺️ LocationService: Address found:', address);
        
        // Format address string
        const formattedAddress = [
          address.name,
          address.street,
          address.district,
          address.city,
          address.region
        ].filter(Boolean).join(', ');

        return {
          formatted: formattedAddress || 'Bilinmeyen Adres',
          details: address
        };
      }
      
      return {
        formatted: 'Adres Bulunamadı',
        details: null
      };
    } catch (error) {
      console.error('❌ LocationService: Error getting address:', error);
      return {
        formatted: 'Adres Alınamadı',
        details: null
      };
    }
  }

  /**
   * Watch location changes with throttling and memory management
   */
  async startLocationTracking(callback) {
    try {
      if (this.shouldLog) {
        console.log('📍 LocationService: Starting location tracking...');
      }
      
      // Prevent multiple tracking sessions
      if (this.isTracking) {
        console.warn('⚠️ LocationService: Tracking already in progress');
        return this.watchSubscription;
      }
      
      // Check permission
      if (this.locationPermission !== 'granted') {
        const hasPermission = await this.requestLocationPermission();
        if (!hasPermission) {
          return null;
        }
      }

      // Start watching location with throttling
      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000, // Update every 5 seconds
          distanceInterval: 10, // Update every 10 meters
        },
        (location) => {
          const now = Date.now();
          
          // Throttle updates to prevent excessive calls
          if (now - this.lastLocationUpdate < this.UPDATE_THROTTLE) {
            return;
          }
          
          this.lastLocationUpdate = now;
          
          if (this.shouldLog) {
            console.log('📍 LocationService: Location updated:', location.coords);
          }
          
          // Update current location
          this.currentLocation = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy,
            timestamp: new Date(location.timestamp),
          };
          
          // Cache the location
          this.locationCache.set('current_location', this.currentLocation);
          
          // Call the callback
          callback(location);
        }
      );

      this.watchSubscription = subscription;
      this.isTracking = true;
      
      if (this.shouldLog) {
        console.log('✅ LocationService: Location tracking started');
      }

      return subscription;
    } catch (error) {
      console.error('❌ LocationService: Error starting location tracking:', error);
      this.isTracking = false;
      return null;
    }
  }

  /**
   * Stop location tracking and cleanup
   */
  async stopLocationTracking() {
    try {
      if (this.watchSubscription) {
        this.watchSubscription.remove();
        this.watchSubscription = null;
      }
      
      this.isTracking = false;
      
      if (this.shouldLog) {
        console.log('🛑 LocationService: Location tracking stopped');
      }
    } catch (error) {
      console.error('❌ LocationService: Error stopping location tracking:', error);
    }
  }

  /**
   * Clear location cache for memory management
   */
  clearCache() {
    this.locationCache.clear();
    if (this.shouldLog) {
      console.log('🧹 LocationService: Cache cleared');
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: this.locationCache.size,
      isTracking: this.isTracking,
      hasPermission: this.locationPermission === 'granted',
      lastUpdate: this.lastLocationUpdate
    };
  }

  /**
   * Check if location permission is granted
   */
  async hasLocationPermission() {
    const { status } = await Location.getForegroundPermissionsAsync();
    return status === 'granted';
  }
}

// Export singleton instance
export const locationService = new LocationService();
