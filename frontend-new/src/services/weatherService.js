import configService from './configService';

class WeatherService {
  constructor() {
    // WeatherAPI (ücretsiz 1M istek/ay)
    // Environment variable'dan al
    this.API_KEY = configService.get('weatherApiKey') || process.env.EXPO_PUBLIC_WEATHER_API_KEY || '06a204ac91b24e57ae8120713250408';
    this.BASE_URL = configService.get('weatherApiUrl') || process.env.EXPO_PUBLIC_WEATHER_API_URL || 'http://api.weatherapi.com/v1/current.json';
    
    console.log('🌤️ Weather Service initialized with API key from env variables');
  }

  // Hava durumu verilerini al (koordinatlara göre)
  async getWeatherByCoordinates(lat, lon) {
    try {
      const response = await fetch(
        `${this.BASE_URL}?key=${this.API_KEY}&q=${lat},${lon}&lang=tr`
      );
      
      if (!response.ok) {
        throw new Error('Hava durumu verisi alınamadı');
      }
      
      const data = await response.json();
      return this.formatWeatherData(data);
    } catch (error) {
      console.error('Weather service error:', error);
      return this.getDefaultWeather();
    }
  }

  // Şehir adına göre hava durumu al
  async getWeatherByCity(cityName) {
    try {
      const response = await fetch(
        `${this.BASE_URL}?key=${this.API_KEY}&q=${cityName}&lang=tr`
      );
      
      if (!response.ok) {
        throw new Error('Hava durumu verisi alınamadı');
      }
      
      const data = await response.json();
      return this.formatWeatherData(data);
    } catch (error) {
      console.error('Weather service error:', error);
      return this.getDefaultWeather();
    }
  }

  // İstanbul varsayılan konumu için hava durumu
  async getIstanbulWeather() {
    // API key yoksa varsayılan hava durumu döndür
    if (this.API_KEY === 'BURAYA_KENDI_API_KEYINIZI_YAZIN') {
      console.log('🌤️ API key bulunamadı, varsayılan hava durumu gösteriliyor');
      return this.getDefaultWeather();
    }
    
    // İstanbul için hava durumu
    return this.getWeatherByCity('Istanbul');
  }

  // Kullanıcının depo konumu için hava durumu
  async getDepotWeather(depotAddress = null, depotCity = null) {
    try {
      // API key yoksa varsayılan hava durumu döndür
      if (this.API_KEY === 'BURAYA_KENDI_API_KEYINIZI_YAZIN') {
        console.log('🌤️ API key bulunamadı, varsayılan hava durumu gösteriliyor');
        return this.getDefaultWeather();
      }

      // Depo şehri varsa onu temizle ve kullan
      if (depotCity) {
        const cleanCity = this.cleanCityName(depotCity);
        console.log('🌤️ Depo şehri için hava durumu alınıyor:', cleanCity);
        return this.getWeatherByCity(cleanCity);
      }

      // Depo adresi varsa onu kullan
      if (depotAddress) {
        console.log('🌤️ Depo adresi için hava durumu alınıyor:', depotAddress);
        return this.getWeatherByCity(depotAddress);
      }

      // Hiçbiri yoksa İstanbul varsayılan
      console.log('🌤️ Depo bilgisi bulunamadı, İstanbul hava durumu gösteriliyor');
      return this.getWeatherByCity('Istanbul');
      
    } catch (error) {
      console.error('Depot weather service error:', error);
      return this.getDefaultWeather();
    }
  }

  // Şehir adını temizle ve standartlaştır
  cleanCityName(cityName) {
    if (!cityName) return 'Istanbul';
    
    // Şehir adını temizle
    let cleanName = cityName.trim();
    
    // Türkçe karakterleri İngilizce'ye çevir
    const charMap = {
      'ç': 'c', 'Ç': 'C',
      'ğ': 'g', 'Ğ': 'G', 
      'ı': 'i', 'I': 'I',
      'İ': 'I', 'i': 'i',
      'ö': 'o', 'Ö': 'O',
      'ş': 's', 'Ş': 'S',
      'ü': 'u', 'Ü': 'U'
    };
    
    // Karakter değişimi
    for (const [turkish, english] of Object.entries(charMap)) {
      cleanName = cleanName.replace(new RegExp(turkish, 'g'), english);
    }
    
    // Özel şehir isimleri mapping
    const cityMap = {
      'istanbul': 'Istanbul',
      'İstanbul': 'Istanbul', 
      'ISTANBUL': 'Istanbul',
      'ankara': 'Ankara',
      'Ankara': 'Ankara',
      'izmir': 'Izmir',
      'İzmir': 'Izmir',
      'bursa': 'Bursa',
      'antalya': 'Antalya',
      'adana': 'Adana',
      'gaziantep': 'Gaziantep',
      'konya': 'Konya'
    };
    
    // Map'te varsa kullan
    const lowerName = cleanName.toLowerCase();
    if (cityMap[lowerName]) {
      return cityMap[lowerName];
    }
    
    // İlk harfi büyük yap
    return cleanName.charAt(0).toUpperCase() + cleanName.slice(1).toLowerCase();
  }

  // Hava durumu verisini formatla (WeatherAPI format)
  formatWeatherData(data) {
    const current = data.current;
    const location = data.location;
    
    return {
      temperature: Math.round(current.temp_c),
      description: current.condition.text,
      icon: this.getWeatherIcon(current.condition.code, current.is_day),
      humidity: current.humidity,
      windSpeed: Math.round(current.wind_kph / 3.6), // km/h -> m/s
      city: location.name,
      country: location.country,
      feelsLike: Math.round(current.feelslike_c),
      condition: this.getConditionFromCode(current.condition.code)
    };
  }

  // WeatherAPI condition code'una göre condition belirle
  getConditionFromCode(code) {
    const conditionMap = {
      1000: 'Clear',        // Sunny/Clear
      1003: 'Clouds',       // Partly cloudy
      1006: 'Clouds',       // Cloudy
      1009: 'Clouds',       // Overcast
      1030: 'Mist',         // Mist
      1063: 'Rain',         // Patchy rain possible
      1066: 'Snow',         // Patchy snow possible
      1069: 'Rain',         // Patchy sleet possible
      1072: 'Rain',         // Patchy freezing drizzle possible
      1087: 'Thunderstorm', // Thundery outbreaks possible
      1114: 'Snow',         // Blowing snow
      1117: 'Snow',         // Blizzard
      1135: 'Fog',          // Fog
      1147: 'Fog',          // Freezing fog
      1150: 'Drizzle',      // Patchy light drizzle
      1153: 'Drizzle',      // Light drizzle
      1168: 'Drizzle',      // Freezing drizzle
      1171: 'Drizzle',      // Heavy freezing drizzle
      1180: 'Rain',         // Patchy light rain
      1183: 'Rain',         // Light rain
      1186: 'Rain',         // Moderate rain at times
      1189: 'Rain',         // Moderate rain
      1192: 'Rain',         // Heavy rain at times
      1195: 'Rain',         // Heavy rain
      1198: 'Rain',         // Light freezing rain
      1201: 'Rain',         // Moderate or heavy freezing rain
      1204: 'Rain',         // Light sleet
      1207: 'Rain',         // Moderate or heavy sleet
      1210: 'Snow',         // Patchy light snow
      1213: 'Snow',         // Light snow
      1216: 'Snow',         // Patchy moderate snow
      1219: 'Snow',         // Moderate snow
      1222: 'Snow',         // Patchy heavy snow
      1225: 'Snow',         // Heavy snow
      1237: 'Snow',         // Ice pellets
      1240: 'Rain',         // Light rain shower
      1243: 'Rain',         // Moderate or heavy rain shower
      1246: 'Rain',         // Torrential rain shower
      1249: 'Rain',         // Light sleet showers
      1252: 'Rain',         // Moderate or heavy sleet showers
      1255: 'Snow',         // Light snow showers
      1258: 'Snow',         // Moderate or heavy snow showers
      1261: 'Snow',         // Light showers of ice pellets
      1264: 'Snow',         // Moderate or heavy showers of ice pellets
      1273: 'Thunderstorm', // Patchy light rain with thunder
      1276: 'Thunderstorm', // Moderate or heavy rain with thunder
      1279: 'Thunderstorm', // Patchy light snow with thunder
      1282: 'Thunderstorm'  // Moderate or heavy snow with thunder
    };
    
    return conditionMap[code] || 'Clear';
  }

  // Hava durumu ikonunu belirle (WeatherAPI condition code + gündüz/gece)
  getWeatherIcon(conditionCode, isDay) {
    const iconMap = {
      // Açık hava
      1000: isDay ? 'sunny' : 'moon',
      // Parçalı bulutlu
      1003: isDay ? 'partly-sunny' : 'cloudy-night', 
      // Bulutlu
      1006: 'cloud',
      1009: 'cloudy',
      // Sisli/Puslu
      1030: 'cloudy',
      1135: 'cloudy',
      1147: 'cloudy',
      // Yağmur ihtimali
      1063: 'rainy',
      1150: 'rainy',
      1153: 'rainy',
      1168: 'rainy',
      1171: 'rainy',
      1180: 'rainy',
      1183: 'rainy',
      1186: 'rainy',
      1189: 'rainy',
      1192: 'rainy',
      1195: 'rainy',
      1198: 'rainy',
      1201: 'rainy',
      1204: 'rainy',
      1207: 'rainy',
      1240: 'rainy',
      1243: 'rainy',
      1246: 'rainy',
      1249: 'rainy',
      1252: 'rainy',
      // Kar
      1066: 'snow',
      1069: 'snow',
      1114: 'snow',
      1117: 'snow',
      1210: 'snow',
      1213: 'snow',
      1216: 'snow',
      1219: 'snow',
      1222: 'snow',
      1225: 'snow',
      1237: 'snow',
      1255: 'snow',
      1258: 'snow',
      1261: 'snow',
      1264: 'snow',
      // Fırtına
      1072: 'thunderstorm',
      1087: 'thunderstorm',
      1273: 'thunderstorm',
      1276: 'thunderstorm',
      1279: 'thunderstorm',
      1282: 'thunderstorm'
    };

    return iconMap[conditionCode] || (isDay ? 'sunny' : 'moon');
  }

  // Varsayılan hava durumu (API başarısız olduğunda)
  getDefaultWeather() {
    return {
      temperature: 22,
      description: 'açık',
      icon: 'sunny',
      humidity: 60,
      windSpeed: 5,
      city: 'İstanbul',
      country: 'TR',
      feelsLike: 24,
      condition: 'Clear'
    };
  }

  // Hava durumu rengini belirle
  getWeatherColor(condition) {
    const colorMap = {
      'Clear': '#FFD700',      // Altın sarısı
      'Clouds': '#87CEEB',     // Açık mavi
      'Rain': '#4682B4',       // Çelik mavisi
      'Drizzle': '#6495ED',    // Mısır çiçeği mavisi
      'Thunderstorm': '#2F4F4F', // Koyu gri
      'Snow': '#F0F8FF',       // Alice mavisi
      'Mist': '#D3D3D3',       // Açık gri
      'Fog': '#D3D3D3',
      'Haze': '#D3D3D3'
    };
    
    return colorMap[condition] || '#87CEEB';
  }
}

export const weatherService = new WeatherService();
