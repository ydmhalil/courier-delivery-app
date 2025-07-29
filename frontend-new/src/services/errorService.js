import { Alert } from 'react-native';
import { configService } from './configService';

/**
 * Enhanced Error Handling Service
 * Centralized error management with logging and user feedback
 */
class ErrorService {
  constructor() {
    this.shouldLog = configService.shouldLog();
    this.errorLog = [];
    this.maxLogSize = 100; // Keep last 100 errors
  }

  /**
   * Handle different types of errors with appropriate user feedback
   */
  handleError(error, context = 'Unknown', options = {}) {
    const errorInfo = this.categorizeError(error, context);
    
    // Log the error
    this.logError(errorInfo);
    
    // Show user feedback if not silent
    if (!options.silent) {
      this.showUserFeedback(errorInfo, options);
    }
    
    return errorInfo;
  }

  /**
   * Categorize errors for better handling
   */
  categorizeError(error, context) {
    const timestamp = new Date().toISOString();
    
    let category = 'Unknown';
    let severity = 'medium';
    let userMessage = 'Bir hata oluştu.';
    let actionable = false;
    
    // Network errors
    if (error.message?.includes('Network') || error.code === 'ERR_NETWORK') {
      category = 'Network';
      severity = 'high';
      userMessage = 'İnternet bağlantısını kontrol edin.';
      actionable = true;
    }
    
    // Location errors
    else if (error.code?.startsWith('E_LOCATION')) {
      category = 'Location';
      severity = 'medium';
      
      switch (error.code) {
        case 'E_LOCATION_TIMEOUT':
          userMessage = 'Konum alınırken zaman aşımı. Tekrar deneyin.';
          actionable = true;
          break;
        case 'E_LOCATION_UNAVAILABLE':
          userMessage = 'GPS servisleri kullanılamıyor.';
          actionable = true;
          break;
        case 'E_LOCATION_PERMISSION_DENIED':
          userMessage = 'Konum izni gerekli.';
          actionable = true;
          break;
        default:
          userMessage = 'Konum servisi hatası.';
      }
    }
    
    // API errors
    else if (error.response?.status) {
      category = 'API';
      const status = error.response.status;
      
      if (status === 401) {
        severity = 'high';
        userMessage = 'Oturum süresi dolmuş. Tekrar giriş yapın.';
        actionable = true;
      } else if (status === 403) {
        severity = 'high';
        userMessage = 'Bu işlem için yetkiniz yok.';
      } else if (status === 404) {
        severity = 'medium';
        userMessage = 'İstenen kaynak bulunamadı.';
      } else if (status >= 500) {
        severity = 'high';
        userMessage = 'Sunucu hatası. Lütfen daha sonra tekrar deneyin.';
        actionable = true;
      } else {
        userMessage = `API Hatası: ${status}`;
      }
    }
    
    // QR Code errors
    else if (context.includes('QR') || error.message?.includes('QR')) {
      category = 'QRCode';
      severity = 'medium';
      userMessage = 'QR kod okunamadı. Tekrar deneyin.';
      actionable = true;
    }
    
    // Validation errors
    else if (error.message?.includes('Invalid') || error.message?.includes('Required')) {
      category = 'Validation';
      severity = 'low';
      userMessage = 'Girilen bilgileri kontrol edin.';
      actionable = true;
    }

    return {
      timestamp,
      context,
      category,
      severity,
      userMessage,
      actionable,
      originalError: error,
      stack: error.stack
    };
  }

  /**
   * Log error with context
   */
  logError(errorInfo) {
    // Add to internal log
    this.errorLog.unshift(errorInfo);
    
    // Trim log if too large
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(0, this.maxLogSize);
    }
    
    // Console logging
    if (this.shouldLog) {
      console.group(`❌ ${errorInfo.category} Error in ${errorInfo.context}`);
      console.error('Message:', errorInfo.userMessage);
      console.error('Severity:', errorInfo.severity);
      console.error('Original:', errorInfo.originalError);
      if (errorInfo.stack) {
        console.error('Stack:', errorInfo.stack);
      }
      console.groupEnd();
    }
  }

  /**
   * Show appropriate user feedback
   */
  showUserFeedback(errorInfo, options = {}) {
    const { category, userMessage, actionable, severity } = errorInfo;
    
    // Don't show alerts for low severity errors unless forced
    if (severity === 'low' && !options.forceAlert) {
      return;
    }
    
    let buttons = [{ text: 'Tamam' }];
    
    // Add action buttons for actionable errors
    if (actionable && options.onRetry) {
      buttons = [
        { text: 'Tekrar Dene', onPress: options.onRetry },
        { text: 'İptal', style: 'cancel' }
      ];
    }
    
    Alert.alert(
      this.getCategoryTitle(category),
      userMessage,
      buttons
    );
  }

  /**
   * Get user-friendly category titles
   */
  getCategoryTitle(category) {
    const titles = {
      Network: 'Bağlantı Hatası',
      Location: 'Konum Hatası',
      API: 'Sunucu Hatası',
      QRCode: 'QR Kod Hatası',
      Validation: 'Geçersiz Bilgi',
      Unknown: 'Hata'
    };
    
    return titles[category] || 'Hata';
  }

  /**
   * Get error statistics
   */
  getErrorStats() {
    const categories = {};
    const severities = {};
    
    this.errorLog.forEach(error => {
      categories[error.category] = (categories[error.category] || 0) + 1;
      severities[error.severity] = (severities[error.severity] || 0) + 1;
    });
    
    return {
      total: this.errorLog.length,
      categories,
      severities,
      recent: this.errorLog.slice(0, 5)
    };
  }

  /**
   * Clear error log
   */
  clearLog() {
    this.errorLog = [];
  }
}

// Export singleton instance
export const errorService = new ErrorService();
export default errorService;
