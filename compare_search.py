
import urllib.request
import json
import urllib.parse
import time

def fetch_json(url, headers={}):
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode())
    except Exception as e:
        print(f"Error fetching {url}: {e}")
        return None

def test_search(query):
    print(f"\n--- Testing Query: '{query}' ---")
    encoded_query = urllib.parse.quote(query)

    # 1. Open-Meteo
    om_url = f"https://geocoding-api.open-meteo.com/v1/search?name={encoded_query}&count=10&language=en&format=json"
    om_data = fetch_json(om_url)
    print("Open-Meteo Results:")
    if om_data and 'results' in om_data:
        for r in om_data['results']:
            print(f"  - {r.get('name')}, {r.get('admin1')}, {r.get('country')}")
    else:
        print("  None")

    # 2. Nominatim (OSM)
    # Require User-Agent
    nom_url = f"https://nominatim.openstreetmap.org/search?q={encoded_query}&format=json&limit=10"
    nom_data = fetch_json(nom_url, headers={'User-Agent': 'HorizonApp/1.0'})
    print("\nNominatim Results:")
    if nom_data:
        for r in nom_data:
            print(f"  - {r.get('display_name')}")
    else:
        print("  None")

test_search("Samrad")
test_search("Sandhan Valley")
test_search("Bhandardara")
