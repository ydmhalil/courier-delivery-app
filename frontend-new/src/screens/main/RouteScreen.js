import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import MapView, { Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../context/AuthContext';
import { routeService } from '../../services/routeService';
import LocationSelectorModal from '../../components/LocationSelectorModal';

const RouteScreen = ({ navigation }) => {
  const { user, authLoading } = useAuth();
  const [route, setRoute] = useState(null);
  const [loading, setLoading] = useState(false);
  const [startingLocation, setStartingLocation] = useState(null);
  const [depotLocation, setDepotLocation] = useState(null);
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
      loadDefaultDepot();
      loadOptimizedRoute();
    }
  }, [authLoading]);

  // Reload depot when screen comes into focus (user might have changed it in profile)
  useFocusEffect(
    useCallback(() => {
      if (!authLoading) {
        loadDefaultDepot();
      }
    }, [authLoading])
  );

  const loadDefaultDepot = async () => {
    try {
      const savedDepot = await AsyncStorage.getItem('defaultDepot');
      if (savedDepot) {
        const depot = JSON.parse(savedDepot);
        console.log('🏢 Loaded default depot from storage:', depot);
        setDepotLocation(depot);
        
        // Update map region to center on depot
        if (depot.latitude && depot.longitude) {
          setMapRegion({
            latitude: depot.latitude,
            longitude: depot.longitude,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          });
        }
      }
    } catch (error) {
      console.error('Error loading default depot:', error);
    }
  };

  const loadOptimizedRoute = async () => {
    try {
      console.log('🗺️ RouteScreen: Loading optimized route...');
      console.log('🗺️ RouteScreen: AuthLoading:', authLoading);
      
      // Load saved depot location for route optimization
      let depotLocation = null;
      try {
        const savedDepot = await AsyncStorage.getItem('defaultDepot');
        if (savedDepot) {
          depotLocation = JSON.parse(savedDepot);
          console.log('🏢 Using saved depot for route optimization:', depotLocation);
        }
      } catch (error) {
        console.error('Error loading depot for route:', error);
      }
      
      // First test if route endpoint is reachable
      console.log('🧪 Testing route endpoint...');
      const testResult = await routeService.testRoute();
      console.log('🧪 Test result:', testResult);
      
      setLoading(true);
      // Pass depot location to route service
      const routeData = await routeService.getOptimizedRoute(null, depotLocation);
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

  const handleRefreshRoute = useCallback(async () => {
    try {
      Alert.alert(
        '🔄 Rotayı Yenile',
        'Güncel teslimat durumlarına göre rota yeniden hesaplanacak. Devam etmek istiyor musunuz?',
        [
          { text: 'İptal', style: 'cancel' },
          { 
            text: 'Yenile', 
            onPress: async () => {
              try {
                if (startingLocation) {
                  await loadOptimizedRouteWithLocation(startingLocation);
                } else {
                  await loadOptimizedRoute();
                }
                Alert.alert('✅ Başarılı', 'Rota başarıyla güncellendi! Güncel teslimat durumları yansıtıldı.');
              } catch (error) {
                console.error('🔄 Error refreshing route:', error);
                Alert.alert('❌ Hata', 'Rota yenilenirken bir hata oluştu. Lütfen tekrar deneyin.');
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('🔄 Error in refresh handler:', error);
      Alert.alert('❌ Hata', 'Bir hata oluştu. Lütfen tekrar deneyin.');
    }
  }, [startingLocation, loadOptimizedRoute, loadOptimizedRouteWithLocation]);

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
        return '#10B981'; // Yeşil - standart
      case 'depot':
        return '#1E40AF'; // Mavi - depo
      default:
        return '#9CA3AF'; // Açık gri - bilinmeyen
    }
  };

  const getMarkerIcon = (deliveryType, status) => {
    if (status === 'delivered') {
      return 'checkmark-circle';
    } else if (status === 'failed') {
      return 'close-circle';
    } else if (status === 'in_transit') {
      return 'car';
    } else if (deliveryType === 'depot') {
      return 'business';
    }
    return 'location';
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

  // Modern ve bilgilendirici durak kartı
  const ModernStopCard = ({ stop, index }) => {
    const isDepot = stop.kargo_id === 'DEPOT' || stop.kargo_id?.includes('DEPOT');
    
    const getDeliveryTypeColor = (type) => {
      switch (type?.toLowerCase()) {
        case 'express': return '#EF4444'; // Kırmızı - Express
        case 'scheduled': return '#F97316'; // Turuncu - Zamanlanmış 
        case 'standard': return '#10B981'; // Yeşil - Standart
        default: return '#6B7280'; // Gri - Bilinmeyen
      }
    };
    
    const getDeliveryTypeIcon = (type) => {
      switch (type?.toLowerCase()) {
        case 'express': return 'flash';
        case 'scheduled': return 'time';
        case 'standard': return 'cube';
        case 'depot': return 'business';
        default: return 'cube-outline';
      }
    };

    const getStatusColor = (status) => {
      // Tek renk sistemi - tüm durumlar için mavi
      return '#3B82F6'; // Mavi - Tüm teslimat durumları
    };

    const getStatusText = (status) => {
      switch (status) {
        case 'delivered': return 'TESLİM EDİLDİ';
        case 'failed': return 'BAŞARISIZ';
        case 'in_transit': return 'YOLDA';
        case 'pending': return 'BEKLİYOR';
        default: return 'BEKLİYOR';
      }
    };

    const getStatusIcon = (status) => {
      switch (status) {
        case 'delivered': return 'checkmark-circle';
        case 'failed': return 'close-circle';
        case 'in_transit': return 'car';
        case 'pending': return 'time';
        default: return 'ellipse-outline';
      }
    };
    
    return (
      <TouchableOpacity 
        onPress={() => {
          console.log('🔥 Modern card touched:', stop.kargo_id);
          handleStopPress(stop);
        }}
        style={[
          styles.modernStopCard,
          isDepot && styles.depotCard,
          stop.status === 'delivered' && styles.deliveredCard,
          stop.status === 'failed' && styles.failedCard
        ]}
        activeOpacity={0.7}
      >
        {/* Sıra numarası ve durum */}
        <View style={styles.cardHeader}>
          <View style={[
            styles.sequenceBadge,
            { backgroundColor: isDepot ? '#2563EB' : getMarkerColor(stop.delivery_type, stop.status) }
          ]}>
            <Text style={styles.sequenceText}>
              {isDepot ? 'D' : index}
            </Text>
          </View>
          
          <View style={styles.cardTitleSection}>
            <Text style={styles.cardTitle}>
              {isDepot ? 'DEPO - Şube' : `Teslimat #${index}`}
            </Text>
            <Text style={styles.cardSubtitle}>
              {isDepot ? 'Başlangıç Noktası' : stop.kargo_id}
            </Text>
          </View>

          {/* Teslimat Durumu Badge */}
          {!isDepot && (
            <View style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(stop.status || 'pending') }
            ]}>
              <Ionicons 
                name={getStatusIcon(stop.status || 'pending')} 
                size={12} 
                color="white" 
              />
              <Text style={styles.statusText}>
                {getStatusText(stop.status || 'pending')}
              </Text>
            </View>
          )}
          
          {!isDepot && (
            <View style={[
              styles.deliveryTypeBadge,
              { backgroundColor: getDeliveryTypeColor(stop.delivery_type) }
            ]}>
              <Ionicons 
                name={getDeliveryTypeIcon(stop.delivery_type)} 
                size={12} 
                color="white" 
              />
              <Text style={styles.deliveryTypeText}>
                {stop.delivery_type?.toUpperCase()}
              </Text>
            </View>
          )}
        </View>
        
        {/* Alıcı bilgileri */}
        {!isDepot && (
          <View style={styles.cardBody}>
            <View style={styles.infoRow}>
              <Ionicons name="person-outline" size={16} color="#6B7280" />
              <Text style={styles.infoText}>
                {stop.recipient_name || 'Alıcı bilgisi yok'}
              </Text>
            </View>
            
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={16} color="#6B7280" />
              <Text style={styles.infoText} numberOfLines={2}>
                {stop.address || `${stop.latitude?.toFixed(4)}, ${stop.longitude?.toFixed(4)}`}
              </Text>
            </View>
            
            {stop.phone && (
              <View style={styles.infoRow}>
                <Ionicons name="call-outline" size={16} color="#6B7280" />
                <Text style={styles.infoText}>{stop.phone}</Text>
              </View>
            )}
          </View>
        )}
        
        {/* Aksiyon Butonları */}
        <View style={styles.cardActions}>
          {/* Harita Butonu - Tüm stop'lar için */}
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleStopPress(stop)}
          >
            <Ionicons name="location" size={16} color="#3B82F6" />
            <Text style={styles.actionText}>Haritada Göster</Text>
          </TouchableOpacity>
          
          {/* Teslimat Detayları Butonu - Sadece kargolar için */}
          {!isDepot && (
            <TouchableOpacity 
              style={[styles.actionButton, styles.detailButton]}
              onPress={() => {
                console.log('📦 Stop object:', stop);
                
                // stop.package_id backend'ten gelen numeric ID
                const packageId = stop.package_id;
                
                if (packageId && typeof packageId === 'number' && packageId > 0) {
                  console.log('📦 Navigating to package details with ID:', packageId);
                  navigation.navigate('PackageDetail', { 
                    packageId: packageId 
                  });
                } else {
                  console.log('📦 Invalid package ID:', packageId);
                  Alert.alert('Bilgi', 'Bu teslimat için detay bilgisi henüz sisteme girilmemiş.');
                }
              }}
            >
              <Ionicons name="document-text" size={16} color="#10B981" />
              <Text style={[styles.actionText, { color: '#10B981' }]}>Teslimat Detayları</Text>
            </TouchableOpacity>
          )}
          
          {/* Müşteriyi Ara Butonu - Sadece telefon numarası olan kargolar için */}
          {!isDepot && stop.phone && (
            <TouchableOpacity 
              style={[styles.actionButton, styles.callButton]}
              onPress={() => {
                // Telefon arama fonksiyonu
                const { Linking } = require('react-native');
                const phoneNumber = stop.phone.replace(/[^0-9+]/g, '');
                Linking.openURL(`tel:${phoneNumber}`).catch(() => {
                  Alert.alert('Hata', 'Telefon uygulaması açılamadı');
                });
              }}
            >
              <Ionicons name="call" size={16} color="white" />
              <Text style={[styles.actionText, { color: 'white' }]}>Müşteriyi Ara</Text>
            </TouchableOpacity>
          )}
        </View>
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
        <Ionicons name="cube-outline" size={80} color="#6B7280" />
        <Text style={styles.emptyTitle}>Henüz Kargo Yok</Text>
        <Text style={styles.emptySubtitle}>
          Teslimat rotası oluşturmak için önce kargo eklemeniz gerekiyor.
        </Text>
        <Text style={styles.emptyHint}>
          📦 Packages sekmesinden yeni kargo ekleyebilirsiniz
        </Text>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={loadOptimizedRoute}
        >
          <Ionicons name="refresh" size={20} color="white" />
          <Text style={styles.refreshButtonText}>Yenile</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.addPackageButton}
          onPress={() => navigation.navigate('Packages')}
        >
          <Ionicons name="add-circle" size={20} color="#3B82F6" />
          <Text style={styles.addPackageButtonText}>Kargo Ekle</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Map */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          region={mapRegion}
          mapPadding={{ top: 60, right: 30, bottom: 60, left: 30 }}
        >
          {/* Depot Marker - Only show if depot location is set */}
          {depotLocation && (
            <Marker
              coordinate={{
                latitude: depotLocation.latitude,
                longitude: depotLocation.longitude,
              }}
              title={`🏢 DEPOT - ${depotLocation.name || 'Seçilen Depo'}`}
              description="Starting point - All deliveries begin here"
              anchor={{ x: 0.5, y: 0.5 }}
              centerOffset={{ x: 0, y: 0 }}
            >
              <View style={styles.simpleDepotMarker}>
                <Text style={styles.depotLetter}>D</Text>
              </View>
            </Marker>
          )}
          
          {/* Route Markers */}
          {route.stops
            .filter(stop => !stop.kargo_id?.includes('DEPOT')) // Don't show depot in numbered markers
            .map((stop, index) => (
            <Marker
              key={`marker-${stop.id || stop.kargo_id}-${index}`}
              coordinate={{
                latitude: stop.latitude,
                longitude: stop.longitude,
              }}
              title={`${index + 1}. ${stop.kargo_id}`}
              description={`${stop.recipient_name} - ${stop.delivery_type?.toUpperCase()} - Durum: ${stop.status || 'pending'}`}
              anchor={{ x: 0.5, y: 0.5 }}
              centerOffset={{ x: 0, y: 0 }}
            >
              <View
                style={[
                  styles.markerContainer,
                  { backgroundColor: getMarkerColor(stop.delivery_type, stop.status) },
                ]}
              >
                <Text style={styles.markerSequence}>{index + 1}</Text>
              </View>
            </Marker>
          ))}
        </MapView>
      </View>

      {/* Route Stats */}
      <RouteStats />

      {/* Action Buttons */}
      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity
          style={[
            styles.modernButton,
            styles.locationButton,
            startingLocation && styles.locationButtonSelected
          ]}
          onPress={() => setShowLocationSelector(true)}
        >
          <Ionicons 
            name={startingLocation ? "checkmark-circle" : "location"} 
            size={20} 
            color={startingLocation ? "#10B981" : "#3B82F6"} 
          />
          <Text style={[
            styles.modernButtonText,
            startingLocation && styles.locationButtonTextSelected
          ]}>
            {startingLocation ? 'Konum Seçildi' : 'Konum Seç'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.modernButton,
            styles.refreshButton,
            loading && styles.refreshButtonLoading
          ]}
          onPress={handleRefreshRoute}
          disabled={loading}
        >
          <Ionicons 
            name="refresh" 
            size={20} 
            color="white"
          />
          <Text style={[
            styles.modernButtonText,
            styles.refreshButtonText,
            loading && styles.refreshButtonTextLoading
          ]}>
            {loading ? 'Yenileniyor...' : 'Rotayı Yenile'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Modern Stops List */}
      <ScrollView style={styles.stopsContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.stopsHeader}>
          <Text style={styles.stopsTitle}>📦 Teslimat Rotası ({route.stops.length})</Text>
          <Text style={styles.stopsSubtitle}>Haritada görmek için kartlara tıklayın</Text>
        </View>
        {route.stops
          .sort((a, b) => a.sequence - b.sequence)
          .map((stop, index) => {
            const isDepot = stop.kargo_id === 'DEPOT' || stop.kargo_id?.includes('DEPOT');
            // For delivery cards, calculate the delivery index (excluding depot)
            const deliveryIndex = route.stops
              .sort((a, b) => a.sequence - b.sequence)
              .slice(0, index + 1)
              .filter(s => !(s.kargo_id === 'DEPOT' || s.kargo_id?.includes('DEPOT')))
              .length;
            
            return (
              <ModernStopCard 
                key={`card-${stop.id || stop.kargo_id}-${index}`} 
                stop={stop} 
                index={isDepot ? 0 : deliveryIndex}
              />
            );
          })}
      </ScrollView>

      {/* Location Selector Modal */}
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
    backgroundColor: '#F9FAFB',
  },
  modernButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  modernButtonText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    flex: 1,
  },
  locationButton: {
    backgroundColor: '#F8FAFC',
    borderWidth: 2,
    borderColor: '#3B82F6',
  },
  locationButtonSelected: {
    backgroundColor: '#EBF8FF',
    borderColor: '#10B981',
  },
  locationButtonTextSelected: {
    color: '#10B981',
  },
  refreshButton: {
    backgroundColor: '#3B82F6',
  },
  refreshButtonLoading: {
    backgroundColor: '#9CA3AF',
  },
  refreshButtonText: {
    color: 'white',
  },
  refreshButtonTextLoading: {
    color: '#E5E7EB',
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F8FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
    gap: 8,
    maxWidth: 200,
  },
  locationButtonSelected: {
    backgroundColor: '#F0FDF4',
    borderColor: '#10B981',
  },
  locationButtonTextContainer: {
    flex: 1,
  },
  locationButtonSubtext: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
  },
  mapContainer: {
    height: 280,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
  },
  map: {
    flex: 1,
    borderRadius: 12,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginHorizontal: 16,
    marginBottom: 16,
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
  // MODERN CARD STYLES
  modernStopCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    borderLeftWidth: 4,
    borderLeftColor: '#E5E7EB',
  },
  depotCard: {
    borderLeftColor: '#2563EB',
    backgroundColor: '#F8FAFC',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sequenceBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sequenceText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cardTitleSection: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  deliveryTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  deliveryTypeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  cardBody: {
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
  },
  tapIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  tapText: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '500',
  },
  // OLD TEST STYLES (can be removed later)
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
  depotLetter: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
  },
  simpleDepotMarker: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1E40AF',
    borderWidth: 2,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  depotMarkerContainer: {
    width: 60,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  depotMarkerCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'white',
    backgroundColor: '#1E40AF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
    position: 'absolute',
    top: 0,
  },
  depotMarkerPin: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 12,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#1E40AF',
    position: 'absolute',
    bottom: 0,
    left: 22,
  },
  depotMarkerText: {
    fontSize: 24,
    color: 'white',
    fontWeight: 'bold',
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
    marginBottom: 16,
  },
  emptyHint: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 24,
    fontStyle: 'italic',
  },
  addPackageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderColor: '#3B82F6',
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
    marginTop: 12,
  },
  addPackageButtonText: {
    color: '#3B82F6',
    fontSize: 16,
    fontWeight: '600',
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
  // Marker stilleri
  markerSequence: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: 2,
  },
  // Teslimat durumu stilleri
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  // Kart durumu stilleri
  deliveredCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },
  failedCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  // Aksiyon butonları
  cardActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: '30%',
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
    gap: 4,
  },
  callButton: {
    backgroundColor: '#3B82F6',
  },
  detailButton: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#10B981',
  },
  actionText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
  },
});

export default RouteScreen;
