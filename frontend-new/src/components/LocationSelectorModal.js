import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { locationService } from '../services/locationService';

const { width, height } = Dimensions.get('window');

const LocationSelectorModal = ({ visible, onLocationSelected, onClose }) => {
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [loadingCurrentLocation, setLoadingCurrentLocation] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState('');
  const [mapRegion, setMapRegion] = useState({
    latitude: 41.0082,
    longitude: 28.9784,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  // Predefined locations
  const predefinedLocations = [
    { id: 1, name: 'Istanbul Merkez Depo', latitude: 41.0082, longitude: 28.9784, icon: 'business' },
  ];

  // Get current location
  const handleGetCurrentLocation = useCallback(async () => {
    setLoadingCurrentLocation(true);
    try {
      const location = await locationService.getCurrentLocation();
      if (location) {
        setCurrentLocation(location);
        setSelectedLocation({
          latitude: location.latitude,
          longitude: location.longitude,
          name: 'Mevcut Konumum'
        });
        
        // Update map region
        setMapRegion({
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });

        // Get address
        const addressInfo = await locationService.getAddressFromCoordinates(
          location.latitude,
          location.longitude
        );
        setSelectedAddress(addressInfo.formatted);
      }
    } catch (error) {
      console.error('Error getting current location:', error);
    } finally {
      setLoadingCurrentLocation(false);
    }
  }, []);

  // Handle map press (tap to select location)
  const handleMapPress = useCallback(async (event) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    
    console.log('📍 Map pressed at:', latitude, longitude);
    
    setSelectedLocation({
      latitude,
      longitude,
      name: 'Seçilen Konum'
    });

    // Get address for selected location
    const addressInfo = await locationService.getAddressFromCoordinates(latitude, longitude);
    setSelectedAddress(addressInfo.formatted);
  }, []);

  // Handle predefined location selection
  const handlePredefinedLocationPress = useCallback((location) => {
    setSelectedLocation(location);
    setSelectedAddress(location.name);
    
    setMapRegion({
      latitude: location.latitude,
      longitude: location.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    });
  }, []);

  // Confirm selection
  const handleConfirmSelection = useCallback(() => {
    if (selectedLocation) {
      const locationData = {
        ...selectedLocation,
        address: selectedAddress,
        name: selectedLocation.name
      };
      onLocationSelected(locationData);
      onClose();
    } else {
      Alert.alert('Uyarı', 'Lütfen bir konum seçin.');
    }
  }, [selectedLocation, selectedAddress, onLocationSelected, onClose]);

  // Reset state when modal opens
  useEffect(() => {
    if (visible) {
      setSelectedLocation(null);
      setSelectedAddress('');
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.title}>Başlangıç Konumu Seç</Text>
          <TouchableOpacity 
            onPress={handleConfirmSelection}
            style={[styles.confirmButton, !selectedLocation && styles.confirmButtonDisabled]}
            disabled={!selectedLocation}
          >
            <Text style={[styles.confirmButtonText, !selectedLocation && styles.confirmButtonTextDisabled]}>
              Seç
            </Text>
          </TouchableOpacity>
        </View>

        {/* Selected Location Info */}
        {selectedLocation && (
          <View style={styles.selectedLocationInfo}>
            <Ionicons name="location" size={20} color="#007AFF" />
            <Text style={styles.selectedLocationText} numberOfLines={2}>
              {selectedAddress || selectedLocation.name}
            </Text>
          </View>
        )}

        {/* Map */}
        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            region={mapRegion}
            onPress={handleMapPress}
            showsUserLocation={true}
            showsMyLocationButton={false}
          >
            {selectedLocation && (
              <Marker
                coordinate={{
                  latitude: selectedLocation.latitude,
                  longitude: selectedLocation.longitude,
                }}
                title={selectedLocation.name}
                description={selectedAddress}
                pinColor="#007AFF"
              />
            )}
          </MapView>
          
          {/* Map Instructions */}
          <View style={styles.mapInstructions}>
            <Text style={styles.mapInstructionsText}>
              Harita üzerinde dokunarak konum seçin
            </Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={styles.currentLocationButton}
            onPress={handleGetCurrentLocation}
            disabled={loadingCurrentLocation}
          >
            {loadingCurrentLocation ? (
              <ActivityIndicator size="small" color="#007AFF" />
            ) : (
              <Ionicons name="locate" size={20} color="#007AFF" />
            )}
            <Text style={styles.currentLocationButtonText}>
              {loadingCurrentLocation ? 'Alınıyor...' : 'Mevcut Konum'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Predefined Locations */}
        <View style={styles.locationsContainer}>
          <Text style={styles.sectionTitle}>Merkez Depo</Text>
          <View style={styles.locationsList}>
            {predefinedLocations.map((location) => (
              <TouchableOpacity
                key={location.id}
                style={[
                  styles.locationCard,
                  selectedLocation?.id === location.id && styles.locationCardSelected
                ]}
                onPress={() => handlePredefinedLocationPress(location)}
              >
                <Ionicons 
                  name={location.icon} 
                  size={24} 
                  color={selectedLocation?.id === location.id ? '#007AFF' : '#666'} 
                />
                <Text style={[
                  styles.locationCardText,
                  selectedLocation?.id === location.id && styles.locationCardTextSelected
                ]}>
                  {location.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    paddingTop: 50, // Account for status bar
  },
  closeButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  confirmButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  confirmButtonDisabled: {
    backgroundColor: '#E0E0E0',
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  confirmButtonTextDisabled: {
    color: '#999',
  },
  selectedLocationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F0F8FF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  selectedLocationText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  mapInstructions: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  mapInstructionsText: {
    color: '#fff',
    fontSize: 12,
    textAlign: 'center',
  },
  quickActions: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  currentLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F8FF',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  currentLocationButtonText: {
    marginLeft: 8,
    color: '#007AFF',
    fontWeight: '500',
  },
  locationsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  locationsList: {
    alignItems: 'center',
  },
  locationCard: {
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#F9F9F9',
    minWidth: 120,
  },
  locationCardSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F8FF',
  },
  locationCardText: {
    marginTop: 4,
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  locationCardTextSelected: {
    color: '#007AFF',
    fontWeight: '500',
  },
});

export default LocationSelectorModal;
