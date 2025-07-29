import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { packageService } from '../../services/packageService';

const PackageListScreen = ({ navigation }) => {
  const { loading: authLoading } = useAuth();
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    // Only load data after auth loading is complete
    if (!authLoading) {
      loadPackages();
    }
  }, [authLoading]);

  const loadPackages = async () => {
    try {
      console.log('📦 PackageList: Loading packages...');
      console.log('📦 PackageList: AuthLoading:', authLoading);
      setLoading(true);
      const data = await packageService.getAllPackages();
      console.log('📦 PackageList: Packages loaded:', data.length);
      setPackages(data);
    } catch (error) {
      console.error('❌ PackageList: Error loading packages:', error);
      Alert.alert('Error', 'Failed to load packages');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPackages();
    setRefreshing(false);
  };

  const getDeliveryTypeColor = (type) => {
    switch (type) {
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

  const getStatusColor = (status) => {
    // Tek renk sistemi - tüm durumlar için mavi
    return '#3B82F6'; // Mavi - Tüm teslimat durumları
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending':
        return 'Beklemede';
      case 'in_transit':
        return 'Yolda';
      case 'delivered':
        return 'Teslim Edildi';
      case 'failed':
        return 'Başarısız';
      default:
        return status;
    }
  };

  const getDeliveryTypeText = (type) => {
    switch (type) {
      case 'express':
        return 'Ekspres';
      case 'scheduled':
        return 'Programlı';
      case 'standard':
        return 'Standart';
      default:
        return type;
    }
  };

  const formatTimeWindow = (start, end) => {
    if (!start || !end) return null;
    return `${start} - ${end}`;
  };

  const PackageItem = ({ item }) => (
    <TouchableOpacity
      style={styles.packageCard}
      onPress={() => navigation.navigate('PackageDetail', { packageId: item.id })}
    >
      <View style={styles.packageHeader}>
        <View style={styles.packageInfo}>
          <Text style={styles.packageId}>{item.kargo_id}</Text>
          <Text style={styles.recipientName}>{item.recipient_name}</Text>
        </View>
        <View style={styles.badges}>
          <View
            style={[
              styles.typeBadge,
              { backgroundColor: getDeliveryTypeColor(item.delivery_type) },
            ]}
          >
            <Text style={styles.badgeText}>{getDeliveryTypeText(item.delivery_type)}</Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(item.status) },
            ]}
          >
            <Text style={styles.badgeText}>{getStatusText(item.status)}</Text>
          </View>
        </View>
      </View>
      
      <Text style={styles.address} numberOfLines={2}>
        {item.address}
      </Text>
      
      {item.phone && (
        <Text style={styles.phone}>{item.phone}</Text>
      )}
      
      {formatTimeWindow(item.time_window_start, item.time_window_end) && (
        <View style={styles.timeWindow}>
          <Ionicons name="time-outline" size={16} color="#6B7280" />
          <Text style={styles.timeWindowText}>
            {formatTimeWindow(item.time_window_start, item.time_window_end)}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const EmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="cube-outline" size={64} color="#D1D5DB" />
      <Text style={styles.emptyTitle}>No packages found</Text>
      <Text style={styles.emptySubtitle}>
        Start by scanning a QR code or adding a package manually
      </Text>
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate('QRScanner')}
      >
        <Ionicons name="qr-code-outline" size={20} color="white" />
        <Text style={styles.addButtonText}>Scan QR Code</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Packages</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.navigate('QRScanner')}
          >
            <Ionicons name="qr-code-outline" size={24} color="#3B82F6" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.navigate('AddPackage')}
          >
            <Ionicons name="add-outline" size={24} color="#3B82F6" />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={packages}
        renderItem={PackageItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={!loading ? EmptyState : null}
        showsVerticalScrollIndicator={false}
      />
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
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    padding: 8,
  },
  listContainer: {
    padding: 20,
    flexGrow: 1,
  },
  packageCard: {
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
  packageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  packageInfo: {
    flex: 1,
  },
  packageId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  recipientName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  badges: {
    gap: 4,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-end',
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  address: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
    lineHeight: 20,
  },
  phone: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 8,
  },
  timeWindow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeWindowText: {
    fontSize: 14,
    color: '#6B7280',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 60,
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
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PackageListScreen;
