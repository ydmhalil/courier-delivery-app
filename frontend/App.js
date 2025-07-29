import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';

import DashboardScreen from './src/screens/DashboardScreen';
import RouteScreen from './src/screens/RouteScreen';
import PackageDetailScreen from './src/screens/PackageDetailScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function HomeStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Dashboard" component={DashboardScreen} />
      <Stack.Screen name="PackageDetail" component={PackageDetailScreen} />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;
            if (route.name === 'Ana Sayfa') {
              iconName = focused ? 'home' : 'home-outline';
            } else if (route.name === 'Rotalar') {
              iconName = focused ? 'map' : 'map-outline';
            }
            return <Ionicons name={iconName} size={size} color={color} />;
          },
        })}
      >
        <Tab.Screen name="Ana Sayfa" component={HomeStack} options={{ headerShown: false }} />
        <Tab.Screen name="Rotalar" component={RouteScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
