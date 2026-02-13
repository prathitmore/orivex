
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

def test_location(location_query):
    print(f"\n--- Testing Location: '{location_query}' ---")
    encoded_loc = urllib.parse.quote(location_query)
    geo_url = f"https://geocoding-api.open-meteo.com/v1/search?name={encoded_loc}&count=5&language=en&format=json"
    
    geo_data = fetch_json(geo_url)
    if not geo_data or 'results' not in geo_data:
        print("No results found.")
        return

    result = geo_data['results'][0]
    print(f"Geocoding Result [0]: Name={result.get('name')}, Country={result.get('country')}, Admin1={result.get('admin1')}, Lat={result.get('latitude')}, Lon={result.get('longitude')}")

    latitude = result['latitude']
    longitude = result['longitude']
    
    # Date: 2026-02-14
    date_str = "2026-02-14"
    weather_url = f"https://api.open-meteo.com/v1/forecast?latitude={latitude}&longitude={longitude}&hourly=cloud_cover&start_date={date_str}&end_date={date_str}&timezone=auto"
    print(f"Weather URL: {weather_url}")

    weather_data = fetch_json(weather_url)
    if not weather_data or 'hourly' not in weather_data:
        print("No weather data.")
        return

    print(f"Timezone: {weather_data.get('timezone')}")
    
    hourly = weather_data['hourly']
    times = hourly['time']
    clouds = hourly['cloud_cover']
    
    night_hours = [20, 21, 22, 23]
    relevant_clouds = []
    
    print("Night Hours Cloud Cover (20:00 - 23:00):")
    for i, t in enumerate(times):
        # Time format is usually "YYYY-MM-DDTHH:MM"
        dt = datetime.fromisoformat(t)
        if dt.hour in night_hours:
            print(f"  {t}: {clouds[i]}%")
            relevant_clouds.append(clouds[i])
            
    if relevant_clouds:
        avg = sum(relevant_clouds) / len(relevant_clouds)
        print(f"Average: {avg}%")
    else:
        print("No match for night hours.")

# Test cases
test_location("Vangani")
test_location("Vangani, Maharashtra")
test_location("Bhandardara")
