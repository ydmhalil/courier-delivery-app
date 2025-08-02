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
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { packageService } from '../../services/packageService';
import { routeService } from '../../services/routeService';
import { errorService } from '../../services/errorService';
import { configService } from '../../services/configService';
import AppTheme from '../../theme/AppTheme';
import { ModernHeader, ModernCard, ModernButton, ModernBadge } from '../../components/ModernComponents';

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
  const [deliveryStats, setDeliveryStats] = useState({
    total_packages: 0,
    delivered_packages: 0,
    failed_packages: 0,
    pending_packages: 0,
    success_rate: 0,
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

      // Load delivery statistics
      try {
        const deliveryStatsData = await packageService.getDeliveryStats();
        setDeliveryStats(deliveryStatsData);
      } catch (statsError) {
        console.warn('📊 Dashboard: Failed to load delivery stats:', statsError);
        // Set default values if delivery stats fail
        setDeliveryStats({
          total_packages: newStats.total,
          delivered_packages: newStats.delivered,
          failed_packages: packagesData?.filter(p => p.status === 'failed').length || 0,
          pending_packages: packagesData?.filter(p => p.status === 'pending' || p.status === 'in_transit').length || 0,
          success_rate: newStats.total > 0 ? (newStats.delivered / newStats.total * 100) : 0,
        });
      }
      
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
        return 'EKSPRES';
      case 'scheduled':
        return 'ZAMANLANMIŞ';
      case 'standard':
        return 'STANDART';
      default:
        return type;
    }
  };

  const ModernStatCard = ({ title, value, color, icon, subtitle }) => (
    <ModernCard style={styles.modernStatCard}>
      <View style={styles.statHeader}>
        <View style={[styles.statIconContainer, { backgroundColor: color + '15' }]}>
          <Ionicons name={icon} size={24} color={color} />
        </View>
        <Text style={[styles.statValue, { color }]}>{value}</Text>
      </View>
      <Text style={styles.statTitle}>{title}</Text>
      {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
    </ModernCard>
  );

  const ModernDeliveryStatCard = ({ title, value, color, icon, percentage }) => (
    <ModernCard style={styles.modernDeliveryStatCard}>
      <View style={styles.deliveryStatHeader}>
        <View style={[styles.statIconContainer, { backgroundColor: color + '15' }]}>
          <Ionicons name={icon} size={20} color={color} />
        </View>
        <View style={styles.statValues}>
          <Text style={styles.deliveryStatValue}>{value}</Text>
          {percentage !== undefined && (
            <Text style={[styles.statPercentage, { color }]}>%{percentage}</Text>
          )}
        </View>
      </View>
      <Text style={styles.deliveryStatTitle}>{title}</Text>
    </ModernCard>
  );

  const ModernQuickAction = ({ title, icon, onPress, color, gradientColors }) => (
    <TouchableOpacity onPress={onPress} style={styles.modernQuickActionContainer} activeOpacity={1}>
      <LinearGradient
        colors={gradientColors || [color + '80', color]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.modernQuickActionGradient}
      >
        <View style={styles.modernQuickActionIcon}>
          <Ionicons name={icon} size={28} color="white" />
        </View>
        <Text style={styles.modernQuickActionText} numberOfLines={2} ellipsizeMode="tail">
          {title}
        </Text>
      </LinearGradient>
    </TouchableOpacity>
  );

  const DeliveryStatCard = ({ title, value, color, icon, percentage }) => (
    <View style={[styles.deliveryStatCard, { borderLeftColor: color }]}>
      <View style={styles.statHeader}>
        <Ionicons name={icon} size={20} color={color} />
        <View style={styles.statValues}>
          <Text style={styles.statValue}>{value}</Text>
          {percentage !== undefined && (
            <Text style={[styles.statPercentage, { color }]}>%{percentage}</Text>
          )}
        </View>
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
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#6B73FF" />
      
      {/* Modern Header */}
      <ModernHeader
        title="Ana Sayfa"
        subtitle={`Merhaba, ${user?.full_name || 'Kurye'}`}
        rightIcon="notifications-outline"
        onRightPress={() => {/* Bildirimler */}}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={[AppTheme.colors.primary]}
            tintColor={AppTheme.colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Error banner (if error but has cached data) */}
        {error && packages.length > 0 && (
          <ModernCard style={styles.errorBanner}>
            <View style={styles.errorContent}>
              <Ionicons name="warning-outline" size={20} color={AppTheme.colors.warning} />
              <Text style={styles.errorBannerText}>Veriler güncel olmayabilir</Text>
              <TouchableOpacity onPress={() => loadDashboardData()}>
                <Ionicons name="refresh" size={20} color={AppTheme.colors.warning} />
              </TouchableOpacity>
            </View>
          </ModernCard>
        )}

        {/* Statistics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bugünün Özeti</Text>
          <View style={styles.statsGrid}>
            <ModernStatCard
              title="Toplam Paket"
              value={stats.total}
              color={AppTheme.colors.primary}
              icon="cube-outline"
            />
            <ModernStatCard
              title="Ekspres"
              value={stats.express}
              color={AppTheme.colors.express}
              icon="flash-outline"
            />
            <ModernStatCard
              title="Zamanlanmış"
              value={stats.scheduled}
              color={AppTheme.colors.scheduled}
              icon="time-outline"
            />
            <ModernStatCard
              title="Standart"
              value={stats.standard}
              color={AppTheme.colors.standard}
              icon="layers-outline"
            />
          </View>
        </View>

        {/* Teslimat İstatistikleri */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Teslimat Performansı</Text>
          <View style={styles.deliveryStatsGrid}>
            <ModernDeliveryStatCard
              title="Başarılı Teslimat"
              value={deliveryStats.delivered_packages}
              color={AppTheme.colors.success}
              icon="checkmark-circle"
            />
            <ModernDeliveryStatCard
              title="Başarısız Teslimat"
              value={deliveryStats.failed_packages}
              color={AppTheme.colors.error}
              icon="close-circle"
            />
            <ModernDeliveryStatCard
              title="Bekleyen Teslimat"
              value={deliveryStats.pending_packages}
              color={AppTheme.colors.warning}
              icon="time"
            />
          </View>
          
          {/* Modern Başarı Oranı Kartı */}
          <ModernCard style={styles.successRateCard}>
            <View style={styles.successRateHeader}>
              <Text style={styles.successRateTitle}>Genel Başarı Oranı</Text>
              <Text style={[styles.successRateValue, { 
                color: deliveryStats.success_rate >= 80 ? AppTheme.colors.success : 
                       deliveryStats.success_rate >= 60 ? AppTheme.colors.warning : AppTheme.colors.error
              }]}>%{deliveryStats.success_rate}</Text>
            </View>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { 
                    width: `${deliveryStats.success_rate}%`,
                    backgroundColor: deliveryStats.success_rate >= 80 ? AppTheme.colors.success : 
                                     deliveryStats.success_rate >= 60 ? AppTheme.colors.warning : AppTheme.colors.error
                  }
                ]} 
              />
            </View>
          </ModernCard>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hızlı İşlemler</Text>
          <View style={styles.quickActionsContainer}>
            <View style={styles.quickActionsRow}>
              <ModernQuickAction
                title="QR Kod Tara"
                icon="qr-code-outline"
                color="#8B5CF6"
                gradientColors={['#8B5CF6', '#6D28D9']}
                onPress={() => navigation.navigate('Packages', { screen: 'QRScanner' })}
              />
              <ModernQuickAction
                title="Rota Görüntüle"
                icon="map-outline"
                color="#06B6D4"
                gradientColors={['#06B6D4', '#0891B2']}
                onPress={() => navigation.navigate('Routes')}
              />
            </View>
            <View style={styles.quickActionsRow}>
              <ModernQuickAction
                title="Paket Ekle"
                icon="add-outline"
                color={AppTheme.colors.success}
                gradientColors={['#10B981', '#059669']}
                onPress={() => navigation.navigate('Packages', { screen: 'AddPackage' })}
              />
              <ModernQuickAction
                title="Paketleri Görüntüle"
                icon="list-outline"
                color={AppTheme.colors.warning}
                gradientColors={['#F59E0B', '#D97706']}
                onPress={() => navigation.navigate('Packages', { screen: 'PackageList' })}
              />
            </View>
          </View>
        </View>

        {/* Son Paketler */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Son Paketler</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Packages', { screen: 'PackageList' })}>
              <Text style={styles.seeAllText}>Tümünü Gör</Text>
            </TouchableOpacity>
          </View>
          
          {packages.slice(0, 3).map((pkg) => (
            <TouchableOpacity
              key={pkg.id}
              onPress={() => navigation.navigate('Packages', { 
                screen: 'PackageDetail', 
                params: { packageId: pkg.id } 
              })}
            >
              <ModernCard style={styles.modernPackageCard}>
                <View style={styles.packageHeader}>
                  <Text style={styles.packageId}>{pkg.kargo_id}</Text>
                  <View style={styles.badges}>
                    <ModernBadge
                      text={getDeliveryTypeText(pkg.delivery_type)}
                      type={pkg.delivery_type}
                      size="small"
                    />
                    <ModernBadge
                      text={getStatusText(pkg.status)}
                      type="delivered"
                      size="small"
                      style={{ marginLeft: 8 }}
                    />
                  </View>
                </View>
                <Text style={styles.packageRecipient}>{pkg.recipient_name}</Text>
                <Text style={styles.packageAddress} numberOfLines={1}>
                  {pkg.address}
                </Text>
              </ModernCard>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppTheme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: AppTheme.spacing.xl,
  },
  
  // Error Banner
  errorBanner: {
    margin: AppTheme.spacing.md,
    backgroundColor: AppTheme.colors.warning + '15',
    borderColor: AppTheme.colors.warning,
    borderWidth: 1,
  },
  errorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  errorBannerText: {
    flex: 1,
    marginLeft: AppTheme.spacing.sm,
    ...AppTheme.typography.body2,
    color: AppTheme.colors.warning,
  },

  // Section Styling
  section: {
    marginHorizontal: AppTheme.spacing.md,
    marginTop: AppTheme.spacing.lg,
  },
  sectionTitle: {
    ...AppTheme.typography.h4,
    color: AppTheme.colors.onSurface,
    marginBottom: AppTheme.spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: AppTheme.spacing.md,
  },
  seeAllText: {
    ...AppTheme.typography.body2,
    color: AppTheme.colors.primary,
    fontWeight: '600',
  },

  // Modern Stat Cards
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  modernStatCard: {
    width: '48%',
    marginBottom: AppTheme.spacing.sm,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: AppTheme.spacing.sm,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: AppTheme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    ...AppTheme.typography.h2,
    fontWeight: '700',
  },
  statTitle: {
    ...AppTheme.typography.body2,
    color: AppTheme.colors.onSurfaceVariant,
  },
  statSubtitle: {
    ...AppTheme.typography.caption,
    color: AppTheme.colors.textSecondary,
    marginTop: 2,
  },

  // Delivery Stats
  deliveryStatsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: AppTheme.spacing.md,
  },
  modernDeliveryStatCard: {
    flex: 1,
    marginHorizontal: 4,
  },
  deliveryStatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: AppTheme.spacing.sm,
  },
  statValues: {
    flex: 1,
    alignItems: 'flex-end',
  },
  deliveryStatValue: {
    ...AppTheme.typography.h3,
    fontWeight: '700',
    color: AppTheme.colors.onSurface,
  },
  deliveryStatTitle: {
    ...AppTheme.typography.caption,
    color: AppTheme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
  statPercentage: {
    ...AppTheme.typography.caption,
    fontWeight: '600',
  },

  // Success Rate Card
  successRateCard: {
    marginTop: AppTheme.spacing.md,
  },
  successRateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: AppTheme.spacing.sm,
  },
  successRateTitle: {
    ...AppTheme.typography.body1,
    color: AppTheme.colors.onSurface,
    fontWeight: '600',
  },
  successRateValue: {
    ...AppTheme.typography.h3,
    fontWeight: '700',
  },
  progressBar: {
    height: 8,
    backgroundColor: AppTheme.colors.borderLight,
    borderRadius: AppTheme.borderRadius.sm,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: AppTheme.borderRadius.sm,
  },
  // Quick Actions - Modern Gradient Design
  quickActionsContainer: {
    width: '100%',
    paddingHorizontal: AppTheme.spacing.md,
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: AppTheme.spacing.md,
  },
  modernQuickActionContainer: {
    flex: 1,
    marginHorizontal: AppTheme.spacing.xs,
  },
  modernQuickActionGradient: {
    paddingVertical: AppTheme.spacing.lg,
    paddingHorizontal: AppTheme.spacing.md,
    borderRadius: AppTheme.borderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
    ...AppTheme.shadows.lg,
  },
  modernQuickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: AppTheme.borderRadius.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: AppTheme.spacing.sm,
  },
  modernQuickActionText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  // Modern Package Cards
  modernPackageCard: {
    marginBottom: AppTheme.spacing.sm,
  },
  packageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: AppTheme.spacing.sm,
  },
  packageId: {
    ...AppTheme.typography.h5,
    color: AppTheme.colors.primary,
    fontWeight: '700',
  },
  badges: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  packageRecipient: {
    ...AppTheme.typography.body1,
    color: AppTheme.colors.onSurface,
    fontWeight: '600',
    marginBottom: 4,
  },
  packageAddress: {
    ...AppTheme.typography.body2,
    color: AppTheme.colors.onSurfaceVariant,
  },

  // Loading States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: AppTheme.colors.background,
  },
  loadingText: {
    ...AppTheme.typography.body1,
    color: AppTheme.colors.onSurfaceVariant,
    marginTop: AppTheme.spacing.md,
  },

  // Error States
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: AppTheme.colors.background,
    padding: AppTheme.spacing.xl,
  },
  errorTitle: {
    ...AppTheme.typography.h3,
    color: AppTheme.colors.error,
    marginTop: AppTheme.spacing.md,
    textAlign: 'center',
  },
  errorMessage: {
    ...AppTheme.typography.body2,
    color: AppTheme.colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: AppTheme.spacing.sm,
    marginBottom: AppTheme.spacing.lg,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppTheme.colors.primary,
    paddingHorizontal: AppTheme.spacing.lg,
    paddingVertical: AppTheme.spacing.md,
    borderRadius: AppTheme.borderRadius.lg,
    ...AppTheme.shadows.md,
  },
  retryButtonText: {
    ...AppTheme.typography.button,
    color: AppTheme.colors.onPrimary,
    marginLeft: AppTheme.spacing.sm,
  },
});

export default DashboardScreen;
