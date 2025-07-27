#!/usr/bin/env python3
"""
Extended Test Data Generator - 50 Diverse Packages
For comprehensive algorithm testing with real Istanbul locations
"""

import sqlite3
from datetime import datetime, timedelta
import random

def create_extended_test_data():
    """Create 50 diverse packages across Istanbul for comprehensive testing"""
    
    # Connect to database
    conn = sqlite3.connect('courier.db')
    cursor = conn.cursor()
    
    # Clear existing packages (keep user data)
    cursor.execute("DELETE FROM packages")
    print("🗑️ Cleared existing package data")
    
    # Extended Istanbul locations with real coordinates
    locations = [
        # KADIKOY DISTRICT (Close to depot)
        {"name": "Fenerbahçe Mahallesi", "lat": 40.9877, "lon": 29.0283, "address": "Bağdat Caddesi No:45"},
        {"name": "Göztepe Mahallesi", "lat": 40.9755, "lon": 29.0348, "address": "Bağdat Caddesi No:234"},
        {"name": "Kozyatağı Mahallesi", "lat": 40.9742, "lon": 29.0865, "address": "Özgürlük Caddesi No:78"},
        {"name": "Moda Mahallesi", "lat": 40.9877, "lon": 29.0249, "address": "Moda Caddesi No:67"},
        {"name": "Caddebostan Mahallesi", "lat": 40.9764, "lon": 29.0405, "address": "Bağdat Caddesi No:156"},
        {"name": "Erenköy Mahallesi", "lat": 40.9703, "lon": 29.0437, "address": "Bağdat Caddesi No:289"},
        {"name": "Suadiye Mahallesi", "lat": 40.9634, "lon": 29.0513, "address": "Bağdat Caddesi No:345"},
        {"name": "Bostancı Mahallesi", "lat": 40.9551, "lon": 29.0621, "address": "Bağdat Caddesi No:412"},
        {"name": "Acıbadem Mahallesi", "lat": 40.9883, "lon": 29.0394, "address": "Acıbadem Caddesi No:89"},
        {"name": "Fikirtepe Mahallesi", "lat": 40.9987, "lon": 29.0519, "address": "Fahrettin Kerim Gökay Caddesi No:123"},
        
        # USKUDAR DISTRICT (Medium distance)
        {"name": "Üsküdar Merkez", "lat": 41.0226, "lon": 29.0090, "address": "Hakimiyeti Milliye Caddesi No:15"},
        {"name": "Altunizade Mahallesi", "lat": 41.0156, "lon": 29.0267, "address": "Nuh Kuyusu Caddesi No:42"},
        {"name": "Bulgurlu Mahallesi", "lat": 41.0345, "lon": 29.0456, "address": "Bulgurlu Caddesi No:78"},
        {"name": "Çengelköy Mahallesi", "lat": 41.0434, "lon": 29.0789, "address": "Çengelköy İskele Caddesi No:23"},
        {"name": "Beylerbeyi Mahallesi", "lat": 41.0412, "lon": 29.0389, "address": "Beylerbeyi Caddesi No:156"},
        {"name": "Kuzguncuk Mahallesi", "lat": 41.0234, "lon": 29.0123, "address": "Kuzguncuk Caddesi No:67"},
        {"name": "Burhaniye Mahallesi", "lat": 41.0567, "lon": 29.0234, "address": "Burhaniye Caddesi No:89"},
        {"name": "İcadiye Mahallesi", "lat": 41.0345, "lon": 29.0567, "address": "İcadiye Caddesi No:134"},
        
        # BESIKTAS DISTRICT (Far from depot)
        {"name": "Beşiktaş Merkez", "lat": 41.0422, "lon": 29.0067, "address": "Barbaros Bulvarı No:45"},
        {"name": "Ortaköy Mahallesi", "lat": 41.0553, "lon": 29.0267, "address": "Mecidiye Köprüsü Caddesi No:23"},
        {"name": "Bebek Mahallesi", "lat": 41.0834, "lon": 29.0434, "address": "Bebek Caddesi No:78"},
        {"name": "Etiler Mahallesi", "lat": 41.0785, "lon": 29.0345, "address": "Nispetiye Caddesi No:156"},
        {"name": "Levent Mahallesi", "lat": 41.0845, "lon": 29.0123, "address": "Büyükdere Caddesi No:234"},
        {"name": "Arnavutköy Mahallesi", "lat": 41.0567, "lon": 29.0456, "address": "Arnavutköy Caddesi No:89"},
        
        # SISLI DISTRICT (Medium-far distance)
        {"name": "Şişli Merkez", "lat": 41.0611, "lon": 28.9889, "address": "Halaskargazi Caddesi No:67"},
        {"name": "Mecidiyeköy Mahallesi", "lat": 41.0634, "lon": 28.9956, "address": "Büyükdere Caddesi No:123"},
        {"name": "Gayrettepe Mahallesi", "lat": 41.0723, "lon": 29.0034, "address": "Gayrettepe Caddesi No:45"},
        {"name": "Esentepe Mahallesi", "lat": 41.0678, "lon": 29.0089, "address": "Esentepe Caddesi No:178"},
        
        # BEYOGLU DISTRICT (Historic area)
        {"name": "Taksim Mahallesi", "lat": 41.0369, "lon": 28.9850, "address": "İstiklal Caddesi No:234"},
        {"name": "Galata Mahallesi", "lat": 41.0256, "lon": 28.9723, "address": "Galata Kulesi Caddesi No:67"},
        {"name": "Karaköy Mahallesi", "lat": 41.0234, "lon": 28.9767, "address": "Kemankeş Caddesi No:89"},
        {"name": "Cihangir Mahallesi", "lat": 41.0312, "lon": 28.9789, "address": "Cihangir Caddesi No:45"},
        
        # BAKIRKOY DISTRICT (Far south)
        {"name": "Bakırköy Merkez", "lat": 40.9789, "lon": 28.8567, "address": "Sahil Yolu Caddesi No:123"},
        {"name": "Yeşilköy Mahallesi", "lat": 40.9634, "lon": 28.8234, "address": "Yeşilköy Caddesi No:67"},
        {"name": "Florya Mahallesi", "lat": 40.9723, "lon": 28.8123, "address": "Florya Caddesi No:89"},
        {"name": "Ataköy Mahallesi", "lat": 40.9856, "lon": 28.8456, "address": "Ataköy Caddesi No:156"},
        
        # MALTEPE DISTRICT (East side)
        {"name": "Maltepe Merkez", "lat": 40.9334, "lon": 29.1234, "address": "Bağlarbaşı Caddesi No:45"},
        {"name": "Kartal Mahallesi", "lat": 40.9067, "lon": 29.1845, "address": "Kartal Caddesi No:123"},
        {"name": "Pendik Mahallesi", "lat": 40.8734, "lon": 29.2123, "address": "Pendik İskele Caddesi No:67"},
        {"name": "Tuzla Mahallesi", "lat": 40.8234, "lon": 29.2567, "address": "Tuzla Caddesi No:89"},
        
        # SARIYER DISTRICT (North side)
        {"name": "Sarıyer Merkez", "lat": 41.1678, "lon": 29.0567, "address": "Sarıyer İskele Caddesi No:23"},
        {"name": "Tarabya Mahallesi", "lat": 41.1456, "lon": 29.0634, "address": "Tarabya Caddesi No:45"},
        {"name": "Yenikoy Mahallesi", "lat": 41.1234, "lon": 29.0723, "address": "Yeniköy Caddesi No:67"},
        {"name": "Büyükdere Mahallesi", "lat": 41.1567, "lon": 29.0456, "address": "Büyükdere Caddesi No:134"},
        
        # FATIH DISTRICT (Historic center)
        {"name": "Sultanahmet Mahallesi", "lat": 41.0067, "lon": 28.9789, "address": "Divanyolu Caddesi No:45"},
        {"name": "Eminönü Mahallesi", "lat": 41.0178, "lon": 28.9734, "address": "Eminönü Caddesi No:23"},
        {"name": "Beyazıt Mahallesi", "lat": 41.0089, "lon": 28.9656, "address": "Beyazıt Caddesi No:67"},
        {"name": "Aksaray Mahallesi", "lat": 41.0023, "lon": 28.9567, "address": "Aksaray Caddesi No:89"},
        
        # ZEYTINBURNU DISTRICT (West side)
        {"name": "Zeytinburnu Merkez", "lat": 41.0034, "lon": 28.9012, "address": "Zeytinburnu Caddesi No:123"},
        {"name": "Merter Mahallesi", "lat": 41.0156, "lon": 28.8934, "address": "Merter Caddesi No:156"},
        
        # AVCILAR DISTRICT (Far west)
        {"name": "Avcılar Merkez", "lat": 41.0234, "lon": 28.7234, "address": "Avcılar Caddesi No:78"},
        {"name": "Küçükçekmece Mahallesi", "lat": 41.0345, "lon": 28.7567, "address": "Küçükçekmece Caddesi No:45"}
    ]
    
    # Delivery types with realistic distribution
    delivery_types = [
        ('express', 0.25),    # 25% express
        ('scheduled', 0.35),  # 35% scheduled  
        ('standard', 0.40)    # 40% standard
    ]
    
    # Turkish names for realistic data
    names = [
        "Mehmet Yılmaz", "Ayşe Demir", "Ali Kara", "Fatma Özkan", "Hasan Şahin",
        "Zeynep Koç", "Okan Yıldız", "Selin Erdoğan", "Emre Çelik", "Ceren Polat",
        "Burak Arslan", "Elif Güneş", "Murat Aydın", "Sevim Kaya", "Kemal Doğan",
        "Gizem Yıldırım", "Serkan Özdemir", "Pınar Çetin", "Tolga Karaca", "Melike Şen",
        "Cem Aktaş", "Duygu Bayram", "Erhan Güler", "Neslihan Öz", "Barış Uysal",
        "Seda Kıran", "Onur Tuncer", "Melisa Eren", "Volkan Aslan", "Deniz Toprak",
        "Orhan Demirci", "Gamze Yurt", "Koray Bal", "Nur Ceylan", "Arda Ekinci",
        "Şule Akbay", "Engin Duman", "Hilal Tekin", "Sinan Öztürk", "Yeşim Mutlu",
        "Gökhan Soylu", "Işık Pehlivan", "Umut Ağca", "Merve Şimşek", "Tayfun Korkmaz",
        "Derya Yavuz", "Kadir Çakır", "Nihan Özkan", "Fırat Durmuş", "Buse Altın"
    ]
    
    # Time windows for scheduled deliveries
    time_windows = [
        ("09:00", "12:00"),  # Morning
        ("10:00", "14:00"),  # Late morning
        ("13:00", "16:00"),  # Afternoon
        ("14:00", "17:00"),  # Late afternoon
        ("15:00", "18:00"),  # Evening
        ("16:00", "19:00"),  # Late evening
        ("08:30", "11:30"),  # Early morning
        ("11:00", "15:00"),  # Mid-day
    ]
    
    packages = []
    
    for i in range(50):
        # Select location
        location = locations[i % len(locations)]
        
        # Determine delivery type based on distribution
        rand = random.random()
        if rand < 0.25:
            delivery_type = 'express'
        elif rand < 0.60:  # 25% + 35% = 60%
            delivery_type = 'scheduled'
        else:
            delivery_type = 'standard'
        
        # Generate time windows for scheduled deliveries
        time_start, time_end = None, None
        if delivery_type == 'scheduled':
            time_start, time_end = random.choice(time_windows)
        elif delivery_type == 'express':
            # Express packages have morning delivery preference
            time_start, time_end = "09:00", "12:00"
        
        # Create package
        package = {
            'kargo_id': f'TST{i+1:03d}',  # TST001, TST002, etc.
            'recipient_name': names[i % len(names)],
            'address': f'{location["name"]} {location["address"]}, İstanbul',
            'phone': f'+90532{random.randint(1000000, 9999999)}',
            'delivery_type': delivery_type,
            'status': 'pending',
            'courier_id': 1,
            'latitude': location['lat'],
            'longitude': location['lon'],
            'time_window_start': time_start,
            'time_window_end': time_end,
            'created_at': datetime.now().isoformat(),
            'updated_at': datetime.now().isoformat()
        }
        
        packages.append(package)
    
    # Insert packages into database
    for package in packages:
        cursor.execute("""
            INSERT INTO packages (
                kargo_id, recipient_name, address, phone, delivery_type, 
                status, courier_id, latitude, longitude, time_window_start, 
                time_window_end, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            package['kargo_id'], package['recipient_name'], package['address'],
            package['phone'], package['delivery_type'], package['status'],
            package['courier_id'], package['latitude'], package['longitude'],
            package['time_window_start'], package['time_window_end'],
            package['created_at'], package['updated_at']
        ))
    
    conn.commit()
    conn.close()
    
    print(f"✅ Successfully created {len(packages)} test packages!")
    print("\n📊 Package Distribution:")
    
    # Count by delivery type
    express_count = len([p for p in packages if p['delivery_type'] == 'express'])
    scheduled_count = len([p for p in packages if p['delivery_type'] == 'scheduled'])
    standard_count = len([p for p in packages if p['delivery_type'] == 'standard'])
    
    print(f"🚀 Express: {express_count} packages ({express_count/50*100:.1f}%)")
    print(f"⏰ Scheduled: {scheduled_count} packages ({scheduled_count/50*100:.1f}%)")
    print(f"📦 Standard: {standard_count} packages ({standard_count/50*100:.1f}%)")
    
    print("\n🗺️ Geographic Distribution:")
    print("📍 Kadıköy (Close): 10 packages")
    print("📍 Üsküdar (Medium): 8 packages") 
    print("📍 Beşiktaş (Far): 6 packages")
    print("📍 Şişli (Medium-Far): 4 packages")
    print("📍 Other Districts: 22 packages")
    
    print("\n🎯 Algorithm Test Scenarios Created:")
    print("✅ Close vs Far distance optimization")
    print("✅ Mixed delivery type prioritization")
    print("✅ Time window constraints")
    print("✅ Geographic clustering efficiency")
    print("✅ Large-scale route optimization")
    
    return len(packages)

if __name__ == "__main__":
    print("🚀 Creating Extended Test Data for Algorithm Testing...")
    print("=" * 60)
    
    package_count = create_extended_test_data()
    
    print("=" * 60)
    print(f"🎉 Test data creation completed! {package_count} packages ready for testing.")
    print("\n📋 Next Steps:")
    print("1. Restart backend to reload data")
    print("2. Test frontend route optimization")
    print("3. Analyze algorithm performance with 50 packages")
    print("4. Verify geographic clustering and priority handling")
