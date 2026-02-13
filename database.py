
import sqlite3
import json
import os

DB_NAME = 'orivex.db'

def get_db_connection():
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    if os.path.exists(DB_NAME):
        os.remove(DB_NAME) # Fresh start as requested

    conn = get_db_connection()
    c = conn.cursor()

    # Users Table
    c.execute('''
        CREATE TABLE users (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            password TEXT NOT NULL,
            roles TEXT NOT NULL, -- JSON string of roles array
            base_location TEXT,
            status TEXT DEFAULT 'active'
        )
    ''')

    # Events Table
    c.execute('''
        CREATE TABLE events (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            date TEXT NOT NULL,
            time TEXT NOT NULL,
            location TEXT NOT NULL,
            status TEXT DEFAULT 'Pending',
            total_needed INTEGER DEFAULT 1,
            assigned TEXT DEFAULT '[]' -- JSON string of user IDs
        )
    ''')

    # Requests Table
    c.execute('''
        CREATE TABLE requests (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            event_id TEXT NOT NULL,
            title TEXT,
            date TEXT,
            time TEXT,
            loc TEXT,
            status TEXT DEFAULT 'pending',
            FOREIGN KEY(user_id) REFERENCES users(id),
            FOREIGN KEY(event_id) REFERENCES events(id)
        )
    ''')

    # Availability Table
    c.execute('''
        CREATE TABLE availability (
            user_id TEXT,
            date TEXT,
            status TEXT,
            PRIMARY KEY (user_id, date)
        )
    ''')

    # Seed Admin User 'Prathit'
    prathit_roles = json.dumps(['manager', 'astronomer'])
    c.execute("INSERT INTO users (id, name, password, roles, base_location) VALUES (?, ?, ?, ?, ?)",
              ('u1', 'Prathit', 'Horizon@143', prathit_roles, 'Headquarters'))

    conn.commit()
    conn.close()
    print("Database initialized with user Prathit.")

if __name__ == '__main__':
    init_db()
