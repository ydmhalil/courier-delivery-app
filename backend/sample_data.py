#!/usr/bin/env python3

import sys
import os
from datetime import datetime, timedelta
import sqlite3

# Database path
DB_PATH = "../courier.db"

def init_sample_data():
    """Initialize database with sample data"""
    try:
        # Connect to database
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Clear existing packages for courier 1
        cursor.execute("DELETE FROM packages WHERE courier_id = 1")
        
        # Sample packages data for courier 1
        sample_packages = [
            ("PKG001", "Ahmet Yılmaz", "Kadıköy, İstanbul", "+90 532 123 4567", "pending", "express"),
            ("PKG002", "Fatma Kaya", "Beşiktaş, İstanbul", "+90 532 234 5678", "pending", "standard"),
            ("PKG003", "Mehmet Demir", "Şişli, İstanbul", "+90 532 345 6789", "pending", "scheduled"),
            ("PKG004", "Ayşe Öz", "Beyoğlu, İstanbul", "+90 532 456 7890", "pending", "express"),
            ("PKG005", "Ali Can", "Üsküdar, İstanbul", "+90 532 567 8901", "pending", "standard"),
            ("PKG006", "Zeynep Ak", "Maltepe, İstanbul", "+90 532 678 9012", "pending", "express"),
            ("PKG007", "Hasan Kara", "Pendik, İstanbul", "+90 532 789 0123", "pending", "standard"),
            ("PKG008", "Elif Sar", "Kartal, İstanbul", "+90 532 890 1234", "pending", "scheduled"),
            ("PKG009", "Osman Gül", "Ataşehir, İstanbul", "+90 532 901 2345", "pending", "express"),
            ("PKG010", "Seda Mor", "Bakırköy, İstanbul", "+90 532 012 3456", "pending", "standard"),
            ("PKG011", "Emre Yaz", "Florya, İstanbul", "+90 532 123 4567", "pending", "express"),
            ("PKG012", "Deniz Su", "Yeşilköy, İstanbul", "+90 532 234 5678", "pending", "standard"),
            ("PKG013", "Burak Ay", "Bahçelievler, İstanbul", "+90 532 345 6789", "pending", "scheduled"),
            ("PKG014", "Gizem Yıl", "Bağcılar, İstanbul", "+90 532 456 7890", "pending", "express"),
            ("PKG015", "Cem Dal", "Güngören, İstanbul", "+90 532 567 8901", "pending", "standard"),
        ]
        
        # Insert sample packages
        for i, (kargo_id, recipient_name, address, phone, status, delivery_type) in enumerate(sample_packages):
            # Random coordinates for Istanbul
            latitude = 41.0082 + (i * 0.01)  # Spread around Istanbul
            longitude = 28.9784 + (i * 0.01)
            
            cursor.execute("""
                INSERT INTO packages 
                (kargo_id, courier_id, recipient_name, address, phone, delivery_type, 
                 latitude, longitude, status, created_at)
                VALUES (?, 1, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                kargo_id, recipient_name, address, phone, delivery_type,
                latitude, longitude, status, datetime.now()
            ))
        
        conn.commit()
        print(f"✅ {len(sample_packages)} paket başarıyla eklendi!")
        
        # Verify data
        cursor.execute("SELECT COUNT(*) FROM packages WHERE courier_id = 1")
        count = cursor.fetchone()[0]
        print(f"📦 Kurye 1 için toplam paket sayısı: {count}")
        
        cursor.execute("SELECT COUNT(*) FROM packages WHERE courier_id = 1 AND status = 'pending'")
        pending_count = cursor.fetchone()[0]
        print(f"📋 Bekleyen paket sayısı: {pending_count}")
        
        conn.close()
        
    except Exception as e:
        print(f"❌ Hata: {e}")

if __name__ == "__main__":
    init_sample_data()
