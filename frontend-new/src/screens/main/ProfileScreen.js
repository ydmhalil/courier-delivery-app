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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../context/AuthContext';
import LocationSelectorModal from '../../components/LocationSelectorModal';

const ProfileScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [defaultDepot, setDefaultDepot] = useState(null);
  const [showLocationSelector, setShowLocationSelector] = useState(false);

  // Load saved depot location on component mount
  useEffect(() => {
    loadDefaultDepot();
  }, []);

  const loadDefaultDepot = async () => {
    try {
      const savedDepot = await AsyncStorage.getItem('defaultDepot');
      if (savedDepot) {
        setDefaultDepot(JSON.parse(savedDepot));
      } else {
        // Default depot location (Kadıköy)
        setDefaultDepot({
          latitude: 40.9877,
          longitude: 29.0283,
          name: 'Kadıköy Kargo Merkezi',
          address: 'Kadıköy, İstanbul'
        });
      }
    } catch (error) {
      console.error('Error loading default depot:', error);
    }
  };

  const handleDepotLocationSelected = async (location) => {
    try {
      await AsyncStorage.setItem('defaultDepot', JSON.stringify(location));
      setDefaultDepot(location);
      setShowLocationSelector(false);
      Alert.alert('Başarılı', 'Ana depo konumunuz güncellendi.');
    } catch (error) {
      console.error('Error saving depot location:', error);
      Alert.alert('Hata', 'Konum kaydedilemedi. Lütfen tekrar deneyin.');
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Çıkış Yap',
      'Çıkış yapmak istediğinizden emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        { 
          text: 'Çıkış Yap', 
          style: 'destructive',
          onPress: logout
        },
      ]
    );
  };

  const ProfileItem = ({ icon, title, subtitle, onPress, showArrow = true }) => (
    <TouchableOpacity style={styles.profileItem} onPress={onPress}>
      <View style={styles.profileItemLeft}>
        <View style={styles.iconContainer}>
          <Ionicons name={icon} size={20} color="#3B82F6" />
        </View>
        <View>
          <Text style={styles.profileItemTitle}>{title}</Text>
          {subtitle && <Text style={styles.profileItemSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      {showArrow && (
        <Ionicons name="chevron-forward" size={20} color="#6B7280" />
      )}
    </TouchableOpacity>
  );

  return (
    <>
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profil</Text>
      </View>

      {/* User Info */}
      <View style={styles.userSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
          </Text>
        </View>
        <Text style={styles.userName}>{user?.full_name}</Text>
        <Text style={styles.userEmail}>{user?.email}</Text>
        {user?.phone && (
          <Text style={styles.userPhone}>{user.phone}</Text>
        )}
      </View>

      {/* Profile Options */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Hesap Ayarları</Text>
        
        <ProfileItem
          icon="business-outline"
          title="Ana Depo Konumu"
          subtitle={defaultDepot ? defaultDepot.name || defaultDepot.address : 'Konum seçilmedi'}
          onPress={() => setShowLocationSelector(true)}
        />
        
        <ProfileItem
          icon="person-outline"
          title="Profili Düzenle"
          subtitle="Kişisel bilgilerinizi güncelleyin"
          onPress={() => navigation.navigate('EditProfile')}
        />
        
        <ProfileItem
          icon="notifications-outline"
          title="Bildirimler"
          subtitle="Bildirim tercihlerinizi yönetin"
          onPress={() => navigation.navigate('NotificationSettings')}
        />
        
        <ProfileItem
          icon="lock-closed-outline"
          title="Şifre Değiştir"
          subtitle="Şifrenizi güncelleyin"
          onPress={() => navigation.navigate('ChangePassword')}
        />
      </View>

      {/* App Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Uygulama Ayarları</Text>
        
        <ProfileItem
          icon="language-outline"
          title="Dil"
          subtitle="Türkçe"
          onPress={() => {
            // TODO: Navigate to language settings
            Alert.alert('Yakında', 'Dil ayarları yakında gelecek');
          }}
        />
        
        <ProfileItem
          icon="color-palette-outline"
          title="Tema"
          subtitle="Açık mod"
          onPress={() => {
            // TODO: Navigate to theme settings
            Alert.alert('Yakında', 'Tema ayarları yakında gelecek');
          }}
        />
        
        <ProfileItem
          icon="location-outline"
          title="Konum Servisleri"
          subtitle="Etkin"
          onPress={() => {
            // TODO: Navigate to location settings
            Alert.alert('Yakında', 'Konum ayarları yakında gelecek');
          }}
        />
      </View>

      {/* Support */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Destek</Text>
        
        <ProfileItem
          icon="help-circle-outline"
          title="Yardım & SSS"
          subtitle="Yardım alın ve cevapları bulun"
          onPress={() => {
            Alert.alert('Yakında', 'Yardım bölümü yakında gelecek');
          }}
        />
        
        <ProfileItem
          icon="mail-outline"
          title="Destek İletişim"
          subtitle="Ekibimizle iletişime geçin"
          onPress={() => {
            Alert.alert('Yakında', 'Destek iletişimi yakında gelecek');
          }}
        />
        
        <ProfileItem
          icon="information-circle-outline"
          title="Hakkında"
          subtitle="Uygulama sürümü 1.0.0"
          onPress={() => {
            Alert.alert(
              'Kurye Teslimat Uygulaması Hakkında',
              'Sürüm 1.0.0\n\nKuryeler için AI destekli rota optimizasyonu ve paket yönetimi.'
            );
          }}
        />
      </View>

      {/* Logout */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          <Text style={styles.logoutText}>Çıkış Yap</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom spacing */}
      <View style={styles.bottomSpacing} />
    </ScrollView>
    
    {/* Location Selector Modal */}
    <LocationSelectorModal
      visible={showLocationSelector}
      onLocationSelected={handleDepotLocationSelected}
      onClose={() => setShowLocationSelector(false)}
    />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  userSection: {
    backgroundColor: 'white',
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 4,
  },
  userPhone: {
    fontSize: 16,
    color: '#6B7280',
  },
  section: {
    backgroundColor: 'white',
    marginBottom: 20,
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#374151',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  profileItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  profileItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EBF4FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  profileItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  profileItemSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
  },
  bottomSpacing: {
    height: 40,
  },
});

export default ProfileScreen;
