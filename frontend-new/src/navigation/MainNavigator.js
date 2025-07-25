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

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const PackageStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="PackageList" 
        component={PackageListScreen}
        options={{ title: 'Packages' }}
      />
      <Stack.Screen 
        name="PackageDetail" 
        component={PackageDetailScreen}
        options={{ title: 'Package Details' }}
      />
      <Stack.Screen 
        name="AddPackage" 
        component={AddPackageScreen}
        options={{ title: 'Add Package' }}
      />
      <Stack.Screen 
        name="QRScanner" 
        component={QRScannerScreen}
        options={{ title: 'Scan QR Code' }}
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
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Packages" component={PackageStack} />
      <Tab.Screen name="Routes" component={RouteScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

export default MainNavigator;
