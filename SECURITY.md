# 🔐 API Keys Güvenlik Rehberi

## ⚠️ ÖNEMLİ GÜVENLİK UYARISI

Bu proje API key'leri environment variables ile yönetir. **Gerçek API key'lerinizi ASLA GitHub'a commit etmeyin!**

## 📁 Dosya Yapısı

### ✅ GitHub'a Commit Edilenler:
- `.env.example` - Template dosyaları (güvenli)
- `.gitignore` - .env dosyalarını ignore eder
- `config.py` - Environment variable okuyucu

### ❌ GitHub'a Commit EDİLMEYENLER:
- `.env` - Geliştirme key'leri 
- `.env.local` - Gerçek API key'leri
- `.env.production` - Production key'leri
- `*.json` - Service account dosyaları

## 🛠️ Kurulum Adımları

### 1. Repository'i Clone Ettikten Sonra:

```bash
# Backend için
cd backend
cp .env.example .env
# .env dosyasını düzenleyip gerçek key'leri ekleyin

# Frontend için  
cd frontend-new
cp .env.example .env
# .env dosyasını düzenleyip gerçek key'leri ekleyin
```

### 2. Gerçek API Key'leri Ekleyin:

**Backend (.env):**
```bash
GEMINI_API_KEY=your_real_gemini_key_here
GOOGLE_CLOUD_PROJECT_ID=your_project_id
GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account.json
```

**Frontend (.env):**
```bash
EXPO_PUBLIC_WEATHER_API_KEY=your_weather_api_key_here
EXPO_PUBLIC_API_BASE_URL=http://your-backend-url:8000
```

## 🔄 Mevcut Proje İçin:

Eğer bu projeyi çalıştırmak istiyorsanız:

1. `.env.local` dosyalarından gerçek key'leri kopyalayın
2. `.env` dosyalarına yapıştırın  
3. Service account JSON dosyasını doğru yola yerleştirin

## 🚨 API Key'leri Nerede Bulabilirsiniz:

- **Gemini AI**: https://makersuite.google.com/app/apikey
- **WeatherAPI**: https://www.weatherapi.com/ (ücretsiz)
- **Google Cloud**: https://console.cloud.google.com/

## ✅ Güvenlik Kontrolü:

```bash
# Bu komut .env dosyalarının git'te tracked olmadığını kontrol eder
git ls-files | grep -E "\.env$|\.env\."
# Boş sonuç dönerse güvenlisiniz!
```

## 🆘 Acil Durum:

Eğer yanlışlıkla API key'inizi GitHub'a push ettiyseniz:

1. Hemen API key'i revoke edin/yenileyin
2. `.env` dosyasını git'ten kaldırın: `git rm --cached .env`
3. `.gitignore`'a ekleyin
4. Yeni commit yapın ve push edin

---

**Unutmayın: Güvenlik her şeyden önemlidir! 🔒**
