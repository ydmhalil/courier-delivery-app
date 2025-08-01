#!/usr/bin/env python3
import sqlite3
import sys
import os

# Add backend to path
sys.path.append('backend')

def check_packages():
    """Check packages in database"""
    try:
        # Connect to database
        db_path = os.path.join('courier.db')
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Get all packages for courier 1
        cursor.execute("""
            SELECT id, kargo_id, status, recipient_name, address 
            FROM packages 
            WHERE courier_id = 1
        """)
        
        packages = cursor.fetchall()
        
        print(f"📦 Toplam paket sayısı: {len(packages)}")
        print("\nPaket detayları:")
        print("-" * 80)
        
        pending_count = 0
        delivered_count = 0
        in_transit_count = 0
        
        for pkg in packages:
            pkg_id, kargo_id, status, recipient_name, address = pkg
            print(f"ID: {pkg_id} | Kargo: {kargo_id} | Durum: {status} | Alıcı: {recipient_name}")
            
            if status == 'pending':
                pending_count += 1
            elif status == 'delivered':
                delivered_count += 1
            elif status == 'in_transit':
                in_transit_count += 1
        
        print("-" * 80)
        print(f"📊 Durum özeti:")
        print(f"   Bekleyen: {pending_count}")
        print(f"   Teslim edilen: {delivered_count}")
        print(f"   Yolda: {in_transit_count}")
        
        conn.close()
        
    except Exception as e:
        print(f"❌ Hata: {e}")

if __name__ == "__main__":
    check_packages()
