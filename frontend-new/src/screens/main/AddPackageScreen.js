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
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import { packageService } from '../../services/packageService';

const AddPackageScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    kargo_id: '',
    recipient_name: '',
    address: '',
    phone: '',
    delivery_type: 'standard',
    time_window_start: '',
    time_window_end: '',
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    const { kargo_id, recipient_name, address } = formData;

    if (!kargo_id || !recipient_name || !address) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const newPackage = await packageService.createPackage(formData);
      Alert.alert(
        'Success!',
        `Package ${newPackage.kargo_id} has been added successfully.`,
        [
          {
            text: 'View Package',
            onPress: () => {
              navigation.replace('PackageDetail', { packageId: newPackage.id });
            },
          },
          {
            text: 'Add Another',
            onPress: () => {
              setFormData({
                kargo_id: '',
                recipient_name: '',
                address: '',
                phone: '',
                delivery_type: 'standard',
                time_window_start: '',
                time_window_end: '',
              });
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error creating package:', error);
      Alert.alert('Error', 'Failed to create package. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const timePattern = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;

  const validateTimeFormat = (time) => {
    return timePattern.test(time);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Add New Package</Text>
          <Text style={styles.headerSubtitle}>
            Enter package details manually
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Package ID *</Text>
            <TextInput
              style={styles.input}
              value={formData.kargo_id}
              onChangeText={(value) => handleInputChange('kargo_id', value)}
              placeholder="Enter package ID (e.g., PKT123456)"
              autoCapitalize="characters"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Recipient Name *</Text>
            <TextInput
              style={styles.input}
              value={formData.recipient_name}
              onChangeText={(value) => handleInputChange('recipient_name', value)}
              placeholder="Enter recipient's full name"
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Address *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.address}
              onChangeText={(value) => handleInputChange('address', value)}
              placeholder="Enter complete delivery address"
              multiline={true}
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              value={formData.phone}
              onChangeText={(value) => handleInputChange('phone', value)}
              placeholder="Enter phone number"
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Delivery Type *</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.delivery_type}
                onValueChange={(value) => handleInputChange('delivery_type', value)}
                style={styles.picker}
              >
                <Picker.Item label="Standard" value="standard" />
                <Picker.Item label="Express" value="express" />
                <Picker.Item label="Scheduled" value="scheduled" />
              </Picker>
            </View>
          </View>

          {formData.delivery_type === 'scheduled' && (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Start Time (HH:MM)</Text>
                <TextInput
                  style={styles.input}
                  value={formData.time_window_start}
                  onChangeText={(value) => handleInputChange('time_window_start', value)}
                  placeholder="08:00"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>End Time (HH:MM)</Text>
                <TextInput
                  style={styles.input}
                  value={formData.time_window_end}
                  onChangeText={(value) => handleInputChange('time_window_end', value)}
                  placeholder="18:00"
                  keyboardType="numeric"
                />
              </View>
            </>
          )}

          {/* Delivery Type Info */}
          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={20} color="#3B82F6" />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Delivery Types:</Text>
              <Text style={styles.infoText}>
                • <Text style={{ color: '#EF4444' }}>Express</Text>: High priority delivery
              </Text>
              <Text style={styles.infoText}>
                • <Text style={{ color: '#F59E0B' }}>Scheduled</Text>: Delivery within time window
              </Text>
              <Text style={styles.infoText}>
                • <Text style={{ color: '#10B981' }}>Standard</Text>: Normal delivery
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <Text style={styles.submitButtonText}>Adding Package...</Text>
            ) : (
              <>
                <Ionicons name="add-outline" size={20} color="white" />
                <Text style={styles.submitButtonText}>Add Package</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.scanButton}
            onPress={() => navigation.navigate('QRScanner')}
          >
            <Ionicons name="qr-code-outline" size={20} color="#3B82F6" />
            <Text style={styles.scanButtonText}>Or Scan QR Code</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollContainer: {
    flex: 1,
  },
  header: {
    backgroundColor: 'white',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  form: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white',
    color: '#1F2937',
  },
  textArea: {
    height: 80,
    paddingTop: 12,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    backgroundColor: 'white',
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#EBF4FF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: '#374151',
    marginBottom: 2,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    borderRadius: 8,
    gap: 8,
    marginBottom: 12,
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    paddingVertical: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3B82F6',
    gap: 8,
  },
  scanButtonText: {
    color: '#3B82F6',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AddPackageScreen;
