import sqlite3
import os

try:
    conn = sqlite3.connect('database.db')
    
    # 1. Add expenses table
    conn.execute('''
        CREATE TABLE IF NOT EXISTS expenses (
            id TEXT PRIMARY KEY,
            event_id TEXT,
            user_id TEXT,
            amount REAL,
            description TEXT,
            status TEXT DEFAULT 'pending',
            created_at TEXT
        )
    ''')
    print("Expenses table created.")
    
    # 2. Add payment_info to users
    try:
        conn.execute("ALTER TABLE users ADD COLUMN payment_info TEXT")
        print("Added payment_info column to users.")
    except sqlite3.OperationalError:
        print("payment_info column already exists.")
        
    conn.commit()
    conn.close()
    print("Migration complete.")
except Exception as e:
    print(f"Error during migration: {e}")
