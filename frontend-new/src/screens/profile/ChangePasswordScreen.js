import React, { useState, useCallback } from 'react';
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

// Separate PasswordInput component to prevent re-renders
const PasswordInput = React.memo(({ label, value, onChangeText, placeholder, showPassword, onToggleVisibility }) => {
  const inputRef = React.useRef(null);
  
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.passwordContainer}>
        <TextInput
          ref={inputRef}
          style={styles.passwordInput}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="default"
          textContentType="none"
          importantForAutofill="no"
          blurOnSubmit={false}
          returnKeyType="next"
        />
        <TouchableOpacity
          style={styles.eyeButton}
          onPress={onToggleVisibility}
          activeOpacity={0.7}
        >
          <Ionicons
            name={showPassword ? "eye-off" : "eye"}
            size={20}
            color="#6B7280"
          />
        </TouchableOpacity>
      </View>
    </View>
  );
});

const ChangePasswordScreen = ({ navigation }) => {
  const { user, token } = useAuth();
  
  // Separate state for each field to prevent re-renders
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [loading, setLoading] = useState(false);

  const togglePasswordVisibility = useCallback((field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  }, []);

  const validatePasswords = () => {
    if (!currentPassword) {
      Alert.alert('Hata', 'Mevcut şifrenizi girin');
      return false;
    }

    if (!newPassword) {
      Alert.alert('Hata', 'Yeni şifrenizi girin');
      return false;
    }

    if (newPassword.length < 6) {
      Alert.alert('Hata', 'Yeni şifre en az 6 karakter olmalıdır');
      return false;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Hata', 'Yeni şifreler eşleşmiyor');
      return false;
    }

    if (currentPassword === newPassword) {
      Alert.alert('Hata', 'Yeni şifre mevcut şifreden farklı olmalıdır');
      return false;
    }

    return true;
  };

  const handleChangePassword = async () => {
    if (!validatePasswords()) return;

    if (!token) {
      Alert.alert('Hata', 'Oturum bilgisi bulunamadı. Lütfen tekrar giriş yapın.');
      return;
    }

    setLoading(true);

    try {
      console.log('Token exists:', !!token);
      console.log('Making request to change password...');
      
      const response = await fetch('http://192.168.1.108:8000/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });

      if (response.ok) {
        Alert.alert(
          'Başarılı',
          'Şifreniz başarıyla değiştirildi',
          [
            {
              text: 'Tamam',
              onPress: () => navigation.goBack(),
            }
          ]
        );
      } else {
        const errorData = await response.json();
        console.log('Server error response:', errorData);
        Alert.alert('Hata', errorData.detail || 'Şifre değiştirilemedi');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      console.error('Error details:', error.message);
      Alert.alert('Hata', `Bağlantı hatası: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrength = (password) => {
    if (password.length === 0) return null;
    if (password.length < 6) return { level: 'weak', color: '#EF4444', text: 'Zayıf' };
    if (password.length < 8) return { level: 'medium', color: '#F59E0B', text: 'Orta' };
    if (password.length >= 8 && /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      return { level: 'strong', color: '#10B981', text: 'Güçlü' };
    }
    return { level: 'medium', color: '#F59E0B', text: 'Orta' };
  };

  const passwordStrength = getPasswordStrength(newPassword);

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
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => {
            console.log('ChangePassword - Back button pressed');
            navigation.goBack();
          }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Şifre Değiştir</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Form */}
      <View style={styles.form}>
        {/* Security Notice */}
        <View style={styles.noticeBox}>
          <Ionicons name="shield-checkmark" size={24} color="#3B82F6" />
          <View style={styles.noticeContent}>
            <Text style={styles.noticeTitle}>Güvenlik</Text>
            <Text style={styles.noticeText}>
              Şifreniz güvenliğiniz için düzenli olarak değiştirin. Güçlü bir şifre seçin.
            </Text>
          </View>
        </View>

        {/* Form Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Şifre Değiştir</Text>
          
          <PasswordInput
            label="Mevcut Şifre"
            value={currentPassword}
            onChangeText={setCurrentPassword}
            placeholder="Mevcut şifrenizi girin"
            showPassword={showPasswords.current}
            onToggleVisibility={() => togglePasswordVisibility('current')}
          />

          <PasswordInput
            label="Yeni Şifre"
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="Yeni şifrenizi girin"
            showPassword={showPasswords.new}
            onToggleVisibility={() => togglePasswordVisibility('new')}
          />

          {/* Password Strength Indicator */}
          {passwordStrength && (
            <View style={styles.strengthContainer}>
              <View style={styles.strengthBar}>
                <View
                  style={[
                    styles.strengthFill,
                    {
                      width: passwordStrength.level === 'weak' ? '33%' : 
                            passwordStrength.level === 'medium' ? '66%' : '100%',
                      backgroundColor: passwordStrength.color,
                    }
                  ]}
                />
              </View>
              <Text style={[styles.strengthText, { color: passwordStrength.color }]}>
                {passwordStrength.text}
              </Text>
            </View>
          )}

          <PasswordInput
            label="Yeni Şifre (Tekrar)"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Yeni şifrenizi tekrar girin"
            showPassword={showPasswords.confirm}
            onToggleVisibility={() => togglePasswordVisibility('confirm')}
          />

          {/* Password Match Indicator */}
          {confirmPassword.length > 0 && (
            <View style={styles.matchContainer}>
              <Ionicons
                name={newPassword === confirmPassword ? "checkmark-circle" : "close-circle"}
                size={16}
                color={newPassword === confirmPassword ? "#10B981" : "#EF4444"}
              />
              <Text style={[
                styles.matchText,
                { color: newPassword === confirmPassword ? "#10B981" : "#EF4444" }
              ]}>
                {newPassword === confirmPassword ? "Şifreler eşleşiyor" : "Şifreler eşleşmiyor"}
              </Text>
            </View>
          )}
        </View>

        {/* Password Requirements */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Şifre Gereksinimleri</Text>
          
          <View style={styles.requirementItem}>
            <Ionicons
              name={newPassword.length >= 6 ? "checkmark-circle" : "ellipse-outline"}
              size={16}
              color={newPassword.length >= 6 ? "#10B981" : "#6B7280"}
            />
            <Text style={[
              styles.requirementText,
              { color: newPassword.length >= 6 ? "#10B981" : "#6B7280" }
            ]}>
              En az 6 karakter
            </Text>
          </View>

          <View style={styles.requirementItem}>
            <Ionicons
              name={/(?=.*[a-z])(?=.*[A-Z])/.test(newPassword) ? "checkmark-circle" : "ellipse-outline"}
              size={16}
              color={/(?=.*[a-z])(?=.*[A-Z])/.test(newPassword) ? "#10B981" : "#6B7280"}
            />
            <Text style={[
              styles.requirementText,
              { color: /(?=.*[a-z])(?=.*[A-Z])/.test(newPassword) ? "#10B981" : "#6B7280" }
            ]}>
              Büyük ve küçük harf
            </Text>
          </View>

          <View style={styles.requirementItem}>
            <Ionicons
              name={/\d/.test(newPassword) ? "checkmark-circle" : "ellipse-outline"}
              size={16}
              color={/\d/.test(newPassword) ? "#10B981" : "#6B7280"}
            />
            <Text style={[
              styles.requirementText,
              { color: /\d/.test(newPassword) ? "#10B981" : "#6B7280" }
            ]}>
              En az bir rakam
            </Text>
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, { opacity: loading ? 0.5 : 1 }]}
          onPress={handleChangePassword}
          disabled={loading}
        >
          <Text style={styles.saveButtonText}>
            {loading ? 'Değiştiriliyor...' : 'Şifreyi Değiştir'}
          </Text>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  form: {
    padding: 20,
  },
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EBF8FF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  noticeContent: {
    flex: 1,
    marginLeft: 12,
  },
  noticeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  noticeText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
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
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    backgroundColor: 'white',
    minHeight: 48,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 48,
  },
  eyeButton: {
    padding: 12,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  strengthContainer: {
    marginTop: 8,
    marginBottom: 8,
  },
  strengthBar: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 4,
  },
  strengthFill: {
    height: '100%',
    borderRadius: 2,
  },
  strengthText: {
    fontSize: 12,
    fontWeight: '500',
  },
  matchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  matchText: {
    fontSize: 14,
    marginLeft: 8,
    fontWeight: '500',
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  requirementText: {
    fontSize: 14,
    marginLeft: 8,
  },
  saveButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});

export default ChangePasswordScreen;
