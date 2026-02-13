
import sys
import urllib.request
import json
import urllib.parse

# Ensure we can print unicode characters
try:
    sys.stdout.reconfigure(encoding='utf-8')
except:
    pass

def fetch(url):
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'HorizonApp'})
        with urllib.request.urlopen(req) as r:
            return json.loads(r.read().decode())
    except Exception as e:
        print(f"Error {url}: {e}")
        return None

def test_nominatim(q):
    print(f"\n--- Nominatim: {q} ---")
    url = f"https://nominatim.openstreetmap.org/search?q={urllib.parse.quote(q)}&format=json&limit=5"
    data = fetch(url)
    if data:
        for item in data:
            print(f"  - {item.get('display_name')} ({item.get('lat')}, {item.get('lon')})")
    else:
        print("  No results")

def test_photon(q):
    print(f"\n--- Photon: {q} ---")
    url = f"https://photon.komoot.io/api/?q={urllib.parse.quote(q)}&limit=5"
    data = fetch(url)
    if data and 'features' in data:
        for f in data['features']:
            p = f['properties']
            c = f['geometry']['coordinates']
            # Photon properties vary: name, city, state, country
            parts = [p.get(k) for k in ['name', 'city', 'state', 'country'] if p.get(k)]
            print(f"  - {', '.join(parts)} ({c[1]}, {c[0]})")
    else:
        print("  No results")

q1 = "Samrad"
q2 = "Sandhan Valley"

test_nominatim(q1)
test_photon(q1)
test_nominatim(q2)
test_photon(q2)
