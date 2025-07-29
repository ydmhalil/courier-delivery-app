import * as Location from 'expo-location';
import { Alert } from 'react-native';

class LocationService {
  constructor() {
    this.locationPermission = null;
    this.currentLocation = null;
  }

  /**
   * Request location permissions
   */
  async requestLocationPermission() {
    try {
      console.log('📍 LocationService: Requesting location permission...');
      
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

      // Request permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      console.log('📍 LocationService: Permission status:', status);
      
      this.locationPermission = status;
      
      if (status !== 'granted') {
        Alert.alert(
          'Konum İzni Gerekli',
          'Başlangıç konumunu otomatik belirlemek için konum iznine ihtiyacımız var.',
          [{ text: 'Tamam' }]
        );
        return false;
      }

      console.log('✅ LocationService: Location permission granted');
      return true;
    } catch (error) {
      console.error('❌ LocationService: Error requesting permission:', error);
      Alert.alert('Hata', 'Konum izni alınırken bir hata oluştu.');
      return false;
    }
  }

  /**
   * Get current location
   */
  async getCurrentLocation() {
    try {
      console.log('📍 LocationService: Getting current location...');
      
      // Check permission first
      if (this.locationPermission !== 'granted') {
        const hasPermission = await this.requestLocationPermission();
        if (!hasPermission) {
          return null;
        }
      }

      // Get current position
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeout: 10000,
        maximumAge: 60000, // Cache for 1 minute
      });

      console.log('📍 LocationService: Current location:', location.coords);
      
      this.currentLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
        timestamp: new Date(location.timestamp),
      };

      return this.currentLocation;
    } catch (error) {
      console.error('❌ LocationService: Error getting current location:', error);
      
      if (error.code === 'E_LOCATION_TIMEOUT') {
        Alert.alert('Zaman Aşımı', 'Konum alınırken zaman aşımına uğradı. Tekrar deneyin.');
      } else if (error.code === 'E_LOCATION_UNAVAILABLE') {
        Alert.alert('Konum Bulunamadı', 'Konum servisleri şu anda kullanılamıyor.');
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
   * Watch location changes (for navigation)
   */
  async startLocationTracking(callback) {
    try {
      console.log('📍 LocationService: Starting location tracking...');
      
      // Check permission
      if (this.locationPermission !== 'granted') {
        const hasPermission = await this.requestLocationPermission();
        if (!hasPermission) {
          return null;
        }
      }

      // Start watching location
      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000, // Update every 5 seconds
          distanceInterval: 10, // Update every 10 meters
        },
        (location) => {
          console.log('📍 LocationService: Location updated:', location.coords);
          callback(location);
        }
      );

      return subscription;
    } catch (error) {
      console.error('❌ LocationService: Error starting location tracking:', error);
      return null;
    }
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
