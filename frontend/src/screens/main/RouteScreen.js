import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import LocationSelectorModal from '../../components/LocationSelectorModal';

const RouteScreen = () => {
  const { user, authLoading } = useAuth();
  const [route, setRoute] = useState(null);
  const [loading, setLoading] = useState(false);
  const [startingLocation, setStartingLocation] = useState(null);
  const [showLocationSelector, setShowLocationSelector] = useState(false);
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

  const loadOptimizedRouteWithLocation = useCallback(async (startLocation) => {
    try {
      console.log('🗺️ RouteScreen: Loading optimized route with custom start location...');
      console.log('🗺️ RouteScreen: Custom start location:', startLocation);
      
      setLoading(true);
      const routeData = await routeService.getOptimizedRoute(null, startLocation);
      console.log('🗺️ RouteScreen: Route data received with custom start:', routeData);
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
      console.error('🗺️ RouteScreen: Error loading route with custom start:', error);
      Alert.alert('Error', `Error loading route with custom start: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleLocationSelected = useCallback((location) => {
    console.log('📍 Starting location selected:', location);
    setStartingLocation(location);
    setShowLocationSelector(false);
    
    // Update map region to show selected location
    setMapRegion({
      latitude: location.latitude,
      longitude: location.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    });
    
    // Reload route with new starting location
    loadOptimizedRouteWithLocation(location);
  }, [loadOptimizedRouteWithLocation]);

  const handleCloseLocationSelector = useCallback(() => {
    setShowLocationSelector(false);
  }, []);

  // Net ve ayrışmış renk sistemi
  const getMarkerColor = (deliveryType, status) => {
    // Teslimat durumu her zaman öncelikli (tek renk)
    if (status === 'delivered') {
      return '#10B981'; // Yeşil - her teslim başarılı aynı renk
    } else if (status === 'failed') {
      return '#374151'; // Koyu gri - her başarısız aynı renk
    } else if (status === 'in_transit') {
      return '#8B5CF6'; // Mor - her yolda olan aynı renk
    }
    
    // Beklemede olanlar için sadece kargo tipine göre renk
    switch (deliveryType?.toLowerCase()) {
      case 'express':
        return '#EF4444'; // Kırmızı - ekspres (acil)
      case 'scheduled':
        return '#F97316'; // Turuncu - zamanlanmış
      case 'standard':
        return '#3B82F6'; // Mavi - standart
      case 'depot':
        return '#6B7280'; // Gri - depo
      default:
        return '#9CA3AF'; // Açık gri - bilinmeyen
    }
  };

  // Basit ve anlaşılır icon sistemi
  const getMarkerIcon = (deliveryType, status) => {
    // Teslimat durumuna göre icon
    if (status === 'delivered') {
      return 'checkmark-circle'; // ✅ Teslim edildi
    } else if (status === 'failed') {
      return 'close-circle'; // ❌ Başarısız
    } else if (status === 'in_transit') {
      return 'car'; // 🚗 Yolda
    } 
    
    // Depo için özel icon
    if (deliveryType?.toLowerCase() === 'depot') {
      return 'business'; // 🏢 Depo
    }
    
    // Beklemede olanlar için basit icon
    return 'location'; // 📍 Varsayılan konum
  };

  const handleStopPress = (stop) => {
    console.log('=== STOP PRESS DEBUG ===');
    console.log('📍 Stop pressed:', stop.kargo_id);
    console.log('📍 Coordinates:', stop.latitude, stop.longitude);
    console.log('========================');
    
    try {
      // Validate coordinates
      if (!stop.latitude || !stop.longitude) {
        console.error('❌ Invalid coordinates for stop:', stop.kargo_id);
        Alert.alert('Error', 'Invalid location coordinates');
        return;
      }
      
      // Calculate zoom level based on stop type
      const zoomLevel = stop.type === 'depot' ? 0.01 : 0.003;
      
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
        mapRef.current.animateToRegion(newRegion, 1000);
        // Update state AFTER animation starts
        setTimeout(() => setMapRegion(newRegion), 100);
      } else {
        console.error('❌ MapRef is null!');
        setMapRegion(newRegion);
      }
      
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
          <Text style={styles.statLabel}>Duraklar</Text>
        </View>
      </View>
      
      <View style={styles.statItem}>
        <Ionicons name="car-outline" size={20} color="#10B981" />
        <View>
          <Text style={styles.statValue}>{route?.total_distance?.toFixed(1) || 0} km</Text>
          <Text style={styles.statLabel}>Mesafe</Text>
        </View>
      </View>
      
      <View style={styles.statItem}>
        <Ionicons name="time-outline" size={20} color="#F59E0B" />
        <View>
          <Text style={styles.statValue}>{route?.estimated_duration || 0} dk</Text>
          <Text style={styles.statLabel}>Süre</Text>
        </View>
      </View>
    </View>
  );

  // Ayrışmış Renk Rehberi - Durum ve Tip Ayrı
  const ColorLegend = () => (
    <View style={styles.legendContainer}>
      <Text style={styles.legendTitle}>Harita Rehberi</Text>
      
      {/* Teslimat Durumları - Öncelikli */}
      <View style={styles.legendSection}>
        <Text style={styles.legendSectionTitle}>Teslimat Durumu (Öncelikli)</Text>
        <View style={styles.legendRow}>
          <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
          <Text style={styles.legendText}>Teslim Edildi</Text>
        </View>
        <View style={styles.legendRow}>
          <View style={[styles.legendDot, { backgroundColor: '#374151' }]} />
          <Text style={styles.legendText}>Başarısız</Text>
        </View>
        <View style={styles.legendRow}>
          <View style={[styles.legendDot, { backgroundColor: '#8B5CF6' }]} />
          <Text style={styles.legendText}>Yolda</Text>
        </View>
      </View>

      {/* Kargo Tipleri - Sadece Beklemedekiler */}
      <View style={styles.legendSection}>
        <Text style={styles.legendSectionTitle}>Kargo Tipi (Beklemedekiler)</Text>
        <View style={styles.legendRow}>
          <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
          <Text style={styles.legendText}>Express (Acil)</Text>
        </View>
        <View style={styles.legendRow}>
          <View style={[styles.legendDot, { backgroundColor: '#F97316' }]} />
          <Text style={styles.legendText}>Zamanlanmış</Text>
        </View>
        <View style={styles.legendRow}>
          <View style={[styles.legendDot, { backgroundColor: '#3B82F6' }]} />
          <Text style={styles.legendText}>Standart</Text>
        </View>
        <View style={styles.legendRow}>
          <View style={[styles.legendDot, { backgroundColor: '#6B7280' }]} />
          <Text style={styles.legendText}>Depo</Text>
        </View>
      </View>
    </View>
  );

  // Modern ve bilgilendirici durak kartı
  const ModernStopCard = ({ stop, index }) => {
    const isDepot = stop.kargo_id === 'DEPOT';
    
    const getDeliveryTypeColor = (type) => {
      switch (type?.toLowerCase()) {
        case 'express':
          return '#EF4444'; // Kırmızı
        case 'scheduled':
          return '#F97316'; // Turuncu
        case 'standard':
          return '#3B82F6'; // Mavi
        default:
          return '#6B7280'; // Gri
      }
    };

    const getDeliveryTypeLabel = (type) => {
      switch (type?.toLowerCase()) {
        case 'express':
          return 'Express';
        case 'scheduled':
          return 'Zamanlanmış';
        case 'standard':
          return 'Standart';
        default:
          return 'Bilinmeyen';
      }
    };

    const getStatusLabel = (status) => {
      switch (status?.toLowerCase()) {
        case 'delivered':
          return 'Teslim Edildi';
        case 'failed':
          return 'Başarısız';
        case 'in_transit':
          return 'Yolda';
        case 'pending':
          return 'Beklemede';
        default:
          return 'Beklemede';
      }
    };

    const getStatusColor = (status) => {
      switch (status?.toLowerCase()) {
        case 'delivered':
          return '#10B981'; // Yeşil
        case 'failed':
          return '#374151'; // Koyu gri
        case 'in_transit':
          return '#8B5CF6'; // Mor
        default:
          return '#6B7280'; // Gri
      }
    };
    
    return (
      <TouchableOpacity 
        style={styles.modernStopCard}
        onPress={() => handleStopPress(stop)}
        activeOpacity={0.7}
      >
        <View style={styles.stopCardHeader}>
          <View style={styles.stopNumberContainer}>
            <Text style={styles.stopNumber}>{index + 1}</Text>
          </View>
          
          <View style={styles.stopMainInfo}>
            <Text style={styles.stopTitle}>
              {isDepot ? '🏢 Depo' : `📦 ${stop.kargo_id}`}
            </Text>
            {!isDepot && (
              <Text style={styles.stopRecipient}>{stop.recipient_name}</Text>
            )}
          </View>

          <View style={styles.stopBadges}>
            {!isDepot && (
              <>
                <View style={[styles.typeBadge, { backgroundColor: getDeliveryTypeColor(stop.delivery_type) }]}>
                  <Ionicons 
                    name={getMarkerIcon(stop.delivery_type, stop.status)} 
                    size={12} 
                    color="#fff" 
                  />
                  <Text style={styles.typeBadgeText}>
                    {getDeliveryTypeLabel(stop.delivery_type)}
                  </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(stop.status) }]}>
                  <Text style={styles.statusBadgeText}>
                    {getStatusLabel(stop.status)}
                  </Text>
                </View>
              </>
            )}
          </View>
        </View>
        
        <Text style={styles.stopAddress}>{stop.address}</Text>
        
        {!isDepot && (
          <View style={styles.stopFooter}>
            <View style={styles.stopDistance}>
              <Ionicons name="location-outline" size={14} color="#6B7280" />
              <Text style={styles.stopDistanceText}>
                {stop.distance_from_previous?.toFixed(1) || 0} km
              </Text>
            </View>
            
            {stop.time_window_start && (
              <View style={styles.stopTimeWindow}>
                <Ionicons name="time-outline" size={14} color="#6B7280" />
                <Text style={styles.stopTimeWindowText}>
                  {stop.time_window_start} - {stop.time_window_end}
                </Text>
              </View>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Rota yükleniyor...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Harita */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          region={mapRegion}
          onRegionChangeComplete={setMapRegion}
        >
          {route?.stops?.map((stop, index) => (
            <Marker
              key={stop.kargo_id || `stop-${index}`}
              coordinate={{
                latitude: parseFloat(stop.latitude),
                longitude: parseFloat(stop.longitude),
              }}
              title={stop.kargo_id === 'DEPOT' ? 'Depo' : stop.kargo_id}
              description={stop.address}
              pinColor={getMarkerColor(stop.delivery_type, stop.status)}
              onPress={() => handleStopPress(stop)}
            >
              <View style={[
                styles.customMarker,
                { backgroundColor: getMarkerColor(stop.delivery_type, stop.status) }
              ]}>
                <Text style={styles.markerNumber}>{index + 1}</Text>
              </View>
            </Marker>
          ))}
        </MapView>
        
        {/* Harita Kontrolları */}
        <View style={styles.mapControls}>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => setShowLocationSelector(true)}
          >
            <Ionicons name="location" size={24} color="#3B82F6" />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.controlButton}
            onPress={loadOptimizedRoute}
          >
            <Ionicons name="refresh" size={24} color="#3B82F6" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Alt panel */}
      <View style={styles.bottomPanel}>
        {/* İstatistikler */}
        <RouteStats />
        
        {/* Renk rehberi */}
        <ColorLegend />

        {/* Durak listesi */}
        <ScrollView style={styles.stopsContainer} showsVerticalScrollIndicator={false}>
          <Text style={styles.stopsTitle}>
            Rota Durakları ({route?.stops?.length || 0})
          </Text>
          
          {route?.stops?.map((stop, index) => (
            <ModernStopCard 
              key={stop.kargo_id || `stop-${index}`} 
              stop={stop} 
              index={index} 
            />
          ))}
        </ScrollView>
      </View>

      {/* Konum seçici modal */}
      <LocationSelectorModal
        visible={showLocationSelector}
        onLocationSelected={handleLocationSelected}
        onClose={handleCloseLocationSelector}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    fontSize: 18,
    color: '#6B7280',
    fontWeight: '500',
  },
  mapContainer: {
    flex: 0.6,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  customMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  markerNumber: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  mapControls: {
    position: 'absolute',
    top: 20,
    right: 20,
    gap: 10,
  },
  controlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bottomPanel: {
    flex: 0.4,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingBottom: 15,
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
  legendContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  legendTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 10,
  },
  legendSection: {
    marginBottom: 15,
  },
  legendSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  legendDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  legendIcon: {
    position: 'absolute',
  },
  legendText: {
    fontSize: 13,
    color: '#4B5563',
  },
  stopsContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  stopsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 15,
    marginTop: 10,
  },
  modernStopCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  stopCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  stopNumberContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stopNumber: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  stopMainInfo: {
    flex: 1,
  },
  stopTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  stopRecipient: {
    fontSize: 14,
    color: '#6B7280',
  },
  stopBadges: {
    gap: 6,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  typeBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  stopAddress: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    marginBottom: 10,
  },
  stopFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stopDistance: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stopDistanceText: {
    fontSize: 12,
    color: '#6B7280',
  },
  stopTimeWindow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stopTimeWindowText: {
    fontSize: 12,
    color: '#6B7280',
  },
});

export default RouteScreen;
