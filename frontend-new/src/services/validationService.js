/**
 * Input Validation Service
 * Comprehensive validation for user inputs and data
 */
class ValidationService {
  
  /**
   * Validate QR code data structure and content
   */
  validateQRData(qrString) {
    try {
      // Basic string validation
      if (!qrString || typeof qrString !== 'string') {
        throw new Error('QR kod verisi geçersiz');
      }
      
      // Parse JSON
      let qrData;
      try {
        qrData = JSON.parse(qrString);
      } catch (parseError) {
        throw new Error('QR kod formatı geçersiz (JSON hatası)');
      }
      
      // Required fields validation
      const requiredFields = ['kargo_id', 'alici', 'adres'];
      const missingFields = requiredFields.filter(field => !qrData[field]);
      
      if (missingFields.length > 0) {
        throw new Error(`Eksik bilgiler: ${missingFields.join(', ')}`);
      }
      
      // Field content validation
      this.validateCargoId(qrData.kargo_id);
      this.validateRecipientName(qrData.alici);
      this.validateAddress(qrData.adres);
      
      // Optional field validation
      if (qrData.telefon && !this.isValidPhone(qrData.telefon)) {
        throw new Error('Telefon numarası geçersiz');
      }
      
      if (qrData.latitude && !this.isValidLatitude(qrData.latitude)) {
        throw new Error('Enlem değeri geçersiz');
      }
      
      if (qrData.longitude && !this.isValidLongitude(qrData.longitude)) {
        throw new Error('Boylam değeri geçersiz');
      }
      
      return {
        isValid: true,
        data: this.sanitizeQRData(qrData),
        warnings: this.getQRWarnings(qrData)
      };
      
    } catch (error) {
      return {
        isValid: false,
        error: error.message,
        data: null
      };
    }
  }

  /**
   * Validate cargo ID format
   */
  validateCargoId(cargoId) {
    if (!cargoId || cargoId.length < 3) {
      throw new Error('Kargo ID çok kısa');
    }
    
    if (cargoId.length > 50) {
      throw new Error('Kargo ID çok uzun');
    }
    
    // Basic pattern check (letters, numbers, hyphens)
    if (!/^[A-Za-z0-9-_]+$/.test(cargoId)) {
      throw new Error('Kargo ID geçersiz karakterler içeriyor');
    }
    
    return true;
  }

  /**
   * Validate recipient name
   */
  validateRecipientName(name) {
    if (!name || name.trim().length < 2) {
      throw new Error('Alıcı adı çok kısa');
    }
    
    if (name.length > 100) {
      throw new Error('Alıcı adı çok uzun');
    }
    
    // Check for suspicious patterns
    if (/[<>{}[\]\\]/.test(name)) {
      throw new Error('Alıcı adı geçersiz karakterler içeriyor');
    }
    
    return true;
  }

  /**
   * Validate address
   */
  validateAddress(address) {
    if (!address || address.trim().length < 5) {
      throw new Error('Adres çok kısa');
    }
    
    if (address.length > 500) {
      throw new Error('Adres çok uzun');
    }
    
    return true;
  }

  /**
   * Validate phone number (Turkish format)
   */
  isValidPhone(phone) {
    if (!phone) return true; // Optional field
    
    // Remove spaces and special characters
    const cleaned = phone.replace(/[\s\-\(\)]/g, '');
    
    // Turkish mobile patterns
    const patterns = [
      /^\+90[0-9]{10}$/, // +90XXXXXXXXXX
      /^90[0-9]{10}$/, // 90XXXXXXXXXX
      /^0[0-9]{10}$/, // 0XXXXXXXXXX
      /^[0-9]{10}$/ // XXXXXXXXXX
    ];
    
    return patterns.some(pattern => pattern.test(cleaned));
  }

  /**
   * Validate latitude
   */
  isValidLatitude(lat) {
    const num = parseFloat(lat);
    return !isNaN(num) && num >= -90 && num <= 90;
  }

  /**
   * Validate longitude
   */
  isValidLongitude(lng) {
    const num = parseFloat(lng);
    return !isNaN(num) && num >= -180 && num <= 180;
  }

  /**
   * Sanitize QR data (remove dangerous content)
   */
  sanitizeQRData(qrData) {
    const sanitized = { ...qrData };
    
    // Sanitize string fields
    ['kargo_id', 'alici', 'adres', 'telefon'].forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = this.sanitizeString(sanitized[field]);
      }
    });
    
    // Convert coordinates to numbers
    if (sanitized.latitude) {
      sanitized.latitude = parseFloat(sanitized.latitude);
    }
    if (sanitized.longitude) {
      sanitized.longitude = parseFloat(sanitized.longitude);
    }
    
    return sanitized;
  }

  /**
   * Sanitize string input
   */
  sanitizeString(str) {
    if (typeof str !== 'string') return str;
    
    return str
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML
      .replace(/\\/g, '') // Remove backslashes
      .substring(0, 500); // Limit length
  }

  /**
   * Get validation warnings for QR data
   */
  getQRWarnings(qrData) {
    const warnings = [];
    
    if (!qrData.telefon) {
      warnings.push('Telefon numarası eksik');
    }
    
    if (!qrData.latitude || !qrData.longitude) {
      warnings.push('Koordinat bilgisi eksik (geocoding gerekebilir)');
    }
    
    if (!qrData.teslimat_turu) {
      warnings.push('Teslimat türü belirtilmemiş');
    }
    
    return warnings;
  }

  /**
   * Validate package creation data
   */
  validatePackageData(packageData) {
    const errors = [];
    
    if (!packageData.kargo_id) {
      errors.push('Kargo ID gerekli');
    }
    
    if (!packageData.recipient_name) {
      errors.push('Alıcı adı gerekli');
    }
    
    if (!packageData.address) {
      errors.push('Adres gerekli');
    }
    
    if (packageData.phone && !this.isValidPhone(packageData.phone)) {
      errors.push('Geçersiz telefon numarası');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate coordinate data
   */
  validateCoordinates(lat, lng) {
    const errors = [];
    
    if (!this.isValidLatitude(lat)) {
      errors.push('Geçersiz enlem değeri');
    }
    
    if (!this.isValidLongitude(lng)) {
      errors.push('Geçersiz boylam değeri');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// Export singleton instance
export const validationService = new ValidationService();
export default validationService;
