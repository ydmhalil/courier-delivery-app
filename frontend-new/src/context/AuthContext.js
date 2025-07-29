import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../services/authService';
import { packageService } from '../services/packageService';
import { routeService } from '../services/routeService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    console.log('🔍 Checking auth state...');
    try {
      const storedToken = await AsyncStorage.getItem('token');
      const storedUser = await AsyncStorage.getItem('user');
      
      console.log('📱 Stored token exists:', !!storedToken);
      console.log('👤 Stored user exists:', !!storedUser);
      
      if (storedToken && storedUser) {
        console.log('✅ Setting tokens to services...');
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        authService.setAuthToken(storedToken);
        packageService.setAuthToken(storedToken);
        routeService.setAuthToken(storedToken);
        console.log('✅ Tokens set successfully');
      } else {
        console.log('❌ No stored auth found');
      }
    } catch (error) {
      console.error('❌ Error checking auth state:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      console.log('🔐 Starting login process...');
      const response = await authService.login(email, password);
      const { access_token } = response;
      console.log('🔐 Login response received, token:', !!access_token);
      
      // Get user details
      console.log('🔐 Setting tokens to services...');
      authService.setAuthToken(access_token);
      packageService.setAuthToken(access_token);
      routeService.setAuthToken(access_token);
      
      console.log('🔐 Getting current user...');
      const userResponse = await authService.getCurrentUser();
      console.log('🔐 User response:', !!userResponse);
      
      // Store in AsyncStorage
      console.log('🔐 Storing in AsyncStorage...');
      await AsyncStorage.setItem('token', access_token);
      await AsyncStorage.setItem('user', JSON.stringify(userResponse));
      
      console.log('🔐 Setting state...');
      setToken(access_token);
      setUser(userResponse);
      
      console.log('✅ Login completed successfully');
      return { success: true };
    } catch (error) {
      console.error('❌ Login error:', error);
      return { 
        success: false, 
        error: error.message || 'Giriş yapılırken bir hata oluştu'
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await authService.register(userData);
      return { success: true, data: response };
    } catch (error) {
      console.error('❌ Registration error:', error);
      return { 
        success: false, 
        error: error.message || 'Kayıt olurken bir hata oluştu'
      };
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      setToken(null);
      setUser(null);
      authService.setAuthToken(null);
      packageService.setAuthToken(null);
      routeService.setAuthToken(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
