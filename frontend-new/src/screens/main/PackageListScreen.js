import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { packageService } from '../../services/packageService';
import AppTheme from '../../theme/AppTheme';
import { ModernHeader, ModernCard, ModernBadge } from '../../components/ModernComponents';

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
      onPress={() => navigation.navigate('PackageDetail', { packageId: item.id })}
    >
      <ModernCard style={styles.modernPackageCard}>
        <View style={styles.packageHeader}>
          <View style={styles.packageInfo}>
            <Text style={styles.packageId}>{item.kargo_id}</Text>
            <Text style={styles.recipientName}>{item.recipient_name}</Text>
          </View>
          <View style={styles.badges}>
            <ModernBadge
              text={getDeliveryTypeText(item.delivery_type)}
              type={item.delivery_type}
              size="small"
            />
            <ModernBadge
              text={getStatusText(item.status)}
              type="delivered"
              size="small"
              style={{ marginLeft: 8 }}
            />
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
            <Ionicons name="time-outline" size={16} color={AppTheme.colors.onSurfaceVariant} />
            <Text style={styles.timeWindowText}>
              {formatTimeWindow(item.time_window_start, item.time_window_end)}
            </Text>
          </View>
        )}
      </ModernCard>
    </TouchableOpacity>
  );

  const EmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="cube-outline" size={64} color="#D1D5DB" />
      <Text style={styles.emptyTitle}>Henüz paket bulunamadı</Text>
      <Text style={styles.emptySubtitle}>
        QR kod tarayarak veya manuel olarak paket ekleyerek başlayın
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#6B73FF" />
      
      {/* Modern Header */}
      <ModernHeader
        title="Paketler"
        subtitle={`${packages.length} paket listeleniyor`}
        rightIcon="add-outline"
        onRightPress={() => navigation.navigate('AddPackage')}
      />

      <FlatList
        data={packages}
        renderItem={PackageItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={[AppTheme.colors.primary]}
            tintColor={AppTheme.colors.primary}
          />
        }
        ListEmptyComponent={!loading ? EmptyState : null}
        showsVerticalScrollIndicator={false}
      />
      
      {/* Floating QR Scanner Button */}
      <TouchableOpacity
        style={styles.fabButton}
        onPress={() => navigation.navigate('QRScanner')}
      >
        <Ionicons name="qr-code-outline" size={24} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppTheme.colors.background,
  },
  listContainer: {
    padding: AppTheme.spacing.md,
    paddingBottom: 100,
    flexGrow: 1,
  },
  packageCard: {
    backgroundColor: AppTheme.colors.surface,
    padding: AppTheme.spacing.lg,
    borderRadius: AppTheme.spacing.lg,
    marginBottom: AppTheme.spacing.md,
    ...AppTheme.shadows.medium,
  },
  packageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: AppTheme.spacing.md,
  },
  packageInfo: {
    flex: 1,
  },
  packageId: {
    fontSize: 16,
    fontWeight: '700',
    color: AppTheme.colors.text.primary,
    marginBottom: 4,
  },
  recipientName: {
    fontSize: 14,
    fontWeight: '600',
    color: AppTheme.colors.text.secondary,
  },
  badges: {
    gap: 6,
  },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-end',
  },
  badgeText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  address: {
    fontSize: 14,
    color: AppTheme.colors.text.tertiary,
    marginBottom: AppTheme.spacing.sm,
    lineHeight: 20,
  },
  phone: {
    fontSize: 14,
    color: AppTheme.colors.text.secondary,
    marginBottom: AppTheme.spacing.sm,
  },
  timeWindow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeWindowText: {
    fontSize: 14,
    color: AppTheme.colors.text.tertiary,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: AppTheme.spacing.xl,
    paddingTop: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: AppTheme.colors.text.secondary,
    marginTop: AppTheme.spacing.lg,
    marginBottom: AppTheme.spacing.sm,
  },
  emptySubtitle: {
    fontSize: 16,
    color: AppTheme.colors.text.tertiary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: AppTheme.spacing.xl,
  },
  fabButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: AppTheme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: AppTheme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});

export default PackageListScreen;
