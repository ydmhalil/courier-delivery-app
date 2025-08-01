import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';

import DashboardScreen from '../screens/main/DashboardScreen';
import PackageListScreen from '../screens/main/PackageListScreen';
import QRScannerScreen from '../screens/main/QRScannerScreen';
import RouteScreen from '../screens/main/RouteScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import PackageDetailScreen from '../screens/main/PackageDetailScreen';
import AddPackageScreen from '../screens/main/AddPackageScreen';
import ChatbotScreen from '../screens/main/ChatbotScreen';
import EditProfileScreen from '../screens/profile/EditProfileScreen';
import NotificationSettingsScreen from '../screens/profile/NotificationSettingsScreen';
import ChangePasswordScreen from '../screens/profile/ChangePasswordScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const PackageStack = () => {
  return (
    <Stack.Navigator initialRouteName="PackageList">
      <Stack.Screen 
        name="PackageList" 
        component={PackageListScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="PackageDetail" 
        component={PackageDetailScreen}
        options={{ title: 'Paket Detayları' }}
      />
      <Stack.Screen 
        name="AddPackage" 
        component={AddPackageScreen}
        options={{ title: 'Paket Ekle' }}
      />
      <Stack.Screen 
        name="QRScanner" 
        component={QRScannerScreen}
        options={{ title: 'QR Kod Tara' }}
      />
    </Stack.Navigator>
  );
};

const RouteStack = () => {
  return (
    <Stack.Navigator initialRouteName="Route">
      <Stack.Screen 
        name="Route" 
        component={RouteScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="PackageDetail" 
        component={PackageDetailScreen}
        options={{ title: 'Paket Detayları' }}
      />
    </Stack.Navigator>
  );
};

const ProfileStack = () => {
  return (
    <Stack.Navigator initialRouteName="ProfileMain">
      <Stack.Screen 
        name="ProfileMain" 
        component={ProfileScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="EditProfile" 
        component={EditProfileScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="NotificationSettings" 
        component={NotificationSettingsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="ChangePassword" 
        component={ChangePasswordScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};

const MainNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Dashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Packages') {
            iconName = focused ? 'cube' : 'cube-outline';
          } else if (route.name === 'Routes') {
            iconName = focused ? 'map' : 'map-outline';
          } else if (route.name === 'Chatbot') {
            iconName = focused ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#3B82F6',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen}
        options={{ title: 'Ana Sayfa' }}
      />
      <Tab.Screen 
        name="Packages" 
        component={PackageStack}
        options={{ title: 'Paketler' }}
      />
      <Tab.Screen 
        name="Routes" 
        component={RouteStack}
        options={{ title: 'Rotalar' }}
      />
      <Tab.Screen 
        name="Chatbot" 
        component={ChatbotScreen}
        options={{ title: 'AI Asistan' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileStack}
        options={{ title: 'Profil' }}
      />
    </Tab.Navigator>
  );
};

export default MainNavigator;
