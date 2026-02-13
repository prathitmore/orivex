
import urllib.request
import json
import urllib.parse
from datetime import datetime

def fetch_json(url):
    try:
        with urllib.request.urlopen(url) as response:
            return json.loads(response.read().decode())
    except Exception as e:
        print(f"Error fetching {url}: {e}")
        return None

def test_location(location_query, date_str="2026-02-14"):
    print(f"\n--- Testing Location: '{location_query}' ---")
    encoded_loc = urllib.parse.quote(location_query)
    geo_url = f"https://geocoding-api.open-meteo.com/v1/search?name={encoded_loc}&count=5&language=en&format=json"
    
    geo_data = fetch_json(geo_url)
    if not geo_data or 'results' not in geo_data:
        print("No results found.")
        return

    print(f"Found {len(geo_data['results'])} results.")
    for idx, result in enumerate(geo_data['results']):
        print(f"Result [{idx}]: Name={result.get('name')}, Country={result.get('country')}, Admin1={result.get('admin1')}, Lat={result.get('latitude')}, Lon={result.get('longitude')}")

    # Use the first result for weather
    result = geo_data['results'][0]
    latitude = result['latitude']
    longitude = result['longitude']
    
    # Check 14th and 15th to cover the full night
    weather_url = f"https://api.open-meteo.com/v1/forecast?latitude={latitude}&longitude={longitude}&hourly=cloud_cover&start_date={date_str}&end_date=2026-02-15&timezone=auto"
    print(f"Weather URL: {weather_url}")

    weather_data = fetch_json(weather_url)
    if not weather_data or 'hourly' not in weather_data:
        print("No weather data.")
        return
        
    hourly = weather_data['hourly']
    times = hourly['time']
    clouds = hourly['cloud_cover']
    
    print(f"Hourly Cloud Cover (Local Time) starting {date_str} 18:00:")
    for i, t in enumerate(times):
        dt = datetime.fromisoformat(t)
        # Filter for relevant night hours: Feb 14 18:00 to Feb 15 06:00
        # date_str is '2026-02-14'
        if (dt.date().isoformat() == date_str and dt.hour >= 18) or \
           (dt.date().isoformat() == '2026-02-15' and dt.hour < 6):
            print(f"  {t}: {clouds[i]}%")

# Test
test_location("Vangani")
test_location("Vangani Maharashtra")
