import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { CameraView, Camera } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { packageService } from '../../services/packageService';
import { locationService } from '../../services/locationService';
import AppTheme from '../../theme/AppTheme';
import { ModernHeader } from '../../components/ModernComponents';

const QRScannerScreen = ({ navigation }) => {
  // Navigation options'ı ayarla - header'ı gizle
  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  const { loading: authLoading } = useAuth();
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getPermissions();
  }, []);

  const getPermissions = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    setHasPermission(status === 'granted');
  };

  const handleBarCodeScanned = async ({ type, data }) => {
    if (scanned || loading || authLoading) return;
    
    setScanned(true);
    setLoading(true);

    try {
      console.log('📱 QR Scanner: Processing QR code data...');
      
      // Process QR code data
      const qrData = packageService.processQRData(data);
      console.log('📱 QR Scanner: Processed data:', qrData);
      
      // Check if geocoding is needed (coordinates missing)
      if (qrData.geocode_required && qrData.adres) {
        console.log('📍 QR Scanner: Coordinates missing, attempting geocoding...');
        
        try {
          // Try to geocode the address to get coordinates
          // Note: expo-location doesn't have forward geocoding, 
          // but we can enhance this with a geocoding service later
          console.log('🗺️ QR Scanner: Address geocoding not available, proceeding without coordinates');
        } catch (geocodeError) {
          console.warn('❌ QR Scanner: Geocoding failed:', geocodeError);
        }
      }
      
      // Create package from QR code
      const newPackage = await packageService.createPackageFromQR(qrData);
      console.log('✅ QR Scanner: Package created successfully:', newPackage);
      
      Alert.alert(
        'Başarılı!',
        `Paket ${newPackage.kargo_id} başarıyla eklendi.${qrData.geocode_required ? '\n\nNot: Koordinat bilgisi eksik, adres metni kullanıldı.' : ''}`,
        [
          {
            text: 'Paketi Görüntüle',
            onPress: () => {
              navigation.replace('PackageDetail', { packageId: newPackage.id });
            },
          },
          {
            text: 'Yeni Tarama',
            onPress: () => {
              setScanned(false);
              setLoading(false);
            },
          },
        ]
      );
    } catch (error) {
      console.error('❌ QR Scanner: Error processing QR code:', error);
      Alert.alert(
        'Hata',
        error.message || 'QR kod işlenirken bir hata oluştu',
        [
          {
            text: 'Tekrar Dene',
            onPress: () => {
              setScanned(false);
              setLoading(false);
            },
          },
        ]
      );
    }
  };

  const resetScanner = () => {
    setScanned(false);
    setLoading(false);
  };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#6B73FF" />
        <ModernHeader
          title="QR Kod Tarayıcı"
          subtitle="Kamera izni isteniyor..."
          leftIcon="arrow-back-outline"
          onLeftPress={() => navigation.goBack()}
        />
        <View style={styles.loadingContainer}>
          <Ionicons name="camera-outline" size={48} color={AppTheme.colors.text.tertiary} />
          <Text style={styles.loadingText}>Kamera izni kontrol ediliyor...</Text>
        </View>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#6B73FF" />
        <ModernHeader
          title="QR Kod Tarayıcı"
          subtitle="Kamera izni gerekli"
          leftIcon="arrow-back-outline"
          onLeftPress={() => navigation.goBack()}
        />
        <View style={styles.permissionContainer}>
          <Ionicons name="camera-off-outline" size={80} color={AppTheme.colors.text.tertiary} />
          <Text style={styles.permissionTitle}>Kamera İzni Gerekli</Text>
          <Text style={styles.permissionMessage}>
            Paket bilgileri için QR kod tarayabilmek için lütfen kamera iznini verin.
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={getPermissions}>
            <Text style={styles.permissionButtonText}>İzin Ver</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <CameraView
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ["qr", "pdf417"],
        }}
        style={styles.scanner}
      />
      
      <View style={styles.overlay}>
        {/* Modern Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>QR Kod Tara</Text>
            <Text style={styles.headerSubtitle}>Paket bilgilerini almak için QR kod tarayın</Text>
          </View>
        </View>

        {/* Scanning area */}
        <View style={styles.scanArea}>
          <View style={styles.scanFrame}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>
          
          <Text style={styles.instructionText}>
            QR kodu çerçeve içine hizalayın
          </Text>
          
          {loading && (
            <View style={styles.processingContainer}>
              <View style={styles.processingBox}>
                <Ionicons name="scan-outline" size={24} color={AppTheme.colors.primary} />
                <Text style={styles.processingText}>QR kod işleniyor...</Text>
              </View>
            </View>
          )}
        </View>

        {/* Bottom controls */}
        <View style={styles.bottomControls}>
          {scanned && (
            <TouchableOpacity
              style={styles.rescanButton}
              onPress={resetScanner}
            >
              <Ionicons name="refresh" size={20} color="white" />
                <Text style={styles.rescanButtonText}>Tekrar Tara</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              style={styles.manualButton}
              onPress={() => navigation.navigate('AddPackage')}
            >
              <Ionicons name="create-outline" size={20} color={AppTheme.colors.text.primary} />
              <Text style={styles.manualButtonText}>Manuel Ekle</Text>
            </TouchableOpacity>
          </View>
        </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppTheme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: AppTheme.spacing.lg,
  },
  loadingText: {
    fontSize: 16,
    color: AppTheme.colors.text.secondary,
    fontWeight: '500',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: AppTheme.spacing.xl,
    gap: AppTheme.spacing.lg,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: AppTheme.colors.text.primary,
    textAlign: 'center',
  },
  permissionMessage: {
    fontSize: 16,
    color: AppTheme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  permissionButton: {
    backgroundColor: AppTheme.colors.primary,
    paddingHorizontal: AppTheme.spacing.xl,
    paddingVertical: AppTheme.spacing.lg,
    borderRadius: AppTheme.spacing.md,
    marginTop: AppTheme.spacing.lg,
  },
  permissionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  scanner: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: AppTheme.spacing.lg,
    paddingBottom: AppTheme.spacing.lg,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  backButton: {
    padding: AppTheme.spacing.sm,
    marginRight: AppTheme.spacing.md,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  scanArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: AppTheme.spacing.xl,
  },
  scanFrame: {
    width: 250,
    height: 250,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: AppTheme.colors.primary,
    borderWidth: 4,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  instructionText: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
    marginTop: AppTheme.spacing.xl,
    fontWeight: '500',
  },
  processingContainer: {
    position: 'absolute',
    bottom: -80,
    alignItems: 'center',
  },
  processingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: AppTheme.spacing.lg,
    paddingVertical: AppTheme.spacing.md,
    borderRadius: AppTheme.spacing.lg,
    gap: AppTheme.spacing.sm,
  },
  processingText: {
    fontSize: 14,
    color: AppTheme.colors.text.primary,
    fontWeight: '600',
  },
  bottomControls: {
    paddingHorizontal: AppTheme.spacing.xl,
    paddingBottom: 40,
    alignItems: 'center',
  },
  rescanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppTheme.colors.primary,
    paddingHorizontal: AppTheme.spacing.lg,
    paddingVertical: AppTheme.spacing.md,
    borderRadius: AppTheme.spacing.lg,
    gap: AppTheme.spacing.sm,
  },
  rescanButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  manualButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: AppTheme.spacing.lg,
    paddingVertical: AppTheme.spacing.md,
    borderRadius: AppTheme.spacing.lg,
    marginTop: AppTheme.spacing.md,
    gap: AppTheme.spacing.sm,
  },
  manualButtonText: {
    color: AppTheme.colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default QRScannerScreen;
