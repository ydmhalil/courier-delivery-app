import google.generativeai as genai
import json
from typing import Optional, Dict, Any
import logging
from config import settings

# Configure logging
logger = logging.getLogger(__name__)

class GeminiAIService:
    def __init__(self):
        """Initialize Gemini AI service with API key"""
        try:
            # Configure Gemini API
            genai.configure(api_key=settings.GEMINI_API_KEY)
            
            # Initialize the model
            self.model = genai.GenerativeModel('gemini-1.5-flash')
            
            # System prompt for a comprehensive courier assistant
            self.system_prompt = """
Sen akıllı, yardımsever ve çok yetenekli bir kurye asistanı AI'sın. Kurye işleriyle ilgili her türlü soruya cevap verebilir, genel yaşam sorularında da yardımcı olabilirsin.

ANA UZMANLIK ALANLARIN:
🚚 KURYE & TESLİMAT:
- Paket takibi, durumları ve yönetimi
- Teslimat rotaları, optimizasyonu ve navigasyon
- Müşteri iletişimi ve adres yönetimi
- Kargo operasyonları ve süreç yönetimi
- Performans analizi ve raporlama
- Hava durumu ve trafik etkilerinin değerlendirilmesi

💼 İŞ YÖNETİMİ:
- Çalışma saatleri ve planlama
- Araç ve ekipman yönetimi
- Güvenlik protokolleri
- Zaman yönetimi ve verimlilik
- Problem çözme ve acil durumlar

🌟 GENEL YARDIM:
- Genel sorular ve günlük yaşam
- Teknoloji kullanımı
- İletişim becerileri
- Motivasyon ve kişisel gelişim
- Pratik öneriler ve çözümler

PAKET DURUMLARI:
- "Bekleyen" (pending): Henüz alınmamış paketler
- "Yolda" (in_transit): Teslimat için yola çıkılmış paketler  
- "Teslim edilen" (delivered): Başarıyla teslim edilmiş paketler
- "Teslim edilmemiş": Bekleyen + Yolda paketlerin toplamı

YAKLAŞIMIN:
✅ Samimi, dostane ve yardımsever ol
✅ Praktik, uygulanabilir öneriler ver
✅ Mevcut verileri akıllıca kullan
✅ Net ve anlaşılır açıklamalar yap
✅ Sorun çözme odaklı düşün
✅ Kullanıcının zamanını değerli gör

❌ Sadece finans, tıbbi teşhis, hukuki tavsiye verme konularında dikkatli ol - bu alanlarda uzman olmadığını belirt ama yine de yardımcı olmaya çalış.

Yanıtların her zaman faydalı, pozitif ve çözüm odaklı olsun!
"""
            
            logger.info("Gemini AI service initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize Gemini AI service: {e}")
            raise

    def is_courier_related_query(self, query: str) -> bool:
        """Allow all queries - let AI decide what's appropriate"""
        # Sadece güvenlik açısından tehlikeli komutları engelle
        dangerous_patterns = [
            'delete', 'drop', 'truncate', 'update.*password', 'alter table',
            'sql injection', 'hack', 'exploit', '--', ';--'
        ]
        
        query_lower = query.lower()
        has_dangerous = any(pattern in query_lower for pattern in dangerous_patterns)
        
        if has_dangerous:
            return False
        
        # Diğer tüm sorular için True döndür
        return True

    async def generate_response(self, query: str, context_data: Optional[Dict[str, Any]] = None) -> str:
        """Generate response for courier-related queries"""
        try:
            # Check for dangerous queries only
            if not self.is_courier_related_query(query):
                return "Bu soruda güvenlik riski tespit ettim. Lütfen başka bir şekilde sorunuzu iletir misiniz?"
            
            # Prepare the prompt with context
            prompt = self.system_prompt + "\n\n"
            
            # Add context data if provided
            if context_data:
                try:
                    prompt += "MEVCUT VERİLER:\n"
                    
                    # Courier info
                    if context_data.get('courier_info'):
                        courier = context_data['courier_info']
                        prompt += f"Kurye: {courier.get('name', 'N/A')}\n"
                    
                    # Package statistics
                    if context_data.get('package_stats'):
                        stats = context_data['package_stats']
                        prompt += f"📦 Paket İstatistikleri:\n"
                        prompt += f"   Toplam: {stats.get('total', 0)}\n"
                        prompt += f"   Teslim edilmemiş: {stats.get('undelivered', 0)} (bekleyen + yolda)\n"
                        prompt += f"   Bekleyen: {stats.get('pending', 0)}\n"
                        prompt += f"   Yolda: {stats.get('in_transit', 0)}\n"
                        prompt += f"   Teslim edilen: {stats.get('delivered', 0)}\n"
                        prompt += f"   Başarısız: {stats.get('failed', 0)}\n"
                    
                    # Delivery areas
                    if context_data.get('delivery_areas'):
                        areas = context_data['delivery_areas']
                        if isinstance(areas, dict) and areas.get('districts'):
                            districts = areas['districts']
                            if isinstance(districts, dict):
                                prompt += f"🗺️ Teslimat İlçeleri: {', '.join(districts.keys())}\n"
                    
                    # Time analysis
                    if context_data.get('time_analysis'):
                        time_stats = context_data['time_analysis']
                        prompt += f"📅 Zaman Analizi:\n"
                        prompt += f"   Bugün: {time_stats.get('today_count', 0)} paket\n"
                        prompt += f"   Bu hafta: {time_stats.get('this_week_count', 0)} paket\n"
                    
                    # Weather info
                    if context_data.get('weather_info'):
                        prompt += f"🌤️ Hava Durumu:\n{context_data['weather_info']}\n"
                    
                    # Search results
                    if context_data.get('search_results'):
                        results = context_data['search_results']
                        if isinstance(results, list):
                            prompt += f"🔍 Arama Sonuçları: {len(results)} paket bulundu\n"
                    
                    # Area-specific packages
                    for key, value in context_data.items():
                        if key.endswith('_packages') and key != 'packages':
                            area_name = key.replace('_packages', '')
                            try:
                                if isinstance(value, list):
                                    prompt += f"📍 {area_name.capitalize()}: {len(value)} paket\n"
                                elif isinstance(value, (int, str)):
                                    prompt += f"📍 {area_name.capitalize()}: {value} paket\n"
                            except Exception as area_e:
                                logger.error(f"Error processing area {area_name}: {area_e}, value type: {type(value)}")
                    
                    # Full package data available
                    if context_data.get('packages'):
                        packages = context_data['packages']
                        if isinstance(packages, list):
                            prompt += f"💾 Detaylı paket bilgileri mevcut (adresler, müşteriler, durumlar)\n"
                        
                    prompt += "\n"
                    
                except Exception as context_e:
                    logger.error(f"Error processing context data: {context_e}")
                    prompt += "VERİ İŞLEME HATASI\n\n"
            
            prompt += f"KULLANICI SORUSU: {query}\n\nYANIT:"
            
            # Generate response
            response = self.model.generate_content(prompt)
            
            if response and response.text:
                return response.text.strip()
            else:
                return "Üzgünüm, şu anda bir yanıt oluşturamıyorum. Lütfen daha sonra tekrar deneyin."
                
        except Exception as e:
            logger.error(f"Error generating Gemini response: {e}")
            return "Üzgünüm, teknik bir sorun oluştu. Lütfen daha sonra tekrar deneyin."

    def format_package_context(self, packages: list) -> Dict[str, Any]:
        """Format package data for context"""
        if not packages:
            return {}
            
        # Paket durumlarını kategorize et
        pending_packages = [p for p in packages if p.get('status') == 'pending']
        in_transit_packages = [p for p in packages if p.get('status') == 'in_transit']
        delivered_packages = [p for p in packages if p.get('status') == 'delivered']
        
        # Teslim edilmemiş = pending + in_transit
        undelivered_packages = pending_packages + in_transit_packages
        
        context = {
            'packages': packages,
            'total_packages': len(packages),
            'pending_packages': len(pending_packages),
            'in_transit_packages': len(in_transit_packages),
            'delivered_packages': len(delivered_packages),
            'undelivered_packages': len(undelivered_packages),  # Yeni alan
            'undelivered_count': len(undelivered_packages)      # Alternatif isim
        }
        
        # Group by area/district
        areas = {}
        for package in packages:
            if package.get('customer_address'):
                # Simple area extraction (can be improved)
                area = package['customer_address'].split(',')[-2].strip() if ',' in package['customer_address'] else 'Bilinmiyor'
                areas[area] = areas.get(area, 0) + 1
        
        context['packages_by_area'] = areas
        
        return context

# Global instance
gemini_service = GeminiAIService()
