import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { packageService } from '../../services/packageService';
import { routeService } from '../../services/routeService';
import { errorService } from '../../services/errorService';
import { configService } from '../../services/configService';

const DashboardScreen = ({ navigation }) => {
  const { user, loading: authLoading } = useAuth();
  const [packages, setPackages] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    express: 0,
    scheduled: 0,
    standard: 0,
    delivered: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  
  const shouldLog = configService.shouldLog();

  useEffect(() => {
    // Only load data after auth loading is complete
    if (!authLoading) {
      loadDashboardData();
    }
  }, [authLoading]);

  const loadDashboardData = async (isRefresh = false) => {
    try {
      if (shouldLog) {
        console.log('📊 Dashboard: Loading dashboard data...');
        console.log('📊 Dashboard: AuthLoading:', authLoading);
        console.log('📊 Dashboard: User:', !!user);
        console.log('📊 Dashboard: IsRefresh:', isRefresh);
      }
      
      // Clear previous error
      setError(null);
      
      if (!isRefresh) {
        setLoading(true);
      }
      
      // Check if user is authenticated
      if (!user) {
        throw new Error('Kullanıcı oturumu bulunamadı');
      }
      
      // Load packages with timeout
      const packagesData = await Promise.race([
        packageService.getAllPackages(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 10000)
        )
      ]);
      
      if (shouldLog) {
        console.log('📊 Dashboard: Packages loaded:', packagesData?.length || 0);
      }
      
      setPackages(packagesData || []);
      
      // Calculate statistics
      const newStats = {
        total: packagesData?.length || 0,
        express: packagesData?.filter(p => p.delivery_type === 'express').length || 0,
        scheduled: packagesData?.filter(p => p.delivery_type === 'scheduled').length || 0,
        standard: packagesData?.filter(p => p.delivery_type === 'standard').length || 0,
        delivered: packagesData?.filter(p => p.status === 'delivered').length || 0,
      };
      setStats(newStats);
      
    } catch (error) {
      const errorInfo = errorService.handleError(error, 'Dashboard Data Loading', { 
        silent: false,
        onRetry: () => loadDashboardData(isRefresh)
      });
      
      setError(errorInfo.userMessage);
      
      // Set empty data on error
      setPackages([]);
      setStats({
        total: 0,
        express: 0,
        scheduled: 0,
        standard: 0,
        delivered: 0,
      });
      
    } finally {
      setLoading(false);
      if (isRefresh) {
        setRefreshing(false);
      }
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData(true);
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

  const StatCard = ({ title, value, color, icon }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statHeader}>
        <Ionicons name={icon} size={24} color={color} />
        <Text style={styles.statValue}>{value}</Text>
      </View>
      <Text style={styles.statTitle}>{title}</Text>
    </View>
  );

  const QuickAction = ({ title, icon, onPress, color }) => (
    <TouchableOpacity style={styles.quickAction} onPress={onPress}>
      <View style={[styles.quickActionIcon, { backgroundColor: color }]}>
        <Ionicons name={icon} size={24} color="white" />
      </View>
      <Text style={styles.quickActionText}>{title}</Text>
    </TouchableOpacity>
  );

  // Loading screen for initial load
  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Dashboard yükleniyor...</Text>
      </View>
    );
  }

  // Error screen with retry option
  if (error && !refreshing && packages.length === 0) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
        <Text style={styles.errorTitle}>Veri Yüklenemedi</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => loadDashboardData()}>
          <Ionicons name="refresh" size={20} color="white" />
          <Text style={styles.retryButtonText}>Tekrar Dene</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl 
          refreshing={refreshing} 
          onRefresh={onRefresh}
          colors={['#3B82F6']}
          tintColor="#3B82F6"
        />
      }
    >
      {/* Error banner (if error but has cached data) */}
      {error && packages.length > 0 && (
        <View style={styles.errorBanner}>
          <Ionicons name="warning-outline" size={16} color="#F59E0B" />
          <Text style={styles.errorBannerText}>Veriler güncel olmayabilir</Text>
          <TouchableOpacity onPress={() => loadDashboardData()}>
            <Ionicons name="refresh" size={16} color="#F59E0B" />
          </TouchableOpacity>
        </View>
      )}

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Günaydın,</Text>
          <Text style={styles.userName}>{user?.full_name || 'Kurye'}</Text>
        </View>
        <TouchableOpacity style={styles.notificationButton}>
          <Ionicons name="notifications-outline" size={24} color="#374151" />
        </TouchableOpacity>
      </View>

      {/* Statistics */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Today's Overview</Text>
        <View style={styles.statsGrid}>
          <StatCard
            title="Total Packages"
            value={stats.total}
            color="#3B82F6"
            icon="cube-outline"
          />
          <StatCard
            title="Express"
            value={stats.express}
            color="#EF4444"
            icon="flash-outline"
          />
          <StatCard
            title="Scheduled"
            value={stats.scheduled}
            color="#F59E0B"
            icon="time-outline"
          />
          <StatCard
            title="Standard"
            value={stats.standard}
            color="#10B981"
            icon="checkmark-outline"
          />
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActions}>
          <QuickAction
            title="Scan QR Code"
            icon="qr-code-outline"
            color="#8B5CF6"
            onPress={() => navigation.navigate('Packages', { screen: 'QRScanner' })}
          />
          <QuickAction
            title="View Route"
            icon="map-outline"
            color="#06B6D4"
            onPress={() => navigation.navigate('Routes')}
          />
          <QuickAction
            title="Add Package"
            icon="add-outline"
            color="#10B981"
            onPress={() => navigation.navigate('Packages', { screen: 'AddPackage' })}
          />
          <QuickAction
            title="View Packages"
            icon="list-outline"
            color="#F59E0B"
            onPress={() => navigation.navigate('Packages', { screen: 'PackageList' })}
          />
        </View>
      </View>

      {/* Recent Packages */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Packages</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Packages', { screen: 'PackageList' })}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        
        {packages.slice(0, 3).map((pkg) => (
          <TouchableOpacity
            key={pkg.id}
            style={styles.packageCard}
            onPress={() => navigation.navigate('Packages', { 
              screen: 'PackageDetail', 
              params: { packageId: pkg.id } 
            })}
          >
            <View style={styles.packageHeader}>
              <Text style={styles.packageId}>{pkg.kargo_id}</Text>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: getDeliveryTypeColor(pkg.delivery_type) },
                ]}
              >
                <Text style={styles.statusText}>{pkg.delivery_type}</Text>
              </View>
            </View>
            <Text style={styles.packageRecipient}>{pkg.recipient_name}</Text>
            <Text style={styles.packageAddress} numberOfLines={1}>
              {pkg.address}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
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
  greeting: {
    fontSize: 16,
    color: '#6B7280',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  notificationButton: {
    padding: 8,
  },
  section: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  seeAllText: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  statTitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickAction: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
  packageCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  packageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  packageId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  packageRecipient: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  packageAddress: {
    fontSize: 14,
    color: '#6B7280',
  },
  // Loading states
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  // Error states
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  // Error banner
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    padding: 12,
    marginHorizontal: 20,
    marginTop: 10,
    borderRadius: 8,
    gap: 8,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 14,
    color: '#92400E',
  },
});

export default DashboardScreen;
