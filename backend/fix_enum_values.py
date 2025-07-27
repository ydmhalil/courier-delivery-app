#!/usr/bin/env python3
"""
Database Enum Fixer - Fix delivery_type enum values
Convert lowercase enum values to uppercase to match SQLAlchemy enum
"""

import sqlite3
from datetime import datetime

def fix_enum_values():
    """Fix delivery_type enum values in database"""
    
    # Connect to database
    conn = sqlite3.connect('courier.db')
    cursor = conn.cursor()
    
    print("🔧 Fixing enum values in database...")
    
    # Update lowercase enum values to uppercase
    cursor.execute("""
        UPDATE packages 
        SET delivery_type = 'EXPRESS' 
        WHERE delivery_type = 'express'
    """)
    express_count = cursor.rowcount
    
    cursor.execute("""
        UPDATE packages 
        SET delivery_type = 'SCHEDULED' 
        WHERE delivery_type = 'scheduled'
    """)
    scheduled_count = cursor.rowcount
    
    cursor.execute("""
        UPDATE packages 
        SET delivery_type = 'STANDARD' 
        WHERE delivery_type = 'standard'
    """)
    standard_count = cursor.rowcount
    
    # Update status enum values to uppercase  
    cursor.execute("""
        UPDATE packages 
        SET status = 'PENDING' 
        WHERE status = 'pending'
    """)
    pending_count = cursor.rowcount
    
    cursor.execute("""
        UPDATE packages 
        SET status = 'IN_TRANSIT' 
        WHERE status = 'in_transit'
    """)
    
    cursor.execute("""
        UPDATE packages 
        SET status = 'DELIVERED' 
        WHERE status = 'delivered'
    """)
    
    cursor.execute("""
        UPDATE packages 
        SET status = 'FAILED' 
        WHERE status = 'failed'
    """)
    
    conn.commit()
    
    print(f"✅ Fixed delivery_type enum values:")
    print(f"   📦 EXPRESS: {express_count} packages")
    print(f"   ⏰ SCHEDULED: {scheduled_count} packages") 
    print(f"   🚚 STANDARD: {standard_count} packages")
    print(f"✅ Fixed status enum values:")
    print(f"   📋 PENDING: {pending_count} packages")
    
    # Verify the fix
    cursor.execute("SELECT delivery_type, COUNT(*) FROM packages GROUP BY delivery_type")
    results = cursor.fetchall()
    
    print("\n📊 Current delivery_type distribution:")
    for delivery_type, count in results:
        print(f"   {delivery_type}: {count} packages")
    
    conn.close()
    print("\n🎉 Database enum values fixed successfully!")

if __name__ == "__main__":
    print("🚀 Fixing Database Enum Values...")
    print("=" * 50)
    
    fix_enum_values()
    
    print("=" * 50)
    print("📋 Next Steps:")
    print("1. Restart backend server")
    print("2. Test frontend again")
    print("3. Verify 50 packages load correctly")
