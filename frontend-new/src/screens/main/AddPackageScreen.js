import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import { packageService } from '../../services/packageService';
import AppTheme from '../../theme/AppTheme';
import { ModernHeader, ModernCard, ModernButton, ModernInput } from '../../components/ModernComponents';

const AddPackageScreen = ({ navigation }) => {
  // Navigation options'ı ayarla - header'ı gizle
  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  const [formData, setFormData] = useState({
    kargo_id: '',
    recipient_name: '',
    address: '',
    phone: '',
    delivery_type: 'standard',
    time_window_start: '',
    time_window_end: '',
    latitude: '',
    longitude: '',
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    const { kargo_id, recipient_name, address } = formData;

    if (!kargo_id || !recipient_name || !address) {
      Alert.alert('Hata', 'Lütfen tüm gerekli alanları doldurun');
      return;
    }

    // Validate coordinates if provided
    if (formData.latitude && formData.longitude) {
      const lat = parseFloat(formData.latitude);
      const lng = parseFloat(formData.longitude);
      
      if (isNaN(lat) || isNaN(lng)) {
        Alert.alert('Hata', 'Geçersiz koordinat formatı. Lütfen sayısal değerler girin.');
        return;
      }
      
      if (lat < -90 || lat > 90) {
        Alert.alert('Hata', 'Enlem değeri -90 ile 90 arasında olmalıdır.');
        return;
      }
      
      if (lng < -180 || lng > 180) {
        Alert.alert('Hata', 'Boylam değeri -180 ile 180 arasında olmalıdır.');
        return;
      }
    }

    // Prepare package data with proper number conversion for coordinates
    const packageData = {
      ...formData,
      latitude: formData.latitude ? parseFloat(formData.latitude) : null,
      longitude: formData.longitude ? parseFloat(formData.longitude) : null,
    };

    // Remove empty string values
    Object.keys(packageData).forEach(key => {
      if (packageData[key] === '') {
        packageData[key] = null;
      }
    });

    setLoading(true);
    try {
      const newPackage = await packageService.createPackage(packageData);
      Alert.alert(
        'Başarılı!',
        `Paket ${newPackage.kargo_id} başarıyla eklendi.`,
        [
          {
            text: 'Paketi Görüntüle',
            onPress: () => {
              navigation.replace('PackageDetail', { packageId: newPackage.id });
            },
          },
          {
            text: 'Yeni Paket Ekle',
            onPress: () => {
              setFormData({
                kargo_id: '',
                recipient_name: '',
                address: '',
                phone: '',
                delivery_type: 'standard',
                time_window_start: '',
                time_window_end: '',
                latitude: '',
                longitude: '',
              });
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error creating package:', error);
      Alert.alert('Hata', 'Paket oluşturulamadı. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  const timePattern = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;

  const validateTimeFormat = (time) => {
    return timePattern.test(time);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#6B73FF" />
      
      {/* Modern Header */}
      <ModernHeader
        title="Yeni Paket Ekle"
        subtitle="Paket detaylarını manuel olarak girin"
        leftIcon="arrow-back-outline"
        onLeftPress={() => navigation.goBack()}
      />

      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          style={styles.scrollContainer} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Form Card */}
          <ModernCard style={styles.formCard}>
            <ModernInput
              label="Paket ID *"
              value={formData.kargo_id}
              onChangeText={(value) => handleInputChange('kargo_id', value)}
              placeholder="Paket ID girin (örn. PKT123456)"
              autoCapitalize="characters"
              icon="cube-outline"
            />

            <ModernInput
              label="Alıcı Adı *"
              value={formData.recipient_name}
              onChangeText={(value) => handleInputChange('recipient_name', value)}
              placeholder="Alıcının tam adını girin"
              autoCapitalize="words"
              icon="person-outline"
            />

            <ModernInput
              label="Adres *"
              value={formData.address}
              onChangeText={(value) => handleInputChange('address', value)}
              placeholder="Tam teslimat adresini girin"
              multiline={true}
              numberOfLines={3}
              icon="location-outline"
            />

            <ModernInput
              label="Telefon Numarası"
              value={formData.phone}
              onChangeText={(value) => handleInputChange('phone', value)}
              placeholder="0555 123 45 67"
              keyboardType="phone-pad"
              icon="call-outline"
            />

            <ModernInput
              label="Enlem (Latitude)"
              value={formData.latitude}
              onChangeText={(value) => handleInputChange('latitude', value)}
              placeholder="41.0082"
              keyboardType="numeric"
              icon="navigate-outline"
            />

            <ModernInput
              label="Boylam (Longitude)"
              value={formData.longitude}
              onChangeText={(value) => handleInputChange('longitude', value)}
              placeholder="28.9784"
              keyboardType="numeric"
              icon="navigate-outline"
            />

            {/* Delivery Type Picker */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Teslimat Türü *</Text>
              <View style={styles.pickerContainer}>
                <Ionicons 
                  name="time-outline" 
                  size={20} 
                  color={AppTheme.colors.text.tertiary}
                  style={styles.pickerIcon}
                />
                <Picker
                  selectedValue={formData.delivery_type}
                  onValueChange={(value) => handleInputChange('delivery_type', value)}
                  style={styles.picker}
                >
                  <Picker.Item label="Standart" value="standard" />
                  <Picker.Item label="Hızlı" value="express" />
                  <Picker.Item label="Zamanlanmış" value="scheduled" />
                </Picker>
              </View>
            </View>

            {/* Time Window for Scheduled Delivery */}
            {formData.delivery_type === 'scheduled' && (
              <>
                <ModernInput
                  label="Başlangıç Saati (SS:DD)"
                  value={formData.time_window_start}
                  onChangeText={(value) => handleInputChange('time_window_start', value)}
                  placeholder="08:00"
                  keyboardType="numeric"
                  icon="time-outline"
                />

                <ModernInput
                  label="Bitiş Saati (SS:DD)"
                  value={formData.time_window_end}
                  onChangeText={(value) => handleInputChange('time_window_end', value)}
                  placeholder="18:00"
                  keyboardType="numeric"
                  icon="time-outline"
                />
              </>
            )}

            {/* Coordinate Info */}
            <View style={styles.coordinateInfoBox}>
              <Ionicons 
                name="location-outline" 
                size={20} 
                color={AppTheme.colors.success} 
              />
              <View style={styles.infoContent}>
                <Text style={styles.infoTitle}>Koordinat Bilgisi:</Text>
                <Text style={styles.infoText}>
                  • Koordinatlar opsiyoneldir ancak harita üzerinde rota görüntülemek için gereklidir
                </Text>
                <Text style={styles.infoText}>
                  • Google Maps'ten koordinat alabilir veya GPS uygulaması kullanabilirsiniz
                </Text>
              </View>
            </View>

            {/* Delivery Type Info */}
            <View style={styles.infoBox}>
              <Ionicons 
                name="information-circle-outline" 
                size={20} 
                color={AppTheme.colors.primary} 
              />
              <View style={styles.infoContent}>
                <Text style={styles.infoTitle}>Teslimat Türleri:</Text>
                <Text style={styles.infoText}>
                  • <Text style={{ color: '#EF4444', fontWeight: '600' }}>Hızlı</Text>: Yüksek öncelikli teslimat
                </Text>
                <Text style={styles.infoText}>
                  • <Text style={{ color: '#F59E0B', fontWeight: '600' }}>Zamanlanmış</Text>: Belirtilen saat aralığında teslimat
                </Text>
                <Text style={styles.infoText}>
                  • <Text style={{ color: '#10B981', fontWeight: '600' }}>Standart</Text>: Normal teslimat
                </Text>
              </View>
            </View>
          </ModernCard>

          {/* Submit Button */}
          <ModernButton
            title={loading ? "Paket Ekleniyor..." : "Paket Ekle"}
            onPress={handleSubmit}
            disabled={loading}
            loading={loading}
            style={styles.submitButton}
            icon="add-outline"
          />

          {/* Alternative QR Scanner */}
          <TouchableOpacity
            style={styles.alternativeButton}
            onPress={() => navigation.navigate('QRScanner')}
          >
            <Ionicons 
              name="qr-code-outline" 
              size={20} 
              color={AppTheme.colors.primary} 
            />
            <Text style={styles.alternativeButtonText}>Veya QR Kod Tara</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppTheme.colors.background,
  },
  content: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: AppTheme.spacing.md,
    paddingBottom: 40,
  },
  formCard: {
    marginBottom: AppTheme.spacing.lg,
  },
  inputGroup: {
    marginBottom: AppTheme.spacing.lg,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: AppTheme.colors.text.secondary,
    marginBottom: AppTheme.spacing.sm,
  },
  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: AppTheme.colors.border,
    borderRadius: AppTheme.spacing.md,
    backgroundColor: AppTheme.colors.surface,
    paddingLeft: AppTheme.spacing.md,
    marginTop: AppTheme.spacing.sm,
  },
  pickerIcon: {
    marginRight: AppTheme.spacing.sm,
  },
  picker: {
    flex: 1,
    height: 50,
    color: AppTheme.colors.text.primary,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#EBF4FF',
    padding: AppTheme.spacing.lg,
    borderRadius: AppTheme.spacing.md,
    marginTop: AppTheme.spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: AppTheme.colors.primary,
  },
  coordinateInfoBox: {
    flexDirection: 'row',
    backgroundColor: '#F0FDF4',
    padding: AppTheme.spacing.lg,
    borderRadius: AppTheme.spacing.md,
    marginTop: AppTheme.spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: AppTheme.colors.success,
  },
  infoContent: {
    flex: 1,
    marginLeft: AppTheme.spacing.md,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: AppTheme.colors.text.primary,
    marginBottom: AppTheme.spacing.sm,
  },
  infoText: {
    fontSize: 13,
    color: AppTheme.colors.text.secondary,
    lineHeight: 18,
    marginBottom: 2,
  },
  submitButton: {
    marginTop: AppTheme.spacing.lg,
    marginBottom: AppTheme.spacing.md,
  },
  alternativeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: AppTheme.spacing.lg,
    borderRadius: AppTheme.spacing.md,
    borderWidth: 1,
    borderColor: AppTheme.colors.primary,
    backgroundColor: 'transparent',
    gap: AppTheme.spacing.sm,
  },
  alternativeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: AppTheme.colors.primary,
  },
});

export default AddPackageScreen;
