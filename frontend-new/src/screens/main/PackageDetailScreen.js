import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { packageService } from '../../services/packageService';

const PackageDetailScreen = ({ route, navigation }) => {
  const { packageId } = route.params;
  const [packageData, setPackageData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPackageDetails();
  }, []);

  const loadPackageDetails = async () => {
    try {
      setLoading(true);
      const data = await packageService.getPackageById(packageId);
      setPackageData(data);
    } catch (error) {
      console.error('Error loading package details:', error);
      Alert.alert('Error', 'Failed to load package details');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePackage = () => {
    Alert.alert(
      'Delete Package',
      'Are you sure you want to delete this package?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await packageService.deletePackage(packageId);
              Alert.alert('Success', 'Package deleted successfully');
              navigation.goBack();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete package');
            }
          },
        },
      ]
    );
  };

  const handleUpdateStatus = async (newStatus) => {
    try {
      await packageService.updatePackage(packageId, { status: newStatus });
      setPackageData(prev => ({ ...prev, status: newStatus }));
      Alert.alert('Success', `Package status updated to ${newStatus}`);
    } catch (error) {
      Alert.alert('Error', 'Failed to update package status');
    }
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
    switch (status) {
      case 'delivered':
        return '#10B981';
      case 'in_transit':
        return '#3B82F6';
      case 'failed':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading package details...</Text>
      </View>
    );
  }

  if (!packageData) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Package not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.packageHeader}>
          <Text style={styles.packageId}>{packageData.kargo_id}</Text>
          <View style={styles.badges}>
            <View
              style={[
                styles.typeBadge,
                { backgroundColor: getDeliveryTypeColor(packageData.delivery_type) },
              ]}
            >
              <Text style={styles.badgeText}>{packageData.delivery_type}</Text>
            </View>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(packageData.status) },
              ]}
            >
              <Text style={styles.badgeText}>{packageData.status}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Package Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Package Information</Text>
        
        <View style={styles.infoRow}>
          <Ionicons name="person-outline" size={20} color="#6B7280" />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Recipient</Text>
            <Text style={styles.infoValue}>{packageData.recipient_name}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={20} color="#6B7280" />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Address</Text>
            <Text style={styles.infoValue}>{packageData.address}</Text>
          </View>
        </View>

        {packageData.phone && (
          <View style={styles.infoRow}>
            <Ionicons name="call-outline" size={20} color="#6B7280" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Phone</Text>
              <Text style={styles.infoValue}>{packageData.phone}</Text>
            </View>
          </View>
        )}

        {packageData.time_window_start && packageData.time_window_end && (
          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={20} color="#6B7280" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Time Window</Text>
              <Text style={styles.infoValue}>
                {packageData.time_window_start} - {packageData.time_window_end}
              </Text>
            </View>
          </View>
        )}

        <View style={styles.infoRow}>
          <Ionicons name="calendar-outline" size={20} color="#6B7280" />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Created At</Text>
            <Text style={styles.infoValue}>
              {new Date(packageData.created_at).toLocaleDateString()} {' '}
              {new Date(packageData.created_at).toLocaleTimeString()}
            </Text>
          </View>
        </View>

        {packageData.delivered_at && (
          <View style={styles.infoRow}>
            <Ionicons name="checkmark-circle-outline" size={20} color="#6B7280" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Delivered At</Text>
              <Text style={styles.infoValue}>
                {new Date(packageData.delivered_at).toLocaleDateString()} {' '}
                {new Date(packageData.delivered_at).toLocaleTimeString()}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Status Actions */}
      {packageData.status !== 'delivered' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Update Status</Text>
          
          <View style={styles.statusActions}>
            {packageData.status === 'pending' && (
              <TouchableOpacity
                style={[styles.statusButton, { backgroundColor: '#3B82F6' }]}
                onPress={() => handleUpdateStatus('in_transit')}
              >
                <Ionicons name="car-outline" size={20} color="white" />
                <Text style={styles.statusButtonText}>Mark In Transit</Text>
              </TouchableOpacity>
            )}
            
            {(packageData.status === 'pending' || packageData.status === 'in_transit') && (
              <TouchableOpacity
                style={[styles.statusButton, { backgroundColor: '#10B981' }]}
                onPress={() => handleUpdateStatus('delivered')}
              >
                <Ionicons name="checkmark-circle-outline" size={20} color="white" />
                <Text style={styles.statusButtonText}>Mark Delivered</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              style={[styles.statusButton, { backgroundColor: '#EF4444' }]}
              onPress={() => handleUpdateStatus('failed')}
            >
              <Ionicons name="close-circle-outline" size={20} color="white" />
              <Text style={styles.statusButtonText}>Mark Failed</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Actions</Text>
        
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="call-outline" size={20} color="#3B82F6" />
          <Text style={styles.actionButtonText}>Call Recipient</Text>
          <Ionicons name="chevron-forward" size={20} color="#6B7280" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="navigate-outline" size={20} color="#3B82F6" />
          <Text style={styles.actionButtonText}>Get Directions</Text>
          <Ionicons name="chevron-forward" size={20} color="#6B7280" />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={handleDeletePackage}
        >
          <Ionicons name="trash-outline" size={20} color="#EF4444" />
          <Text style={[styles.actionButtonText, { color: '#EF4444' }]}>
            Delete Package
          </Text>
          <Ionicons name="chevron-forward" size={20} color="#EF4444" />
        </TouchableOpacity>
      </View>

      <View style={styles.bottomSpacing} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: 'white',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  packageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  packageId: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  badges: {
    gap: 8,
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
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  section: {
    backgroundColor: 'white',
    marginTop: 20,
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
  statusActions: {
    padding: 20,
    gap: 12,
  },
  statusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  statusButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  deleteButton: {
    borderBottomWidth: 0,
  },
  actionButtonText: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
    marginLeft: 12,
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
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
  },
  bottomSpacing: {
    height: 40,
  },
});

export default PackageDetailScreen;
