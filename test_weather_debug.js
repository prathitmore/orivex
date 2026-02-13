
const fetch = require('node-fetch'); // Assuming node-fetch is available or I can use native fetch in node 18+

async function testWeather() {
    // Test case 1: Vangani
    console.log("--- Testing Vangani ---");
    const locationName = "Vangani";
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(locationName)}&count=5&language=en&format=json`;

    try {
        const geoRes = await fetch(geoUrl);
        const geoData = await geoRes.json();
        console.log("Geocoding Results for 'Vangani':", JSON.stringify(geoData.results, null, 2));

        if (geoData.results && geoData.results.length > 0) {
            const { latitude, longitude, name, admin1, country } = geoData.results[0];
            console.log(`Using: ${name}, ${admin1}, ${country} (${latitude}, ${longitude})`);

            // Date: 2026-02-14
            const date = '2026-02-14';
            const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=cloud_cover&start_date=${date}&end_date=${date}&timezone=auto`;
            console.log("Fetching Weather:", weatherUrl);

            const weatherRes = await fetch(weatherUrl);
            const weatherData = await weatherRes.json();

            if (weatherData.hourly) {
                console.log("Hourly Cloud Cover (Local Time):");
                weatherData.hourly.time.forEach((t, i) => {
                    const hour = new Date(t).getHours(); // This might confirm if the returned string is ISO or local
                    // Actually, open-meteo returns local time ISO strings if timezone=auto
                    console.log(`${t}: ${weatherData.hourly.cloud_cover[i]}%`);
                });

                const nightHours = [20, 21, 22, 23];
                let avg = 0;
                let count = 0;
                nightHours.forEach(h => {
                    avg += weatherData.hourly.cloud_cover[h];
                    count++;
                });
                console.log(`Average Night Cloud Cover (20-23): ${avg / count}%`);

            } else {
                console.log("No hourly data");
            }
        }
    } catch (e) {
        console.error(e);
    }
}

testWeather();
