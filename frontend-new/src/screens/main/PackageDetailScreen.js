import React, { useState, useEffect, useLayoutEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  Platform,
  Linking,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { packageService } from '../../services/packageService';

const PackageDetailScreen = ({ route, navigation }) => {
  const { packageId } = route.params;
  const [packageData, setPackageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [selectedFailureReason, setSelectedFailureReason] = useState('');
  
  const failureReasons = [
    { value: 'customer_not_found', label: 'Müşteri Bulunamadı' },
    { value: 'customer_refused', label: 'Müşteri Teslim Almayı Reddetti' },
    { value: 'wrong_address', label: 'Yanlış Adres' },
    { value: 'customer_not_available', label: 'Müşteri Mevcut Değil' },
    { value: 'damaged_package', label: 'Hasar Görmüş Paket' },
    { value: 'other', label: 'Diğer' },
  ];

  useEffect(() => {
    loadPackageDetails();
  }, []);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false
    });
  }, [navigation]);

  const loadPackageDetails = async () => {
    try {
      setLoading(true);
      const data = await packageService.getPackageById(packageId);
      setPackageData(data);
    } catch (error) {
      console.error('Error loading package details:', error);
      Alert.alert('Hata', 'Paket detayları yüklenemedi');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePackage = () => {
    Alert.alert(
      'Paketi Sil',
      'Bu paketi silmek istediğinizden emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              await packageService.deletePackage(packageId);
              Alert.alert('Başarılı', 'Paket başarıyla silindi');
              navigation.goBack();
            } catch (error) {
              Alert.alert('Hata', 'Paket silinemedi');
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
      Alert.alert('Başarılı', 'Paket durumu güncellendi');
    } catch (error) {
      Alert.alert('Hata', 'Paket durumu güncellenemedi');
    }
  };

  const handleDeliverySuccess = async () => {
    try {
      const updateData = {
        status: 'delivered',
        notes: deliveryNotes,
      };
      
      await packageService.updateDeliveryStatus(packageId, updateData);
      setPackageData(prev => ({ 
        ...prev, 
        status: 'delivered',
        delivery_notes: deliveryNotes,
        delivered_at: new Date().toISOString()
      }));
      
      setShowDeliveryModal(false);
      setDeliveryNotes('');
      Alert.alert('Başarılı', 'Paket başarıyla teslim edildi!');
    } catch (error) {
      Alert.alert('Hata', 'Teslimat durumu güncellenemedi');
    }
  };

  const handleDeliveryFailure = async () => {
    if (!selectedFailureReason) {
      Alert.alert('Uyarı', 'Lütfen başarısızlık nedenini seçin');
      return;
    }

    try {
      const updateData = {
        status: 'failed',
        notes: deliveryNotes,
        failure_reason: selectedFailureReason,
      };
      
      await packageService.updateDeliveryStatus(packageId, updateData);
      setPackageData(prev => ({ 
        ...prev, 
        status: 'failed',
        delivery_notes: deliveryNotes,
        failure_reason: selectedFailureReason
      }));
      
      setShowDeliveryModal(false);
      setDeliveryNotes('');
      setSelectedFailureReason('');
      Alert.alert('Bilgi', 'Teslimat başarısız olarak işaretlendi');
    } catch (error) {
      Alert.alert('Hata', 'Teslimat durumu güncellenemedi');
    }
  };

  const handleCallCustomer = () => {
    if (packageData?.phone) {
      const phoneNumber = packageData.phone.replace(/[^0-9+]/g, '');
      const url = Platform.OS === 'ios' ? `tel:${phoneNumber}` : `tel:${phoneNumber}`;
      
      Alert.alert(
        'Müşteriyi Ara',
        `${packageData.recipient_name} isimli müşteriyi aramak istiyor musunuz?\n\nTelefon: ${packageData.phone}`,
        [
          { text: 'İptal', style: 'cancel' },
          { 
            text: 'Ara', 
            onPress: () => {
              // React Native'de gerçek telefon çağrısı için Linking kullanılır
              const { Linking } = require('react-native');
              Linking.openURL(url).catch(() => {
                Alert.alert('Hata', 'Telefon uygulaması açılamadı');
              });
            }
          }
        ]
      );
    } else {
      Alert.alert('Hata', 'Telefon numarası bulunamadı');
    }
  };

  const handleGetDirections = () => {
    if (packageData?.address) {
      // Adresi URL encode ediyoruz
      const encodedAddress = encodeURIComponent(packageData.address);
      
      // Platform'a göre harita uygulaması seçimi
      Alert.alert(
        'Yol Tarifi',
        'Hangi harita uygulamasını kullanmak istiyorsunuz?',
        [
          { text: 'İptal', style: 'cancel' },
          { 
            text: 'Google Maps', 
            onPress: () => {
              const googleMapsUrl = Platform.OS === 'ios' 
                ? `comgooglemaps://?daddr=${encodedAddress}&directionsmode=driving`
                : `google.navigation:q=${encodedAddress}&mode=d`;
              
              Linking.canOpenURL(googleMapsUrl).then(supported => {
                if (supported) {
                  Linking.openURL(googleMapsUrl);
                } else {
                  // Fallback to web version
                  const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}&travelmode=driving`;
                  Linking.openURL(webUrl);
                }
              }).catch(() => {
                Alert.alert('Hata', 'Harita uygulaması açılamadı');
              });
            }
          },
          { 
            text: 'Apple Maps (iOS)', 
            onPress: () => {
              if (Platform.OS === 'ios') {
                const appleMapsUrl = `http://maps.apple.com/?daddr=${encodedAddress}&dirflg=d`;
                Linking.openURL(appleMapsUrl).catch(() => {
                  Alert.alert('Hata', 'Apple Maps açılamadı');
                });
              } else {
                Alert.alert('Bilgi', 'Apple Maps sadece iOS cihazlarda kullanılabilir');
              }
            }
          }
        ]
      );
    } else {
      Alert.alert('Hata', 'Adres bilgisi bulunamadı');
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Paket detayları yükleniyor...</Text>
      </View>
    );
  }

  if (!packageData) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Paket bulunamadı</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#6B73FF" />
      
      {/* Navigation Header - Sadece en üst kısım */}
      <LinearGradient
        colors={['#6B73FF', '#9C27B0']}
        style={styles.gradientHeader}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Paket Detayları</Text>
        
        <View style={styles.headerSpacer} />
      </LinearGradient>

      <ScrollView style={styles.scrollContent}>
        {/* Header - PKG004 ve badge'ler burada kalacak */}
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
                <Text style={styles.badgeText}>{getDeliveryTypeText(packageData.delivery_type)}</Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(packageData.status) },
                ]}
              >
                <Text style={styles.badgeText}>{getStatusText(packageData.status)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Package Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Paket Bilgileri</Text>
          
          <View style={styles.infoRow}>
            <Ionicons name="person-outline" size={20} color="#6B7280" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Alıcı</Text>
              <Text style={styles.infoValue}>{packageData.recipient_name}</Text>
            </View>
          </View>

        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={20} color="#6B7280" />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Adres</Text>
            <Text style={styles.infoValue}>{packageData.address}</Text>
          </View>
        </View>

        {packageData.phone && (
          <View style={styles.infoRow}>
            <Ionicons name="call-outline" size={20} color="#6B7280" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Telefon</Text>
              <Text style={styles.infoValue}>{packageData.phone}</Text>
            </View>
          </View>
        )}

        {packageData.time_window_start && packageData.time_window_end && (
          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={20} color="#6B7280" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Zaman Aralığı</Text>
              <Text style={styles.infoValue}>
                {packageData.time_window_start} - {packageData.time_window_end}
              </Text>
            </View>
          </View>
        )}

        <View style={styles.infoRow}>
          <Ionicons name="calendar-outline" size={20} color="#6B7280" />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Oluşturulma Tarihi</Text>
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
              <Text style={styles.infoLabel}>Teslim Edilme Tarihi</Text>
              <Text style={styles.infoValue}>
                {new Date(packageData.delivered_at).toLocaleDateString()} {' '}
                {new Date(packageData.delivered_at).toLocaleTimeString()}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Teslimat Durumu & Actions */}
      {packageData.status !== 'delivered' && packageData.status !== 'failed' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Teslimat İşlemleri</Text>
          
          <View style={styles.deliveryActions}>
            {/* Müşteriyi Ara */}
            <TouchableOpacity 
              style={[styles.deliveryButton, { backgroundColor: '#3B82F6' }]}
              onPress={handleCallCustomer}
            >
              <Ionicons name="call" size={20} color="white" />
              <Text style={styles.deliveryButtonText}>Müşteriyi Ara</Text>
            </TouchableOpacity>
            
            {/* Transit Durumuna Geç */}
            {packageData.status === 'pending' && (
              <TouchableOpacity
                style={[styles.deliveryButton, { backgroundColor: '#F59E0B' }]}
                onPress={() => handleUpdateStatus('in_transit')}
              >
                <Ionicons name="car-outline" size={20} color="white" />
                <Text style={styles.deliveryButtonText}>Yola Çık</Text>
              </TouchableOpacity>
            )}
            
            {/* Teslimat Geri Bildirimi */}
            {(packageData.status === 'pending' || packageData.status === 'in_transit') && (
              <TouchableOpacity
                style={[styles.deliveryButton, { backgroundColor: '#10B981' }]}
                onPress={() => setShowDeliveryModal(true)}
              >
                <Ionicons name="clipboard-outline" size={20} color="white" />
                <Text style={styles.deliveryButtonText}>Teslimat Geri Bildirimi</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Teslimat Detayları */}
      {(packageData.delivery_notes || packageData.failure_reason) && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Teslimat Detayları</Text>
          
          {packageData.delivery_notes && (
            <View style={styles.infoRow}>
              <Ionicons name="document-text-outline" size={20} color="#6B7280" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Kurye Notları</Text>
                <Text style={styles.infoValue}>{packageData.delivery_notes}</Text>
              </View>
            </View>
          )}
          
          {packageData.failure_reason && (
            <View style={styles.infoRow}>
              <Ionicons name="warning-outline" size={20} color="#EF4444" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Başarısızlık Nedeni</Text>
                <Text style={[styles.infoValue, { color: '#EF4444' }]}>
                  {failureReasons.find(r => r.value === packageData.failure_reason)?.label || packageData.failure_reason}
                </Text>
              </View>
            </View>
          )}
        </View>
      )}

      {/* Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Diğer İşlemler</Text>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={handleCallCustomer}
        >
          <Ionicons name="call-outline" size={20} color="#3B82F6" />
          <Text style={styles.actionButtonText}>Müşteriyi Ara</Text>
          <Ionicons name="chevron-forward" size={20} color="#6B7280" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={handleGetDirections}
        >
          <Ionicons name="navigate-outline" size={20} color="#3B82F6" />
          <Text style={styles.actionButtonText}>Yol Tarifi Al</Text>
          <Ionicons name="chevron-forward" size={20} color="#6B7280" />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={handleDeletePackage}
        >
          <Ionicons name="trash-outline" size={20} color="#EF4444" />
          <Text style={[styles.actionButtonText, { color: '#EF4444' }]}>
            Paketi Sil
          </Text>
          <Ionicons name="chevron-forward" size={20} color="#EF4444" />
        </TouchableOpacity>
      </View>

      {/* Teslimat Geri Bildirimi Modal */}
      <Modal
        visible={showDeliveryModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDeliveryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Teslimat Geri Bildirimi</Text>
              <TouchableOpacity
                onPress={() => setShowDeliveryModal(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.modalSubtitle}>
                {packageData?.kargo_id} - {packageData?.recipient_name}
              </Text>

              {/* Notlar */}
              <View style={styles.modalSection}>
                <Text style={styles.modalLabel}>Teslimat Notları</Text>
                <TextInput
                  style={styles.modalTextInput}
                  value={deliveryNotes}
                  onChangeText={setDeliveryNotes}
                  placeholder="Teslimat hakkında notlarınızı yazın..."
                  multiline
                  numberOfLines={3}
                />
              </View>

              {/* Başarısızlık Nedeni Seçimi */}
              <View style={styles.modalSection}>
                <Text style={styles.modalLabel}>Başarısızlık Durumunda Neden</Text>
                {failureReasons.map((reason) => (
                  <TouchableOpacity
                    key={reason.value}
                    style={[
                      styles.reasonOption,
                      selectedFailureReason === reason.value && styles.reasonOptionSelected
                    ]}
                    onPress={() => setSelectedFailureReason(reason.value)}
                  >
                    <Ionicons 
                      name={selectedFailureReason === reason.value ? "radio-button-on" : "radio-button-off"} 
                      size={20} 
                      color={selectedFailureReason === reason.value ? "#3B82F6" : "#6B7280"} 
                    />
                    <Text style={[
                      styles.reasonText,
                      selectedFailureReason === reason.value && styles.reasonTextSelected
                    ]}>
                      {reason.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            {/* Modal Butonları */}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSuccess]}
                onPress={handleDeliverySuccess}
              >
                <Ionicons name="checkmark-circle" size={20} color="white" />
                <Text style={styles.modalButtonText}>Başarılı Teslimat</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonFailure]}
                onPress={handleDeliveryFailure}
              >
                <Ionicons name="close-circle" size={20} color="white" />
                <Text style={styles.modalButtonText}>Başarısız Teslimat</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  gradientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: StatusBar.currentHeight || 40,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  headerSpacer: {
    width: 40,
  },
  scrollContent: {
    flex: 1,
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
  // Teslimat butonları
  deliveryActions: {
    padding: 20,
    gap: 12,
  },
  deliveryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    gap: 8,
  },
  deliveryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  // Modal stilleri
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalBody: {
    maxHeight: 400,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
    paddingHorizontal: 20,
    marginTop: 10,
  },
  modalSection: {
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 10,
  },
  modalTextInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1F2937',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  reasonOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#F9FAFB',
  },
  reasonOptionSelected: {
    backgroundColor: '#EBF4FF',
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  reasonText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 12,
  },
  reasonTextSelected: {
    color: '#3B82F6',
    fontWeight: '500',
  },
  modalButtons: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  modalButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    gap: 8,
  },
  modalButtonSuccess: {
    backgroundColor: '#10B981',
  },
  modalButtonFailure: {
    backgroundColor: '#EF4444',
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PackageDetailScreen;
