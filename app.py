
import mimetypes
import os
import urllib.parse
from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import uuid
import smtplib
from email.mime.text import MIMEText
import random
import string
import datetime
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import text
import traceback
from whitenoise import WhiteNoise

# --- Configuration ---
BASE_DIR = os.path.abspath(os.path.dirname(__file__))

# mimetypes.add_type('application/javascript', '.js') # Let whitenoise handle it
# mimetypes.add_type('text/css', '.css')
# mimetypes.add_type('image/svg+xml', '.svg')

app = Flask(__name__) # No static_folder=BASE_DIR needed with WhiteNoise
CORS(app)

# Allow serving from root directory (Be careful with secrets in production usually, but ok for now)
app.wsgi_app = WhiteNoise(app.wsgi_app, root=BASE_DIR, prefix='/', index_file='index.html', autorefresh=True)


# Database Config
# Try to get from Environment (Netlify/Production)
db_uri = os.environ.get('DATABASE_URL')

# Fallback for Local Development if not set
if not db_uri:
    # Fix user's password encoding: Superbase@143 -> Superbase%40143
    encoded_pass = urllib.parse.quote_plus("Superbase@143")
    # Construct the URI (Transaction Pooler)
    db_uri = f"postgresql+pg8000://postgres.bvhhtssbdklleqperxoz:{encoded_pass}@aws-1-ap-south-1.pooler.supabase.com:6543/postgres"

# Ensure correct protocol for SQLAlchemy (switch to pg8000 if using generic postgres)
if db_uri and db_uri.startswith("postgres://"):
    db_uri = db_uri.replace("postgres://", "postgresql+pg8000://", 1)
elif db_uri and db_uri.startswith("postgresql://"):
     db_uri = db_uri.replace("postgresql://", "postgresql+pg8000://", 1)

app.config['SQLALCHEMY_DATABASE_URI'] = db_uri
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# Helper for Row -> Dict (Handles SQLAlchemy RowProxy)
def row_to_dict(row):
    return dict(row._mapping)

# ... (Scheam Init Omitted) ...

# --- Routes ---

@app.route('/')
def root():
    return app.send_static_file('index.html')

@app.route('/api/init', methods=['POST'])
def init_data_route():
    init_schema()
    return jsonify({"message": "Schema initialized"})

# --- Users API ---

@app.route('/api/login', methods=['POST'])
def login():
    try:
        data = request.json
        sql = text("SELECT * FROM users WHERE (lower(name) = :name OR lower(username) = :name) AND password = :pwd AND status != 'deleted'")
        user = db.session.execute(sql, {"name": data['name'].lower(), "pwd": data['password']}).fetchone()
        
        if user:
            u = row_to_dict(user)
            try: roles = json.loads(u['roles'])
            except: roles = []
            
            return jsonify({
                "success": True,
                "user": {
                    "id": u['id'],
                    "name": u['name'],
                    "username": u['username'],
                    "roles": roles,
                    "base_location": u['base_location'],
                    "status": u['status']
                }
            })
        return jsonify({"success": False, "message": "Invalid credentials"}), 401
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"success": False, "message": f"Server Error: {str(e)}"}), 500

@app.route('/api/users', methods=['GET'])
def get_users():
    users = db.session.execute(text("SELECT * FROM users WHERE status != 'deleted'")).fetchall()
    users_list = []
    for row in users:
        u = row_to_dict(row)
        roles = []
        try: roles = json.loads(u['roles'])
        except: pass
        users_list.append({
            "id": u['id'],
            "name": u['name'],
            "roles": roles,
            "base_location": u['base_location'],
            "payment_info": u.get('payment_info'),
            "status": u['status']
        })
    return jsonify(users_list)

@app.route('/api/users', methods=['POST'])
def create_user():
    data = request.json
    new_id = f"u{uuid.uuid4().hex[:8]}"
    username = data.get('contact', data['name'])
    
    sql = text("INSERT INTO users (id, name, username, password, roles, base_location) VALUES (:id, :name, :username, :password, :roles, :base)")
    try:
        db.session.execute(sql, {
            "id": new_id,
            "name": data['name'],
            "username": username,
            "password": data['password'],
            "roles": json.dumps(data['roles']),
            "base": data.get('base_location', '')
        })
        db.session.commit()
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

    # Send Welcome Email
    try:
        login_url = "https://orivex-1.onrender.com" # Updated for production
        email_body = f"Welcome {data['name']}!\n\nYour Orivex account has been created.\nUsername: {username}\nPassword: {data['password']}\n\nLogin here: {login_url}"
        send_email(username, "Your Orivex Account Credentials", email_body)
    except Exception as e:
        print(f"Failed to send welcome email: {e}")

    return jsonify({"success": True, "id": new_id})

@app.route('/api/users/<user_id>', methods=['GET'])
def get_user(user_id):
    user = db.session.execute(text("SELECT * FROM users WHERE id = :id"), {"id": user_id}).fetchone()
    if user:
        u = row_to_dict(user)
        try: roles = json.loads(u['roles'])
        except: roles = []
        return jsonify({
            "id": u['id'],
            "name": u['name'],
            "roles": roles,
            "base_location": u['base_location'],
            "status": u['status']
        })
    return jsonify({"error": "User not found"}), 404

@app.route('/api/users/<user_id>', methods=['PATCH'])
def update_user_details(user_id):
    data = request.json
    if 'name' in data:
        db.session.execute(text("UPDATE users SET name = :val WHERE id = :id"), {"val": data['name'], "id": user_id})
    if 'base_location' in data:
        db.session.execute(text("UPDATE users SET base_location = :val WHERE id = :id"), {"val": data['base_location'], "id": user_id})
    if 'password' in data and data['password']:
        db.session.execute(text("UPDATE users SET password = :val WHERE id = :id"), {"val": data['password'], "id": user_id})
    db.session.commit()
    return jsonify({"success": True})

@app.route('/api/users/<user_id>', methods=['DELETE'])
def delete_user(user_id):
    db.session.execute(text("UPDATE users SET status = 'deleted' WHERE id = :id"), {"id": user_id})
    db.session.commit()
    return jsonify({"success": True})

@app.route('/api/users/<user_id>/role', methods=['PATCH'])
def update_user_role(user_id):
    data = request.json
    db.session.execute(text("UPDATE users SET roles = :roles WHERE id = :id"), {"roles": json.dumps(data['roles']), "id": user_id})
    db.session.commit()
    return jsonify({"success": True})

@app.route('/api/users/<user_id>/payment_info', methods=['PATCH'])
def update_payment_info(user_id):
    data = request.json
    db.session.execute(text("UPDATE users SET payment_info = :info WHERE id = :id"), {"info": data['payment_info'], "id": user_id})
    db.session.commit()
    return jsonify({"success": True})

@app.route('/api/users/<user_id>/stats', methods=['GET'])
def get_user_stats(user_id):
    assigned = db.session.execute(text("SELECT COUNT(*) FROM requests WHERE user_id = :uid AND status = 'accepted'"), {"uid": user_id}).scalar()
    pending = db.session.execute(text("SELECT COUNT(*) FROM requests WHERE user_id = :uid AND status = 'pending'"), {"uid": user_id}).scalar()
    return jsonify({"assigned_events": assigned, "pending_requests": pending})

@app.route('/api/users/<user_id>/accepted_events', methods=['GET'])
def get_user_accepted_events(user_id):
    sql = text("""
        SELECT e.* 
        FROM events e
        JOIN requests r ON e.id = r.event_id
        WHERE r.user_id = :uid AND r.status = 'accepted'
    """)
    rows = db.session.execute(sql, {"uid": user_id}).fetchall()
    events_list = []
    for row in rows:
        e = row_to_dict(row)
        try: assigned = json.loads(e['assigned'])
        except: assigned = []
        events_list.append({
            "id": e['id'],
            "title": e['title'],
            "date": e['date'],
            "time": e['time'],
            "location": e['location'],
            "status": e.get('status', 'scheduled'),
            "total_needed": e['total_needed'],
            "assigned": assigned
        })
    return jsonify(events_list)

# --- Events API ---

@app.route('/api/events', methods=['GET'])
def get_events():
    events = db.session.execute(text("SELECT * FROM events")).fetchall()
    events_list = []
    for row in events:
        e = row_to_dict(row)
        try: assigned = json.loads(e['assigned'])
        except: assigned = []
        events_list.append({
            "id": e['id'],
            "title": e['title'],
            "date": e['date'],
            "time": e['time'],
            "location": e['location'],
            "status": e.get('status', 'scheduled'),
            "total_needed": e['total_needed'],
            "assigned": assigned
        })
    return jsonify(events_list)

@app.route('/api/events', methods=['POST'])
def create_event():
    data = request.json
    new_id = f"e{uuid.uuid4().hex[:8]}"
    assigned_json = json.dumps(data.get('assigned', []))
    
    sql = text("INSERT INTO events (id, title, date, time, location, assigned, total_needed) VALUES (:id, :title, :date, :time, :loc, :assigned, :needed)")
    db.session.execute(sql, {
        "id": new_id,
        "title": data['title'],
        "date": data['date'],
        "time": data['time'],
        "loc": data['location'],
        "assigned": assigned_json,
        "needed": data['total_needed']
    })
    
    for uid in data.get('assigned', []):
        req_id = f"r{uuid.uuid4().hex[:8]}"
        r_sql = text("INSERT INTO requests (id, user_id, event_id, title, date, time, loc) VALUES (:id, :uid, :eid, :title, :date, :time, :loc)")
        db.session.execute(r_sql, {
            "id": req_id, "uid": uid, "eid": new_id,
            "title": data['title'], "date": data['date'], "time": data['time'], "loc": data['location']
        })
        
    db.session.commit()
    return jsonify({"success": True, "id": new_id})

@app.route('/api/events/<event_id>', methods=['PATCH'])
def update_event(event_id):
    data = request.json
    sql = text("UPDATE events SET title=:title, date=:date, time=:time, location=:loc WHERE id=:id")
    db.session.execute(sql, {
        "title": data['title'], "date": data['date'], "time": data['time'], "loc": data['location'], "id": event_id
    })
    
    if 'assigned' in data:
        new_assigned = set(data['assigned'])
        row = db.session.execute(text("SELECT assigned FROM events WHERE id=:id"), {"id": event_id}).fetchone()
        
        current = set()
        if row and row._mapping['assigned']:
             try: current = set(json.loads(row._mapping['assigned']))
             except: pass
        
        db.session.execute(text("UPDATE events SET assigned=:assigned WHERE id=:id"), {"assigned": json.dumps(list(new_assigned)), "id": event_id})
        
        to_add = new_assigned - current
        for uid in to_add:
            req_id = f"r{uuid.uuid4().hex[:8]}"
            db.session.execute(text("INSERT INTO requests (id, user_id, event_id, title, date, time, loc) VALUES (:id, :uid, :eid, :title, :date, :time, :loc)"), {
                "id": req_id, "uid": uid, "eid": event_id, "title": data['title'], "date": data['date'], "time": data['time'], "loc": data['location']
            })
            
        to_remove = current - new_assigned
        for uid in to_remove:
            db.session.execute(text("DELETE FROM requests WHERE event_id=:eid AND user_id=:uid"), {"eid": event_id, "uid": uid})
            
        if new_assigned & current:
            db.session.execute(text("UPDATE requests SET title=:title, date=:date, time=:time, loc=:loc WHERE event_id=:eid"), {
                 "title": data['title'], "date": data['date'], "time": data['time'], "loc": data['location'], "eid": event_id
            })

    db.session.commit()
    return jsonify({"success": True})

@app.route('/api/events/<event_id>', methods=['DELETE'])
def delete_event(event_id):
    db.session.execute(text("DELETE FROM events WHERE id=:id"), {"id": event_id})
    db.session.execute(text("DELETE FROM requests WHERE event_id=:id"), {"id": event_id})
    db.session.commit()
    return jsonify({"success": True})

# --- Requests ---

@app.route('/api/requests/<user_id>', methods=['GET'])
def get_requests(user_id):
    rows = db.session.execute(text("SELECT * FROM requests WHERE user_id=:uid AND status='pending'"), {"uid": user_id}).fetchall()
    return jsonify([row_to_dict(r) for r in rows])

@app.route('/api/requests/event/<event_id>', methods=['GET'])
def get_event_requests(event_id):
    rows = db.session.execute(text("SELECT * FROM requests WHERE event_id=:eid"), {"eid": event_id}).fetchall()
    return jsonify([row_to_dict(r) for r in rows])

@app.route('/api/requests/<req_id>', methods=['PATCH'])
def update_request(req_id):
    data = request.json
    db.session.execute(text("UPDATE requests SET status=:st WHERE id=:id"), {"st": data['status'], "id": req_id})
    db.session.commit()
    return jsonify({"success": True})

# --- Availability ---

@app.route('/api/availability/<user_id>', methods=['GET'])
def get_availability(user_id):
    rows = db.session.execute(text("SELECT date, status FROM availability WHERE user_id=:uid"), {"uid": user_id}).fetchall()
    return jsonify({r._mapping['date']: r._mapping['status'] for r in rows})

@app.route('/api/availability/all', methods=['GET'])
def get_all_availability():
    rows = db.session.execute(text("SELECT * FROM availability")).fetchall()
    return jsonify([row_to_dict(r) for r in rows])

@app.route('/api/availability', methods=['POST'])
def set_availability():
    data = request.json
    # Postgres uses ON CONFLICT. This ensures idempotency.
    try:
        sql = text("""
            INSERT INTO availability (user_id, date, status) VALUES (:uid, :date, :status)
            ON CONFLICT (user_id, date) DO UPDATE SET status = EXCLUDED.status
        """)
        db.session.execute(sql, {"uid": data['user_id'], "date": data['date'], "status": data['status']})
    except Exception as e:
        print(f"Availability Error (fallback): {e}")
        # Standard fallback if not supported (e.g. SQLite doesn't support ON CONFLICT the same way via generic SQL sometimes)
        # But we are targeting Postgres now.
        return jsonify({"success": False, "message": str(e)}), 500
        
    db.session.commit()
    return jsonify({"success": True})

# --- Expenses ---

@app.route('/api/expenses', methods=['POST'])
def create_expense():
    data = request.json
    new_id = f"exp{uuid.uuid4().hex[:8]}"
    created_at = data.get('created_at', '')
    
    event = db.session.execute(text("SELECT assigned FROM events WHERE id=:id"), {"id": data['event_id']}).fetchone()
    if not event: return jsonify({"error": "Event not found"}), 404
    
    try: assigned = json.loads(event._mapping['assigned'])
    except: assigned = []
    
    if data['user_id'] not in assigned:
        return jsonify({"error": "Not assigned to event"}), 403
        
    group_members = json.dumps(data.get('group_members', []))
    
    sql = text("""
        INSERT INTO expenses (id, event_id, user_id, amount, description, status, created_at, group_members)
        VALUES (:id, :eid, :uid, :amount, :desc, 'pending', :created, :group)
    """)
    db.session.execute(sql, {
        "id": new_id, "eid": data['event_id'], "uid": data['user_id'],
        "amount": data['amount'], "desc": data['description'], "created": created_at, "group": group_members
    })
    db.session.commit()
    return jsonify({"success": True, "id": new_id})

@app.route('/api/expenses', methods=['GET'])
def get_expenses_route():
    user_id = request.args.get('user_id')
    event_id = request.args.get('event_id')
    
    start_sql = "SELECT * FROM expenses WHERE 1=1"
    params = {}
    
    if user_id:
        start_sql += " AND (user_id = :uid OR group_members LIKE :lu)"
        params['uid'] = user_id
        params['lu'] = f'%"{user_id}"%'
    if event_id:
        start_sql += " AND event_id = :eid"
        params['eid'] = event_id
        
    rows = db.session.execute(text(start_sql), params).fetchall()
    result = []
    for r in rows:
        d = row_to_dict(r)
        try: d['group_members'] = json.loads(d['group_members'])
        except: d['group_members'] = []
        result.append(d)
    return jsonify(result)

@app.route('/api/expenses/<expense_id>', methods=['PATCH'])
def update_expense_status(expense_id):
    data = request.json
    db.session.execute(text("UPDATE expenses SET status=:st WHERE id=:id"), {"st": data['status'], "id": expense_id})
    db.session.commit()
    return jsonify({"success": True})

# --- Locations ---

@app.route('/api/locations', methods=['GET'])
def get_locations():
    # Fetch all, ensure table exists implicitly by init_schema runs at startup
    locs = db.session.execute(text("SELECT * FROM locations ORDER BY name")).fetchall()
    return jsonify([{"id": r._mapping['id'], "name": r._mapping['name'], "lat": r._mapping['latitude'], "lon": r._mapping['longitude']} for r in locs])

@app.route('/api/locations', methods=['POST'])
def add_location():
    data = request.json
    new_id = f"loc{uuid.uuid4().hex[:8]}"
    try:
        sql = text("INSERT INTO locations (id, name, latitude, longitude) VALUES (:id, :name, :lat, :lon)")
        db.session.execute(sql, {
            "id": new_id, "name": data['name'], "lat": data.get('latitude'), "lon": data.get('longitude')
        })
        db.session.commit()
        return jsonify({"success": True, "id": new_id, "name": data['name']})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 400

@app.route('/api/locations/<loc_id>', methods=['DELETE'])
def delete_location(loc_id):
    # loc_id is now text
    db.session.execute(text("DELETE FROM locations WHERE id=:id"), {"id": loc_id})
    db.session.commit()
    return jsonify({"success": True})

# --- Auth ---

import threading

def send_email_async(recipient, subject, body):
    try:
        print(f"Sending email to {recipient} (Async)...")
        sender = "orivexreply@gmail.com"
        password = "ctczkbzxnkmhtxfx"
        msg = MIMEText(body)
        msg['Subject'] = subject
        msg['From'] = sender
        msg['To'] = recipient
        
        # Use Port 587 and STARTTLS
        with smtplib.SMTP('smtp.gmail.com', 587) as smtp:
            smtp.starttls()
            smtp.login(sender, password)
            smtp.send_message(msg)
            print("Email sent successfully!")
    except Exception as e:
        print(f"SMTP Error details: {e}")
        import traceback
        traceback.print_exc()
        import sys
        print(f"EMAIL FAILED: {str(e)}", file=sys.stderr)

def send_email(recipient, subject, body):
    # Determine URL
    # Hardcoded or Env Var
    # Start thread
    t = threading.Thread(target=send_email_async, args=(recipient, subject, body))
    t.start()
    return True, "Email queued"


@app.route('/api/auth/reset-password-request', methods=['POST'])
def reset_password_request():
    data = request.json
    email = data.get('email')
    user = db.session.execute(text("SELECT * FROM users WHERE username=:email"), {"email": email}).fetchone()
    if not user: return jsonify({"success": False, "message": "User not found"}), 404
    
    otp = ''.join(random.choices(string.digits, k=6))
    expires = (datetime.datetime.now() + datetime.timedelta(minutes=10)).isoformat()
    
    # Upsert OTP (Postgres style)
    try:
        sql = text("""
            INSERT INTO otp_codes (email, code, expires_at) VALUES (:e, :c, :ex)
            ON CONFLICT (email) DO UPDATE SET code=EXCLUDED.code, expires_at=EXCLUDED.expires_at
        """)
        db.session.execute(sql, {"e": email, "c": otp, "ex": expires})
    except Exception as e:
        print(f"OTP Upsert Error: {e}")
        return jsonify({"success": False, "message": "Internal Error"}), 500
        
    db.session.commit()
    
    success, msg = send_email(email, "Orivex OTP", f"Your OTP: {otp}")
    if success: return jsonify({"success": True})
    return jsonify({"success": False, "message": msg}), 500

@app.route('/api/auth/reset-password-confirm', methods=['POST'])
def reset_password_confirm():
    data = request.json
    email = data.get('email')
    rec = db.session.execute(text("SELECT * FROM otp_codes WHERE email=:e"), {"e": email}).fetchone()
    if not rec: return jsonify({"success": False, "message": "Invalid request"}), 400
    
    r = row_to_dict(rec)
    if r['code'] != data['otp']: return jsonify({"success": False, "message": "Invalid OTP"}), 400
    
    try:
        exp = datetime.datetime.fromisoformat(r['expires_at'])
    except:
        exp = datetime.datetime.now() # Fail safe
        
    if datetime.datetime.now() > exp:
         return jsonify({"success": False, "message": "Expired"}), 400
         
    db.session.execute(text("UPDATE users SET password=:pw WHERE username=:e"), {"pw": data['new_password'], "e": email})
    db.session.execute(text("DELETE FROM otp_codes WHERE email=:e"), {"e": email})
    db.session.commit()
    return jsonify({"success": True})

# --- Init ---
# with app.app_context():
#    # Run once at startup
#    try:
#        init_schema()
#    except Exception as e:
#        print(f"Startup Schema Init Warning: {e}")

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
