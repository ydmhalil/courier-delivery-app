// Design System - Modern UI Theme
// Chatbot'taki tasarım dili ile uyumlu ortak tema

const AppTheme = {
  // Primary Colors - Chatbot ile uyumlu gradient renkler
  colors: {
    primary: '#6B73FF',
    primaryDark: '#9C27B0',
    primaryLight: '#E3F2FD',
    
    // Secondary Colors
    secondary: '#4CAF50',
    secondaryLight: '#E8F5E8',
    
    // Status Colors - Mevcut kargo renkleri korundu
    express: '#EF4444',     // Ekspres - Kırmızı
    scheduled: '#F59E0B',   // Programlı - Turuncu
    standard: '#10B981',    // Standart - Yeşil
    delivered: '#3B82F6',   // Teslim Edildi - Mavi
    
    // Neutral Colors
    background: '#F8F9FA',
    surface: '#FFFFFF',
    surfaceVariant: '#F5F5F5',
    
    // Text Colors
    text: {
      primary: '#1F2937',
      secondary: '#374151',
      tertiary: '#6B7280',
      disabled: '#9CA3AF',
    },
    
    onPrimary: '#FFFFFF',
    onSurface: '#2C3E50',
    onSurfaceVariant: '#6B7280',
    
    // Border Colors
    border: '#E5E7EB',
    borderLight: '#F3F4F6',
    
    // Success, Warning, Error
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    
    // Shadow
    shadow: '#000000',
  },
  
  // Typography
  typography: {
    h1: {
      fontSize: 32,
      fontWeight: '700',
      lineHeight: 40,
    },
    h2: {
      fontSize: 28,
      fontWeight: '700',
      lineHeight: 36,
    },
    h3: {
      fontSize: 24,
      fontWeight: '600',
      lineHeight: 32,
    },
    h4: {
      fontSize: 20,
      fontWeight: '600',
      lineHeight: 28,
    },
    body1: {
      fontSize: 16,
      fontWeight: '400',
      lineHeight: 24,
    },
    body2: {
      fontSize: 14,
      fontWeight: '400',
      lineHeight: 20,
    },
    caption: {
      fontSize: 12,
      fontWeight: '400',
      lineHeight: 16,
    },
    button: {
      fontSize: 16,
      fontWeight: '600',
      textAlign: 'center',
    },
  },
  
  // Spacing System
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  
  // Border Radius
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    round: 50,
  },
  
  // Shadows
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 4,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 8,
    },
  },
  
  // Gradient Presets - Chatbot header gradient
  gradients: {
    primary: ['#6B73FF', '#9C27B0'],
    primaryReverse: ['#9C27B0', '#6B73FF'],
    success: ['#4CAF50', '#8BC34A'],
    warning: ['#FF9800', '#FFC107'],
    error: ['#F44336', '#E91E63'],
    surface: ['#FFFFFF', '#F8F9FA'],
  },
};

export default AppTheme;
