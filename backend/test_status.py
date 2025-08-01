#!/usr/bin/env python3

import sys
import os
import sqlite3

# Database path
DB_PATH = "../courier.db"

def update_package_status():
    """Update a package to in_transit status for testing"""
    try:
        # Connect to database
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Update first package to in_transit
        cursor.execute("""
            UPDATE packages 
            SET status = 'in_transit' 
            WHERE id = 1 AND courier_id = 1
        """)
        
        conn.commit()
        
        # Check current status
        cursor.execute("""
            SELECT status, COUNT(*) as count
            FROM packages 
            WHERE courier_id = 1
            GROUP BY status
        """)
        
        results = cursor.fetchall()
        
        print("📊 Paket durumları:")
        pending = 0
        in_transit = 0
        delivered = 0
        
        for status, count in results:
            print(f"   {status}: {count}")
            if status == 'pending':
                pending = count
            elif status == 'in_transit':
                in_transit = count
            elif status == 'delivered':
                delivered = count
        
        print(f"\n📦 Özet:")
        print(f"   Teslim edilmemiş (pending + in_transit): {pending + in_transit}")
        print(f"   Teslim edilen: {delivered}")
        
        conn.close()
        
    except Exception as e:
        print(f"❌ Hata: {e}")

if __name__ == "__main__":
    update_package_status()
