import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { CameraView, Camera } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { packageService } from '../../services/packageService';
import { locationService } from '../../services/locationService';

const QRScannerScreen = ({ navigation }) => {
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
        <Text style={styles.message}>Kamera izni isteniyor...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionContainer}>
          <Ionicons name="camera-outline" size={64} color="#6B7280" />
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
      <CameraView
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ["qr", "pdf417"],
        }}
        style={styles.scanner}
      />
      <View style={styles.overlay}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>QR Kod Tara</Text>
            <View style={styles.placeholder} />
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
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>İşleniyor...</Text>
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
              <Ionicons name="create-outline" size={20} color="white" />
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
    backgroundColor: '#000',
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
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  placeholder: {
    width: 40,
  },
  scanArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  scanFrame: {
    width: 250,
    height: 250,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: '#3B82F6',
    borderWidth: 3,
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
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 30,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    marginTop: 20,
    padding: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.8)',
    borderRadius: 8,
  },
  loadingText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    paddingBottom: 50,
    paddingHorizontal: 20,
  },
  rescanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  rescanButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  manualButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6B7280',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  manualButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  message: {
    textAlign: 'center',
    paddingBottom: 10,
    color: 'white',
    fontSize: 16,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#F9FAFB',
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  permissionMessage: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  permissionButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default QRScannerScreen;
