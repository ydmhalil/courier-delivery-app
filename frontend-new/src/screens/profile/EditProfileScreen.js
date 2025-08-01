import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';

const EditProfileScreen = ({ navigation }) => {
  const { user, updateUser, token } = useAuth();
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        email: user.email || '',
        phone: user.phone || '',
      });
    }
  }, [user]);

  const handleSave = async () => {
    if (!formData.full_name.trim()) {
      Alert.alert('Hata', 'Ad Soyad alanı zorunludur');
      return;
    }

    if (!formData.email.trim()) {
      Alert.alert('Hata', 'E-posta alanı zorunludur');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      Alert.alert('Hata', 'Geçerli bir e-posta adresi girin');
      return;
    }

    setLoading(true);

    try {
      // Call API to update user profile
      const response = await fetch('http://192.168.1.108:8000/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        updateUser(updatedUser);
        Alert.alert('Başarılı', 'Profil bilgileriniz güncellendi');
        navigation.goBack();
      } else {
        const errorData = await response.json();
        Alert.alert('Hata', errorData.detail || 'Profil güncellenemedi');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Hata', 'Bağlantı hatası. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        style={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profili Düzenle</Text>
        <TouchableOpacity onPress={handleSave} disabled={loading}>
          <Text style={[styles.saveButton, { opacity: loading ? 0.5 : 1 }]}>
            Kaydet
          </Text>
        </TouchableOpacity>
      </View>

      {/* Form */}
      <View style={styles.form}>
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {formData.full_name?.charAt(0)?.toUpperCase() || 'U'}
            </Text>
          </View>
          <TouchableOpacity style={styles.changePhotoButton}>
            <Text style={styles.changePhotoText}>Fotoğraf Değiştir</Text>
          </TouchableOpacity>
        </View>

        {/* Form Fields */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Kişisel Bilgiler</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Ad Soyad *</Text>
            <TextInput
              style={styles.input}
              value={formData.full_name}
              onChangeText={(text) => setFormData(prev => ({ ...prev, full_name: text }))}
              placeholder="Adınız ve soyadınız"
              autoCapitalize="words"
              autoCorrect={false}
              returnKeyType="next"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>E-posta *</Text>
            <TextInput
              style={styles.input}
              value={formData.email}
              onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
              placeholder="ornek@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Telefon</Text>
            <TextInput
              style={styles.input}
              value={formData.phone}
              onChangeText={(text) => setFormData(prev => ({ ...prev, phone: text }))}
              placeholder="+90 5XX XXX XX XX"
              keyboardType="phone-pad"
              autoCorrect={false}
              returnKeyType="done"
            />
          </View>
        </View>

        {/* Additional Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ek Bilgiler</Text>
          
          <View style={styles.infoItem}>
            <Ionicons name="calendar-outline" size={20} color="#6B7280" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Üyelik Tarihi</Text>
              <Text style={styles.infoValue}>
                {user?.created_at ? new Date(user.created_at).toLocaleDateString('tr-TR') : 'Bilinmiyor'}
              </Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <Ionicons name="business-outline" size={20} color="#6B7280" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Departman</Text>
              <Text style={styles.infoValue}>Kurye</Text>
            </View>
          </View>
        </View>
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
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  saveButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6',
  },
  form: {
    padding: 20,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
  },
  changePhotoButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  changePhotoText: {
    fontSize: 16,
    color: '#3B82F6',
    fontWeight: '500',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: 'white',
    minHeight: 48,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
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
    fontWeight: '500',
    color: '#1F2937',
  },
});

export default EditProfileScreen;
