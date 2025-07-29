// QR Kod Format Örnekleri
// Enhanced QR Code Format with Coordinates

// 1. Koordinatlı QR Kod (Önerilen Format)
const qrCodeWithCoordinates = {
  "kargo_id": "KRG-2025-001",
  "alici": "Mehmet Demir",
  "adres": "Atatürk Cad. No:15, Çankaya, Ankara",
  "telefon": "+90 532 123 4567",
  "teslimat_turu": "express",
  "zaman_penceresi": ["09:00", "17:00"],
  // Koordinat verileri (Öncelikli)
  "latitude": 39.9208,
  "longitude": 32.8541
};

// 2. Alternatif Koordinat Formatı
const qrCodeWithCoordinatesObject = {
  "kargo_id": "KRG-2025-002",
  "alici": "Ayşe Yılmaz",
  "adres": "İstiklal Cad. No:25, Beyoğlu, İstanbul",
  "telefon": "+90 533 987 6543",
  "teslimat_turu": "standard",
  "koordinatlar": {
    "latitude": 41.0369,
    "longitude": 28.9850
  }
};

// 3. Koordinatsız QR Kod (Eski Format - Geocoding Gerekli)
const qrCodeWithoutCoordinates = {
  "kargo_id": "KRG-2025-003",
  "alici": "Fatma Kaya",
  "adres": "Cumhuriyet Cad. No:35, Konak, İzmir",
  "telefon": "+90 534 555 1234",
  "teslimat_turu": "standard"
  // Koordinat yok - Backend geocoding yapacak
};

// QR Kod Oluşturmak İçin JSON String'e Çevir
console.log("Koordinatlı QR Kod:");
console.log(JSON.stringify(qrCodeWithCoordinates));

console.log("\nAlternatif Format QR Kod:");
console.log(JSON.stringify(qrCodeWithCoordinatesObject));

console.log("\nKoordinatsız QR Kod (Geocoding gerekli):");
console.log(JSON.stringify(qrCodeWithoutCoordinates));

// Backend'de İşleme Logiki:
// 1. QR'da latitude/longitude varsa direkt kullan
// 2. QR'da koordinatlar object'i varsa onu kullan  
// 3. Hiçbiri yoksa adres metnini geocode et
// 4. Geocoding başarısızsa koordinat null olarak kaydet

export {
  qrCodeWithCoordinates,
  qrCodeWithCoordinatesObject,
  qrCodeWithoutCoordinates
};
