import requests
import logging
from typing import Dict, List, Optional
from collections import Counter

logger = logging.getLogger(__name__)

class WeatherService:
    """Simple weather service for delivery areas"""
    
    def __init__(self):
        # Free weather API (OpenWeatherMap'in ücretsiz versiyonu)
        # Gerçek kullanımda API key gerekir
        self.api_key = "demo_key"  # Gerçek API key eklenecek
        self.base_url = "http://api.openweathermap.org/data/2.5/weather"
    
    def get_weather_for_areas(self, areas: List[str]) -> Dict[str, str]:
        """Get weather summary for delivery areas"""
        try:
            # İstanbul'un farklı bölgeleri için gerçekçi hava durumu simülasyonu
            weather_data = {}
            
            for area in areas:
                area_lower = area.lower()
                
                # Avrupa yakası
                if any(keyword in area_lower for keyword in ['beşiktaş', 'şişli', 'beyoğlu', 'taksim']):
                    weather_data[area] = "Parçalı bulutlu, 22°C, hafif rüzgar"
                # Anadolu yakası kuzey
                elif any(keyword in area_lower for keyword in ['kadıköy', 'üsküdar', 'ataşehir']):
                    weather_data[area] = "Açık, 24°C, sakin"
                # Anadolu yakası güney  
                elif any(keyword in area_lower for keyword in ['maltepe', 'kartal', 'pendik']):
                    weather_data[area] = "Güneşli, 25°C, hafif esinti"
                # Avrupa yakası güney
                elif any(keyword in area_lower for keyword in ['bakırköy', 'bahçelievler', 'florya']):
                    weather_data[area] = "Hafif bulutlu, 21°C, deniz etkisi"
                # Avrupa yakası batı
                elif any(keyword in area_lower for keyword in ['bağcılar', 'güngören', 'esenler']):
                    weather_data[area] = "Kapalı, 20°C, nemli"
                else:
                    weather_data[area] = "İyi hava koşulları, 23°C"
            
            return weather_data
            
        except Exception as e:
            logger.error(f"Error getting weather data: {e}")
            return {}
    
    async def get_weather_summary(self, packages: List[Dict]) -> str:
        """Get weather summary for all delivery areas"""
        try:
            if not packages:
                return "Teslimat bölgesi bilgisi bulunmuyor."
            
            # Extract areas from package addresses
            areas = []
            for package in packages:
                if package.get('customer_address'):
                    # Simple area extraction
                    address = package['customer_address']
                    if ',' in address:
                        area = address.split(',')[-2].strip()
                        areas.append(area)
            
            if not areas:
                return "Adres bilgisi eksik."
            
            # Count most common areas
            area_counts = Counter(areas)
            most_common_areas = area_counts.most_common(3)
            
            weather_data = self.get_weather_for_areas([area for area, _ in most_common_areas])
            
            # Create summary
            summary = "📍 Teslimat bölgelerinizde hava durumu:\n\n"
            
            for area, count in most_common_areas:
                weather = weather_data.get(area, "Bilgi alınamadı")
                summary += f"• {area} ({count} paket): {weather}\n"
            
            summary += f"\n🏃‍♂️ Toplam {len(packages)} paket için {len(set(areas))} farklı bölgeye teslimat yapacaksınız."
            
            # Add weather-based advice
            if any("rüzgar" in w.lower() for w in weather_data.values()):
                summary += "\n\n💨 Rüzgarlı bölgeler var, hafif paketlere dikkat edin."
            
            return summary
            
        except Exception as e:
            logger.error(f"Error creating weather summary: {e}")
            return "Hava durumu bilgisi alınamadı."

# Global instance
weather_service = WeatherService()
