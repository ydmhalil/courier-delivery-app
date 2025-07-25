import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { View as MapView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { routeService } from '../../services/routeService';

const RouteScreen = () => {
  const { loading: authLoading } = useAuth();
  const [route, setRoute] = useState(null);
  const [loading, setLoading] = useState(true);
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
      console.error('Error loading route:', error);
      Alert.alert('Error', 'Failed to load optimized route');
    } finally {
      setLoading(false);
    }
  };

  const getMarkerColor = (deliveryType) => {
    switch (deliveryType) {
      case 'express':
        return '#EF4444';
      case 'scheduled':
        return '#F59E0B';
      case 'standard':
        return '#10B981';
      default:
        return '#6B7280';
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

  const StopItem = ({ stop, index }) => (
    <View style={styles.stopItem}>
      <View style={styles.stopNumber}>
        <Text style={styles.stopNumberText}>{index + 1}</Text>
      </View>
      
      <View style={styles.stopContent}>
        <View style={styles.stopHeader}>
          <Text style={styles.stopId}>{stop.kargo_id}</Text>
          <View
            style={[
              styles.typeBadge,
              { backgroundColor: getMarkerColor(stop.delivery_type) },
            ]}
          >
            <Text style={styles.typeBadgeText}>{stop.delivery_type}</Text>
          </View>
        </View>
        
        <Text style={styles.recipientName}>{stop.recipient_name}</Text>
        <Text style={styles.stopAddress} numberOfLines={2}>
          {stop.address}
        </Text>
        
        {stop.estimated_arrival && (
          <View style={styles.arrivalTime}>
            <Ionicons name="time-outline" size={16} color="#6B7280" />
            <Text style={styles.arrivalText}>ETA: {stop.estimated_arrival}</Text>
          </View>
        )}
        
        {stop.time_window_start && stop.time_window_end && (
          <View style={styles.timeWindow}>
            <Ionicons name="calendar-outline" size={16} color="#6B7280" />
            <Text style={styles.timeWindowText}>
              {stop.time_window_start} - {stop.time_window_end}
            </Text>
          </View>
        )}
      </View>
    </View>
  );

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
          Add packages to generate an optimized delivery route
        </Text>
        <TouchableOpacity style={styles.refreshButton} onPress={loadOptimizedRoute}>
          <Ionicons name="refresh" size={20} color="white" />
          <Text style={styles.refreshButtonText}>Refresh Route</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Optimized Route</Text>
        <TouchableOpacity style={styles.refreshIconButton} onPress={loadOptimizedRoute}>
          <Ionicons name="refresh" size={24} color="#3B82F6" />
        </TouchableOpacity>
      </View>

      {/* Map */}
      <View style={styles.mapContainer}>
        <View style={styles.map}>
          <Text style={styles.mapPlaceholderText}>
            Map functionality temporarily disabled{'\n'}
            Route optimization working in background
          </Text>
        </View>
      </View>

      {/* Route Stats */}
      <RouteStats />

      {/* Stops List */}
      <ScrollView style={styles.stopsContainer} showsVerticalScrollIndicator={false}>
        <Text style={styles.stopsTitle}>Route Stops</Text>
        {route.stops.map((stop, index) => (
          <StopItem key={stop.package_id} stop={stop} index={index} />
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
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  refreshIconButton: {
    padding: 8,
  },
  mapContainer: {
    height: 300,
    backgroundColor: 'white',
  },
  map: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
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
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'white',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
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
  stopsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  stopItem: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  stopNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stopNumberText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  stopContent: {
    flex: 1,
  },
  stopHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  stopId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  recipientName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  stopAddress: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 8,
  },
  arrivalTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  arrivalText: {
    fontSize: 13,
    color: '#6B7280',
  },
  timeWindow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeWindowText: {
    fontSize: 13,
    color: '#6B7280',
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
  mapPlaceholderText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default RouteScreen;
