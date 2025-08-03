import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NotificationSettingsScreen = ({ navigation }) => {
  const [settings, setSettings] = useState({
    pushNotifications: true,
    emailNotifications: true,
    smsNotifications: false,
    orderUpdates: true,
    routeUpdates: true,
    promotions: false,
    sounds: true,
    vibration: true,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem('notificationSettings');
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
    }
  };

  const saveSettings = async (newSettings) => {
    try {
      await AsyncStorage.setItem('notificationSettings', JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error('Error saving notification settings:', error);
      Alert.alert('Hata', 'Ayarlar kaydedilemedi');
    }
  };

  const toggleSetting = (key) => {
    const newSettings = { ...settings, [key]: !settings[key] };
    saveSettings(newSettings);
  };

  const SettingItem = ({ icon, title, subtitle, value, onToggle, iconColor = "#3B82F6" }) => (
    <View style={styles.settingItem}>
      <View style={styles.settingLeft}>
        <View style={[styles.iconContainer, { backgroundColor: `${iconColor}20` }]}>
          <Ionicons name={icon} size={20} color={iconColor} />
        </View>
        <View style={styles.settingContent}>
          <Text style={styles.settingTitle}>{title}</Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: '#E5E7EB', true: '#3B82F6' }}
        thumbColor={value ? '#FFFFFF' : '#F3F4F6'}
      />
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => {
            console.log('NotificationSettings - Back button pressed');
            navigation.goBack();
          }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bildirim Ayarları</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* General Notifications */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Genel Bildirimler</Text>
        
        <SettingItem
          icon="notifications"
          title="Push Bildirimleri"
          subtitle="Uygulama bildirimlerini al"
          value={settings.pushNotifications}
          onToggle={() => toggleSetting('pushNotifications')}
        />
        
        <SettingItem
          icon="mail"
          title="E-posta Bildirimleri"
          subtitle="E-posta ile bildirim al"
          value={settings.emailNotifications}
          onToggle={() => toggleSetting('emailNotifications')}
          iconColor="#10B981"
        />
        
        <SettingItem
          icon="chatbubble"
          title="SMS Bildirimleri"
          subtitle="SMS ile bildirim al"
          value={settings.smsNotifications}
          onToggle={() => toggleSetting('smsNotifications')}
          iconColor="#F59E0B"
        />
      </View>

      {/* Delivery Notifications */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Teslimat Bildirimleri</Text>
        
        <SettingItem
          icon="cube"
          title="Sipariş Güncellemeleri"
          subtitle="Yeni sipariş ve durum değişiklikleri"
          value={settings.orderUpdates}
          onToggle={() => toggleSetting('orderUpdates')}
          iconColor="#8B5CF6"
        />
        
        <SettingItem
          icon="navigate"
          title="Rota Güncellemeleri"
          subtitle="Rota değişiklikleri ve optimizasyonlar"
          value={settings.routeUpdates}
          onToggle={() => toggleSetting('routeUpdates')}
          iconColor="#EF4444"
        />
      </View>

      {/* Marketing */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Pazarlama</Text>
        
        <SettingItem
          icon="megaphone"
          title="Promosyonlar ve Duyurular"
          subtitle="Özel teklifler ve şirket haberleri"
          value={settings.promotions}
          onToggle={() => toggleSetting('promotions')}
          iconColor="#F97316"
        />
      </View>

      {/* Sound & Vibration */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ses ve Titreşim</Text>
        
        <SettingItem
          icon="volume-high"
          title="Bildirim Sesleri"
          subtitle="Bildirimler geldiğinde ses çal"
          value={settings.sounds}
          onToggle={() => toggleSetting('sounds')}
          iconColor="#06B6D4"
        />
        
        <SettingItem
          icon="phone-portrait"
          title="Titreşim"
          subtitle="Bildirimler geldiğinde titret"
          value={settings.vibration}
          onToggle={() => toggleSetting('vibration')}
          iconColor="#84CC16"
        />
      </View>

      {/* Info */}
      <View style={styles.infoSection}>
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color="#6B7280" />
          <Text style={styles.infoText}>
            Bildirim ayarlarınız bu cihaza özeldir. Diğer cihazlarınızda ayrı ayrı ayarlamanız gerekir.
          </Text>
        </View>
      </View>
    </ScrollView>
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
  section: {
    backgroundColor: 'white',
    marginTop: 20,
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  infoSection: {
    padding: 20,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginLeft: 12,
  },
});

export default NotificationSettingsScreen;
