import sqlite3
import os

try:
    conn = sqlite3.connect('database.db')
    cursor = conn.cursor()
    
    # Check expenses table
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='expenses'")
    expenses = cursor.fetchone()
    print(f"Expenses table exists: {expenses is not None}")
    print(f"Expenses table exists: {expenses is not None}")
    
    # Check users table payment_info
    cursor.execute("PRAGMA table_info(users)")
    columns = [row[1] for row in cursor.fetchall()]
    print(f"Payment info column exists: {'payment_info' in columns}")
    
    conn.close()
except Exception as e:
    print(f"Error checking DB: {e}")
