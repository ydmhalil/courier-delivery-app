import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { routeService } from '../../services/routeService';

const RouteScreen = () => {
  const { user, authLoading } = useAuth();
  const [route, setRoute] = useState(null);
  const [loading, setLoading] = useState(false);
  const mapRef = useRef(null);
  const [mapRegion, setMapRegion] = useState({
    latitude: 41.0082,
    longitude: 28.9784, // Istanbul coordinates as default
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  useEffect(() => {
    // Only load data after auth loading is complete
    if (!authLoading) {
      loadOptimizedRoute();
    }
  }, [authLoading]);

  const loadOptimizedRoute = async () => {
    try {
      console.log('🗺️ RouteScreen: Loading optimized route...');
      console.log('🗺️ RouteScreen: AuthLoading:', authLoading);
      
      // First test if route endpoint is reachable
      console.log('🧪 Testing route endpoint...');
      const testResult = await routeService.testRoute();
      console.log('🧪 Test result:', testResult);
      
      setLoading(true);
      const routeData = await routeService.getOptimizedRoute();
      console.log('🗺️ RouteScreen: Route data received:', routeData);
      setRoute(routeData);
      
      if (routeData.stops && routeData.stops.length > 0) {
        // Calculate map region to fit all stops
        const latitudes = routeData.stops.map(stop => stop.latitude);
        const longitudes = routeData.stops.map(stop => stop.longitude);
        
        const minLat = Math.min(...latitudes);
        const maxLat = Math.max(...latitudes);
        const minLng = Math.min(...longitudes);
        const maxLng = Math.max(...longitudes);
        
        setMapRegion({
          latitude: (minLat + maxLat) / 2,
          longitude: (minLng + maxLng) / 2,
          latitudeDelta: (maxLat - minLat) * 1.3,
          longitudeDelta: (maxLng - minLng) * 1.3,
        });
      }
    } catch (error) {
      console.error('🗺️ RouteScreen: Error loading route:', error);
      Alert.alert('Error', `Error loading route: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getMarkerColor = (deliveryType) => {
    switch (deliveryType) {
      case 'EXPRESS':
      case 'express':
        return '#EF4444'; // Red for express
      case 'SCHEDULED':
      case 'scheduled':
        return '#F59E0B'; // Orange for scheduled
      case 'STANDARD':
      case 'standard':
        return '#10B981'; // Green for standard
      case 'depot':
        return '#2563EB'; // Blue for depot
      default:
        return '#6B7280'; // Gray for unknown
    }
  };

  const handleStopPress = (stop) => {
    console.log('=== STOP PRESS DEBUG ===');
    console.log('📍 Stop pressed:', stop.kargo_id);
    console.log('📍 Coordinates:', stop.latitude, stop.longitude);
    console.log('📍 Stop type:', stop.type);
    console.log('========================');
    
    try {
      // Validate coordinates
      if (!stop.latitude || !stop.longitude) {
        console.error('❌ Invalid coordinates for stop:', stop.kargo_id);
        Alert.alert('Error', 'Invalid location coordinates');
        return;
      }
      
      // Calculate zoom level based on stop type
      const zoomLevel = stop.type === 'depot' ? 0.01 : 0.003; // Smaller zoom for better view
      
      const newRegion = {
        latitude: parseFloat(stop.latitude),
        longitude: parseFloat(stop.longitude),
        latitudeDelta: zoomLevel,
        longitudeDelta: zoomLevel,
      };
      
      console.log('🗺️ New region:', newRegion);
      
      // Animate map to the selected stop
      if (mapRef.current) {
        console.log('✅ MapRef found, starting animation');
        mapRef.current.animateToRegion(newRegion, 500); // Even faster
      } else {
        console.error('❌ MapRef is null!');
        // Fallback: just update region
        setMapRegion(newRegion);
      }
      
      // Always update map region state
      setMapRegion(newRegion);
      
    } catch (error) {
      console.error('❌ Error in handleStopPress:', error);
      Alert.alert('Error', 'Failed to navigate to stop');
    }
  };

  const RouteStats = () => (
    <View style={styles.statsContainer}>
      <View style={styles.statItem}>
        <Ionicons name="location-outline" size={20} color="#3B82F6" />
        <View>
          <Text style={styles.statValue}>{route?.stops?.length || 0}</Text>
          <Text style={styles.statLabel}>Stops</Text>
        </View>
      </View>
      
      <View style={styles.statItem}>
        <Ionicons name="car-outline" size={20} color="#10B981" />
        <View>
          <Text style={styles.statValue}>{route?.total_distance?.toFixed(1) || 0} km</Text>
          <Text style={styles.statLabel}>Distance</Text>
        </View>
      </View>
      
      <View style={styles.statItem}>
        <Ionicons name="time-outline" size={20} color="#F59E0B" />
        <View>
          <Text style={styles.statValue}>{route?.estimated_duration || 0} min</Text>
          <Text style={styles.statLabel}>Duration</Text>
        </View>
      </View>
    </View>
  );

  // TEST: En basit tıklanabilir item
  const SimpleStopItem = ({ stop, index }) => {
    console.log('🎨 SimpleStopItem rendered for:', stop.kargo_id);
    
    return (
      <TouchableOpacity 
        onPress={() => {
          console.log('🔥🔥🔥 TOUCHED!', stop.kargo_id);
          Alert.alert('Tıklandı!', `${stop.kargo_id} tıklandı!`);
          handleStopPress(stop);
        }}
        style={styles.simpleStopItem}
        activeOpacity={0.5}
      >
        <Text style={styles.simpleStopText}>
          {index}. {stop.kargo_id} - TIKLA BENİ!
        </Text>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Optimizing route...</Text>
      </View>
    );
  }

  if (!route || !route.stops || route.stops.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="map-outline" size={64} color="#D1D5DB" />
        <Text style={styles.emptyTitle}>No route available</Text>
        <Text style={styles.emptySubtitle}>
          No packages found for route optimization. Please check back later.
        </Text>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={loadOptimizedRoute}
        >
          <Ionicons name="refresh" size={20} color="white" />
          <Text style={styles.refreshButtonText}>Refresh</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>📍 Route Overview</Text>
        <TouchableOpacity
          style={styles.refreshIcon}
          onPress={loadOptimizedRoute}
        >
          <Ionicons name="refresh" size={24} color="#3B82F6" />
        </TouchableOpacity>
      </View>

      {/* Map */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          region={mapRegion}
          onRegionChangeComplete={setMapRegion}
        >
          {/* Depot Marker */}
          <Marker
            coordinate={{
              latitude: 40.9877,
              longitude: 29.0283,
            }}
            title="🏢 DEPOT - Kadıköy Kargo Merkezi"
            description="Starting point - All deliveries begin here"
          >
            <View
              style={[
                styles.depotMarkerContainer,
                { backgroundColor: getMarkerColor('depot') },
              ]}
            >
              <Text style={styles.depotMarkerText}>🏢</Text>
            </View>
          </Marker>
          
          {/* Route Markers */}
          {route.stops
            .filter(stop => stop.kargo_id !== 'DEPOT') // Don't show depot in numbered markers
            .map((stop, index) => (
            <Marker
              key={stop.package_id || stop.id}
              coordinate={{
                latitude: stop.latitude,
                longitude: stop.longitude,
              }}
              title={`${stop.sequence}. ${stop.kargo_id}`}
              description={`${stop.recipient_name} - ${stop.delivery_type.toUpperCase()}`}
            >
              <View
                style={[
                  styles.markerContainer,
                  { backgroundColor: getMarkerColor(stop.delivery_type) },
                ]}
              >
                <Text style={styles.markerText}>{stop.sequence}</Text>
              </View>
            </Marker>
          ))}
        </MapView>
      </View>

      {/* Route Stats */}
      <RouteStats />

      {/* Simple Stops List - TEST VERSION */}
      <ScrollView style={styles.stopsContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.stopsHeader}>
          <Text style={styles.stopsTitle}>TEST: Simple Clicks ({route.stops.length})</Text>
          <Text style={styles.stopsSubtitle}>Her birine tıkla - alert çıkmalı! 🔥</Text>
        </View>
        {route.stops
          .sort((a, b) => a.sequence - b.sequence)
          .map((stop, index) => (
          <SimpleStopItem 
            key={stop.package_id || stop.id || `stop-${index}`} 
            stop={stop} 
            index={index + 1}
          />
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  refreshIcon: {
    padding: 8,
  },
  mapContainer: {
    height: 300,
    margin: 16,
  },
  map: {
    flex: 1,
    borderRadius: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'white',
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  stopsContainer: {
    flex: 1,
    padding: 20,
  },
  stopsHeader: {
    marginBottom: 16,
  },
  stopsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  stopsSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  // TEST STYLES
  simpleStopItem: {
    backgroundColor: '#EF4444',
    padding: 20,
    marginBottom: 10,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#000',
  },
  simpleStopText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  markerContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  markerText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  depotMarkerContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
  },
  depotMarkerText: {
    fontSize: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  refreshButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default RouteScreen;
