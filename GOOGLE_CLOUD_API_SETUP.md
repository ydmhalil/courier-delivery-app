# 🚀 Google Cloud API Key Kurulum Rehberi

## 1️⃣ GOOGLE CLOUD HESABI OLUŞTUR

### Adım 1: Hesap Açma
1. Git: https://cloud.google.com/
2. "Get started for free" butonuna tıkla
3. Gmail hesabınla giriş yap
4. **Kredi kartı bilgisi iste** (ama $300 kredi bitene kadar ücret yok)

### Adım 2: Proje Oluştur
1. Google Cloud Console'a git: https://console.cloud.google.com/
2. "New Project" tıkla
3. Proje adı: "courier-delivery-routes" 
4. **Project ID'yi not al** (örnek: courier-delivery-routes-123456)

## 2️⃣ ROUTE OPTIMIZATION API AKTIF ET

### Cloud Console'da:
1. "APIs & Services" > "Library"
2. "Route Optimization API" ara
3. **"ENABLE" butonuna tıkla**

### Ya da terminal'de:
```bash
gcloud services enable routeoptimization.googleapis.com --project=PROJE-ID-BURAYA
```

## 3️⃣ SERVICE ACCOUNT VE API KEY OLUŞTUR

### Cloud Console'da (Kolay Yol):
1. "APIs & Services" > "Credentials"
2. "Create Credentials" > "Service Account"
3. Service account adı: "route-optimizer"
4. Role: "Cloud Optimization AI Editor" 
5. "Create and continue"
6. "Done" tıkla
7. Oluşan service account'a tıkla
8. "Keys" tab > "Add Key" > "Create new key"
9. JSON formatı seç
10. **key.json dosyası indirilecek**

### Terminal'de (İleri Seviye):
```bash
# Proje ID'nizi ayarlayın
export PROJECT_ID="courier-delivery-routes-123456"

# Service account oluştur
gcloud iam service-accounts create route-optimizer \
  --display-name="Route Optimizer Service" \
  --project=$PROJECT_ID

# Gerekli izinleri ver
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:route-optimizer@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/cloudoptimization.editor"

# JSON key dosyası oluştur
gcloud iam service-accounts keys create key.json \
  --iam-account=route-optimizer@$PROJECT_ID.iam.gserviceaccount.com
```

## 4️⃣ BACKEND'E API KEY EKLE

### key.json dosyasını güvenli yere koy:
```
C:\Users\PC\Desktop\Cargo2\backend\google-cloud-key.json
```

### .env dosyasını güncelle:
```env
# Google Cloud Configuration
GOOGLE_CLOUD_PROJECT_ID=courier-delivery-routes-123456
GOOGLE_APPLICATION_CREDENTIALS=C:\Users\PC\Desktop\Cargo2\backend\google-cloud-key.json
```

## 5️⃣ TEST ET

### Backend'i başlat:
```bash
cd backend
python main.py
```

### Status kontrol et:
```bash
curl http://localhost:8000/api/routes/optimizer/status
```

### Beklenen sonuç:
```json
{
  "message": "Google Cloud Route Optimizer Status",
  "status": "Ready",
  "api_available": true,
  "project_id": "courier-delivery-routes-123456"
}
```

## 💡 ÖNEMLİ NOTLAR

### Güvenlik:
- ❌ key.json dosyasını GitHub'a push etme
- ✅ .gitignore'a ekle: `*.json`
- ✅ Sadece production sunucuda kullan

### Maliyet Kontrolü:
- 📊 Google Cloud Console'da kullanımı takip et
- 🚨 Billing alerts kur ($10, $50 limitler)
- 💰 $300 kredi bitince otomatik durur

### Test Ortamı:
- ✅ Development için $300 kredi yeterli
- ✅ Günde 100+ route test edebilirsin
- ✅ Kredi bitmeden ücret kesintisi yok
