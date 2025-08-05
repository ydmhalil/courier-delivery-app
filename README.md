# 🚚 Cargo Delivery Management System

Kurye teslimat yönetimi için geliştirilmiş kapsamlı bir mobil uygulama. AI destekli rota optimizasyonu, QR kod okuma ve gerçek zamanlı teslimat takibi özellikleri ile donatılmıştır.

## ✨ Özellikler

### 🔐 **Kimlik Doğrulama Sistemi**
- JWT tabanlı güvenli giriş/kayıt sistemi
- Kurye hesabı yönetimi ve profil düzenleme

### 📱 **Akıllı Dashboard**
- Günlük teslimat özeti ve istatistikler
- Hızlı erişim butonları ve durum kartları
- Teslimat durumu görselleştirme

### 📷 **QR Kod Tarayıcı**
- Anlık paket ekleme ve bilgi çıkarma
- Otomatik adres ve alıcı bilgisi tanıma
- Kargo ID ve teslimat tipi algılama

### 📦 **Paket Yönetimi**
- Manuel ve QR kod ile paket ekleme
- Teslimat durumu güncelleme (Hazır, Yolda, Teslim Edildi)
- Paket detayları ve geçmiş görüntüleme

### 🗺️ **Akıllı Rota Optimizasyonu**
- Google Cloud Route Optimization API entegrasyonu
- Mesafe ve zaman optimizasyonu
- Öncelik bazlı teslimat sıralaması

### 🎯 **Konum Servisleri**
- İstanbul adres veritabanı entegrasyonu
- Gerçek zamanlı harita görüntüleme
- GPS tabanlı konum takibi

### 🤖 **AI Chatbot Asistanı**
- Gemini AI ile doğal dil işleme
- Sesli komut desteği (Text-to-Speech)
- Akıllı teslimat yardımcısı

## 🏗️ Teknik Altyapı

### 📱 **Frontend (React Native + Expo)**
- **Framework**: React Native 0.74+ with Expo 51+
- **Navigation**: React Navigation 6 (Stack + Bottom Tabs)
- **State Management**: React Context API + AsyncStorage
- **UI Components**: Custom modern design system
- **Maps**: React Native Maps + Google Maps
- **QR Scanner**: Expo Camera + Barcode Scanner
- **Icons**: Ionicons 7.0+
- **Speech**: Expo Speech API

### ⚙️ **Backend (FastAPI + Python)**
- **Framework**: FastAPI 0.100+
- **Database**: SQLite (development) / PostgreSQL (production)
- **ORM**: SQLAlchemy 2.0+
- **Authentication**: JWT tokens with bcrypt
- **Route Optimization**: Google Cloud Route Optimization API
- **AI Integration**: Google Gemini API
- **Geocoding**: Google Maps Geocoding API
- **API Documentation**: FastAPI auto-generated OpenAPI/Swagger

## � Kurulum ve Çalıştırma

### ✅ **Gereksinimler**
- Node.js (v18+) 
- Python 3.11+
- Git
- Expo CLI
- Android Studio / Xcode (test için)

### 🔧 **Backend Kurulumu**

1. **Backend dizinine git**
   ```bash
   cd backend
   ```

2. **Python bağımlılıklarını yükle**
   ```bash
   pip install -r requirements.txt
   ```

3. **Environment dosyasını ayarla**
   ```bash
   # Backend için (.env dosyası zaten mevcut)
   cp .env.example .env  # Template'i kopyala
   # .env dosyasını düzenleyip API anahtarlarınızı ekleyin:
   # - GEMINI_API_KEY: Google Gemini AI anahtarı
   # - GOOGLE_CLOUD_PROJECT_ID: Google Cloud proje ID'si
   # - GOOGLE_APPLICATION_CREDENTIALS: Service account dosya yolu
   ```

4. **Veritabanını başlat**
   ```bash
   python main.py
   # Tablolar otomatik oluşturulur
   ```
   API: `http://localhost:8000`

### 📱 **Frontend Kurulumu**

1. **Frontend dizinine git**
   ```bash
   cd frontend-new
   ```

2. **Bağımlılıkları yükle**
   ```bash
   npm install
   ```

3. **Environment dosyasını ayarla**
   ```bash
   # Frontend için (.env.example'dan kopyala)
   cp .env.example .env
   # .env dosyasını düzenleyip API anahtarlarınızı ekleyin:
   # - EXPO_PUBLIC_API_BASE_URL: Backend sunucu adresi
   # - EXPO_PUBLIC_WEATHER_API_KEY: WeatherAPI anahtarı
   ```

4. **Geliştirme sunucusunu başlat**
   ```bash
   npm start
   # veya
   npx expo start
   ```

5. **Cihazda çalıştır**
   - Expo Go uygulamasını indirin
   - QR kodu tarayın veya 'a' (Android) / 'i' (iOS) basın

## 📡 API Endpoints

### 🔐 **Kimlik Doğrulama**
- `POST /auth/register` - Kurye kaydı
- `POST /auth/token` - Giriş (token al)

### 📦 **Paket Yönetimi** 
- `GET /packages/` - Tüm paketleri listele
- `POST /packages/` - Yeni paket ekle
- `POST /packages/qr` - QR kod ile paket ekle
- `PUT /packages/{id}` - Paket güncelle
- `PUT /packages/{id}/status` - Durum güncelle

### 🗺️ **Rota Optimizasyonu**
- `POST /routes/optimize` - Optimize rota hesapla
- `GET /routes/current` - Mevcut rotayı getir

### 🤖 **AI Chatbot**
- `POST /chatbot/ask` - AI asistanına sor
- `GET /chatbot/packages` - Paket durumu sor

## 📱 QR Kod Formatı

Sistemin tanıdığı QR kod formatı:

```json
{
  "kargo_id": "PKT123456",
  "alici": "Ahmet Yılmaz", 
  "adres": "İlkadım Mah. Atatürk Cad. No:15, Samsun",
  "telefon": "0555 123 45 67"
}
```

## 🗺️ Rota Optimizasyonu

### **Google Cloud Route Optimization**
- Mesafe ve süre optimizasyonu
- Gerçek trafik verileri
- 100+ paket kapasitesi
- Coğrafi kısıtlamalar desteği

### **Optimizasyon Kriterleri**
- En kısa mesafe rotası
- Trafik yoğunluğu hesaplaması  
- Teslimat öncelik sırası
- Zaman penceresi optimizasyonu

## 🎨 Kullanıcı Arayüzü

### **Renk Sistemi**
- **Hazır**: Mavi (#3B82F6) - Teslimat bekleyen
- **Yolda**: Turuncu (#F97316) - Teslimat yolunda  
- **Teslim Edildi**: Yeşil (#10B981) - Başarıyla teslim

### **Navigation**
- **Dashboard**: Ana ekran, günlük özet
- **Paketler**: Paket listesi ve yönetimi
- **QR Tarayıcı**: Kamera ile paket ekleme
- **Rotalar**: Optimize edilmiş teslimat rotaları
- **Chatbot**: AI asistan desteği

## 🧪 Test Verileri

### **Örnek QR Kodları**

```json
// Standart Teslimat
{
  "kargo_id": "PKT001",
  "alici": "Mehmet Demir",
  "adres": "Çarşı Mah. İstiklal Cad. No:25, İlkadım/Samsun", 
  "telefon": "0532 111 22 33"
}

// Express Teslimat  
{
  "kargo_id": "PKT002",
  "alici": "Ayşe Kaya",
  "adres": "Baruthane Mah. Gazi Cad. No:45, Canik/Samsun",
  "telefon": "0541 444 55 66"
}
```

### **Test Kullanıcısı**
```json
{
  "username": "test_kurye",
  "email": "test@kurye.com", 
  "password": "test123",
  "full_name": "Test Kuryesi"
}
```

## 📚 API Dokümantasyonu

Backend çalışırken şu adresleri ziyaret edin:
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

## 🔒 Güvenlik

- JWT tabanlı kimlik doğrulama
- Bcrypt ile şifre hashleme
- CORS yapılandırması
- **Environment variables ile API key yönetimi** ✅
- Hassas bilgilerin .gitignore ile korunması
- Production için güçlü secret key gerekliliği
- Rate limiting (gelecek sürüm)

### **Kullanılan API Servisleri:**
- **Google Gemini AI**: AI chatbot ve doğal dil işleme
- **WeatherAPI**: Hava durumu bilgileri
- **Google Cloud Route Optimization**: Rota optimizasyonu
- **Fastapi Backend**: RESTful API servisleri

## 🚀 Deployment

### **Backend**
```bash
# Production için environment variables ayarlayın
export JWT_SECRET_KEY="your-production-secret"
export DATABASE_URL="postgresql://..."
export GOOGLE_CLOUD_PROJECT_ID="your-project"

# Server'ı başlatın
uvicorn main:app --host 0.0.0.0 --port 8000
```

### **Frontend** 
```bash
# Production build
expo build:android
expo build:ios

# Web deployment
expo export:web
```

## 📂 Proje Yapısı

```
Cargo2/
├── backend/                 # FastAPI Backend
│   ├── models/             # Database modelleri
│   ├── routers/            # API endpoint'leri  
│   ├── services/           # İş mantığı servisleri
│   ├── schemas/            # Pydantic şemaları
│   └── main.py             # Ana uygulama
├── frontend-new/           # React Native Frontend
│   ├── src/
│   │   ├── screens/        # Uygulama ekranları
│   │   ├── components/     # Yeniden kullanılabilir bileşenler
│   │   ├── services/       # API servisleri
│   │   ├── navigation/     # Navigasyon yapısı
│   │   └── context/        # Context API
│   └── App.js              # Ana component
└── README.md               # Bu dosya
```

## 🤝 Katkıda Bulunma

1. Repository'yi fork edin
2. Feature branch oluşturun (`git checkout -b feature/yeni-ozellik`)
3. Değişikliklerinizi commit edin (`git commit -m 'Yeni özellik eklendi'`)
4. Branch'inizi push edin (`git push origin feature/yeni-ozellik`)
5. Pull Request oluşturun

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

## 📞 Destek

Destek için:
- API dokümantasyonunu kontrol edin
- Issue oluşturun
- Kod yorumlarını inceleyin

---

**❤️ ile geliştirildi - Verimli kurye teslimat yönetimi için**
