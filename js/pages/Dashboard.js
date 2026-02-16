import { AuthService } from '../services/auth.js';
import { DataService } from '../services/data.js';
import { getMoonPhase } from './HorizonCalendar.js';
import { CosmicBackground } from '../components/CosmicBackground.js';

export async function DashboardPage() {
    let user = AuthService.getCurrentUser();
    if (!user) return document.createComment('Redirecting...');

    // Attempt to refresh user data (roles, etc)
    const freshUser = await AuthService.refreshUser();
    if (freshUser) user = freshUser;

    const container = document.createElement('div');

    // Mount Cosmic Background to body instead of container
    const cosmicBg = CosmicBackground();
    document.body.appendChild(cosmicBg);

    // MutationObserver to detect when the dashboard is removed from DOM to cleanup Three.js
    const observer = new MutationObserver((mutations) => {
        if (!document.body.contains(container)) {
            if (cosmicBg.cleanup) cosmicBg.cleanup();
            if (cosmicBg.parentNode) cosmicBg.parentNode.removeChild(cosmicBg);
            observer.disconnect();
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    container.className = 'container fade-in';
    container.style.position = 'relative';
    container.style.zIndex = '1';
    container.style.background = 'transparent'; // Ensure background shows through
    container.style.paddingBottom = '80px';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.minHeight = 'calc(100vh - 120px)'; // Ensure it fills screen height minus header/nav

    // 1. Welcome Header
    const welcome = document.createElement('div');
    welcome.className = 'flex items-center justify-between';
    welcome.style.marginBottom = 'var(--spacing-md)'; // Reduced from lg
    welcome.innerHTML = `
        <div class="flex items-center" style="gap: 12px;">

             <div style="width: 42px; height: 42px; background: linear-gradient(135deg, var(--color-primary), var(--color-accent)); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.25rem; color: white; box-shadow: 0 4px 12px rgba(0,0,0,0.3);">
                ${user.name.charAt(0)}
            </div>
            <div>
                 <h1 style="font-size: 1.25rem; margin: 0; background: linear-gradient(to right, #fff, #aaa); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Hello, ${user.name.split(' ')[0]}</h1>
                 <p style="margin:2px 0 0 0; font-size: 0.8rem; color: var(--color-accent); text-transform: capitalize; font-weight: 500;">${user.currentRole}</p>
            </div>
        </div>
    `;
    container.appendChild(welcome);

    // 2. Main Grid (Moon + Forecast + Stats)
    const topGrid = document.createElement('div');
    topGrid.style.display = 'grid';
    topGrid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(350px, 1fr))';
    topGrid.style.gap = 'var(--spacing-md)';
    topGrid.style.marginBottom = '60px'; // Significantly larger gap

    // Widget: Moon Phase / Weather
    const moonWidget = await createWeatherWidget();
    topGrid.appendChild(moonWidget);

    // Widget: Role Specific High Priority
    if (user.currentRole === 'astronomer' || user.currentRole === 'stargazer') {
        const statusWidget = await createAstronomerStatusWidget(user);
        topGrid.appendChild(statusWidget);
    } else if (user.currentRole === 'manager') {
        const statsWidget = await createManagerStatsWidget();
        topGrid.appendChild(statsWidget);
    }

    container.appendChild(topGrid);

    // 3. Upcoming Events Feed (All Roles)
    const eventsSection = await createUpcomingEventsWidget();
    container.appendChild(eventsSection);

    // 4. Detailed Role Sections (Below fold)
    if (user.currentRole === 'astronomer' || user.currentRole === 'stargazer') {
        const nextRequest = await createAstronomerNextRequestWidget(user);
        if (nextRequest.innerHTML) { // Only append if there's content
            container.appendChild(nextRequest);
        }
    }

    // 5. Quote of the Day
    const quote = createDailyQuote();
    quote.style.marginTop = 'auto'; // Sticky footer behavior
    container.appendChild(quote);

    return container;
}

// --- Widgets ---

async function createWeatherWidget() {
    const card = document.createElement('div');
    card.className = 'card interactive weather-widget';
    card.style.background = 'linear-gradient(180deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.7) 100%)';
    card.style.border = '1px solid rgba(255,255,255,0.08)';
    card.style.padding = '16px'; // Enforce comfortable padding

    // Get precise moon phase for today
    const currentPhase = getMoonPhase(new Date());

    // Format date for India
    const indiaDate = new Date().toLocaleDateString("en-IN", {
        timeZone: "Asia/Kolkata",
        weekday: 'long',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });

    card.innerHTML = `
        <div class="flex justify-between items-center">
             <div>
                <h3 style="margin: 0; font-size: 0.9rem; color: var(--color-text-muted);">Moon Phase (India)</h3>
                <div style="font-size: 1.25rem; font-weight: 600; margin-top: 4px; color: var(--color-text-primary);">${currentPhase.name}</div>
                <div style="font-size: 0.8rem; color: var(--color-accent); margin-top: 2px;">Illumination: ${currentPhase.illumination}%</div>
                <div style="font-size: 0.7rem; color: var(--color-text-muted); margin-top: 2px;">${indiaDate}</div>
            </div>
            <div style="font-size: 3rem; text-shadow: 0 0 20px rgba(255,255,255,0.2); line-height: 1;">${currentPhase.icon}</div>
        </div>
    `;
    return card;
}

async function createUpcomingEventsWidget() {
    const section = document.createElement('div');
    section.style.marginBottom = 'var(--spacing-lg)';

    section.innerHTML = `
        <div class="flex justify-between items-center" style="margin-bottom: 24px;">
            <h3 style="margin: 0; font-size: 1.1rem;">Upcoming Events</h3>
            <button class="btn btn-text" onclick="window.location.hash='#/calendar'" style="font-size: 0.8rem;">View Calendar →</button>
        </div>
    `;

    const grid = document.createElement('div');
    grid.style.display = 'grid';
    grid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(300px, 1fr))';
    grid.style.gap = 'var(--spacing-md)';

    try {
        const user = AuthService.getCurrentUser();
        let events = [];
        if (user.currentRole === 'manager') {
            events = await DataService.getEvents();
        } else {
            events = await DataService.getAcceptedEvents(user.id);
        }

        const now = new Date();
        now.setHours(0, 0, 0, 0);

        const upcoming = events
            .filter(e => new Date(e.date) >= now)
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .slice(0, 3); // Top 3

        if (upcoming.length === 0) {
            grid.innerHTML = `<div class="card" style="grid-column: 1 / -1; color: var(--color-text-muted); font-size: 0.9rem; padding: 12px;">No upcoming events scheduled.</div>`;
        } else {
            for (const evt of upcoming) {
                const card = document.createElement('div');
                card.className = 'card interactive';
                card.style.position = 'relative';
                card.style.padding = '12px 16px'; // slightly tighter padding

                // Add hover expansion effect
                card.style.transition = 'transform 0.2s ease';
                card.onmouseover = () => { card.style.transform = 'scale(1.01)'; };
                card.onmouseout = () => { card.style.transform = 'scale(1)'; };

                card.onclick = (e) => {
                    // Navigate to Calendar Day View for this specific event
                    window.location.hash = `#/calendar?date=${evt.date}&eventId=${evt.id}`;
                };

                // Date formatting
                const d = new Date(evt.date);
                const dateStr = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

                card.innerHTML = `
                    <div class="flex justify-between items-center">
                        <div style="flex: 1; padding-right: 8px;">
                            <div style="font-weight: 600; font-size: 1rem; margin-bottom: 4px; color: var(--color-primary);">${evt.title}</div>
                            <div style="font-size: 0.85rem; margin-bottom: 2px;">📅 ${dateStr} • ${evt.time}</div>
                            <div style="font-size: 0.85rem; color: var(--color-text-secondary); margin-bottom: 0;">📍 ${evt.location.split(',')[0]}</div>
                        </div>
                        <div class="weather-badge" style="flex-shrink: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; width: 80px; height: 80px; text-align: center; padding: 4px; border-radius: 16px; gap: 2px;">
                            <div style="font-size: 0.7rem;">Loading...</div>
                        </div>
                    </div>
                `;
                grid.appendChild(card);

                // Pass the specific element directly since it's not in the document yet
                const badge = card.querySelector('.weather-badge');
                fetchWeatherForEvent(evt, badge);
            }
        }
    } catch (e) {
        grid.innerHTML = `<div style="color:red">Error loading events</div>`;
    }

    section.appendChild(grid);
    return section;
}

async function fetchWeatherForEvent(event, badge) {
    if (!badge) return;

    try {
        // 1. Check Date Horizon
        const eventDate = new Date(event.date); // Local midnight of the date string
        const today = new Date();
        const diffTime = eventDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays > 14) {
            badge.style.display = 'none';
            return;
        }
        if (diffDays < 0) {
            badge.style.display = 'none';
            return;
        }

        // 2. Geocoding (Nominatim)
        // Use the first part of the location for broader search if exact address fails, 
        // but Nominatim handles full addresses well. Let's stick to first part to match previous logic for now.
        const locationName = event.location.split(',')[0].trim();
        const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(locationName)}&format=json&limit=1`);
        const geoData = await geoRes.json();

        if (!geoData || geoData.length === 0) {
            badge.style.display = 'none';
            return;
        }

        const latitude = geoData[0].lat;
        const longitude = geoData[0].lon;

        // 3. Weather Fetch
        // Fetch event date AND the next day to cover late night/early morning hours
        // Format: YYYY-MM-DD
        const startDateStr = event.date;
        const nextDate = new Date(eventDate);
        nextDate.setDate(nextDate.getDate() + 1);
        const endDateStr = nextDate.toISOString().split('T')[0];

        const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=cloud_cover&start_date=${startDateStr}&end_date=${endDateStr}&timezone=auto`);
        const weatherData = await weatherRes.json();

        if (!weatherData.hourly || !weatherData.hourly.cloud_cover) {
            throw new Error('No weather data');
        }

        // 4. Determine Best Viewing Conditions (Minimum Cloud Cover in Night Window)
        // Window: 21:00 (9 PM) to 03:00 (3 AM next day)
        // We need to map these hours to the index in the hourly array.
        // Array starts at 00:00 of startDate.

        // Indices:
        // 21:00 Day 1 = Index 21
        // ...
        // 00:00 Day 2 = Index 24
        // ...
        // 03:00 Day 2 = Index 27

        const targetIndices = [21, 22, 23, 24, 25, 26, 27];
        let nightClouds = [];

        targetIndices.forEach(idx => {
            if (weatherData.hourly.cloud_cover[idx] !== undefined) {
                nightClouds.push(weatherData.hourly.cloud_cover[idx]);
            }
        });

        let cloudCover = 0;
        if (nightClouds.length > 0) {
            // Use Minimum to show "Best Case" for stargazing
            cloudCover = Math.min(...nightClouds);
        } else {
            cloudCover = weatherData.hourly.cloud_cover[21] || 0;
        }

        // 5. Update Badge
        let emoji = '😐';
        if (cloudCover <= 20) {
            emoji = '🤩'; // Excellent for stars
        } else if (cloudCover <= 50) {
            emoji = '🙂'; // Good
        } else if (cloudCover <= 80) {
            emoji = '😟'; // Poor
        } else {
            emoji = '😭'; // Terrible
        }

        badge.innerHTML = `
            <div style="font-size: 1.6rem; line-height: 1;">☁️</div>
            <div style="font-size: 0.95rem; font-weight: 700; line-height: 1;">${Math.round(cloudCover)}%</div>
            <div style="font-size: 1.2rem; line-height: 1;">${emoji}</div>
        `;

        // Update color
        badge.className = 'weather-badge'; // Reset
        if (cloudCover <= 10) {
            badge.classList.add('weather-good');
        } else if (cloudCover <= 30) {
            // Let's be stricter with colors as user wants "Clear" to be highlighted
            badge.classList.add('weather-good');
        } else if (cloudCover <= 60) {
            badge.classList.add('weather-fair');
        } else {
            badge.classList.add('weather-poor');
        }

        // Update Label
        // If it's very low, maybe say "Clear" instead of "Cloud Cover"? 
        // User asked for "Cloud Cover icon with percentage".
        // I will keep the format but ensure the number is the optimistic one.

    } catch (e) {
        console.error('Weather fetch error:', e);
        badge.style.display = 'none';
    }
}

function createDailyQuote() {
    const quotes = [
        { text: "The universe is under no obligation to make sense to you.", author: "Neil deGrasse Tyson" },
        { text: "Somewhere, something incredible is waiting to be known.", author: "Carl Sagan" },
        { text: "For my part I know nothing with any certainty, but the sight of the stars makes me dream.", author: "Vincent van Gogh" },
        { text: "Equipped with his five senses, man explores the universe around him and calls the adventure Science.", author: "Edwin Hubble" },
        { text: "Astronomy compels the soul to look upwards and leads us from this world to another.", author: "Plato" }
    ];

    // Pick based on day of year to change daily
    const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
    const quote = quotes[dayOfYear % quotes.length];

    const el = document.createElement('div');
    el.className = 'card';
    el.style.marginTop = 'var(--spacing-xl)';
    el.style.textAlign = 'center';
    el.style.border = 'none';
    el.style.background = 'var(--color-bg-secondary)'; // darker
    el.innerHTML = `
        <div style="font-size: 1.1rem; font-style: italic; margin-bottom: 8px; font-family: 'Georgia', serif;">"${quote.text}"</div>
        <div style="font-size: 0.9rem; color: var(--color-accent);">— ${quote.author}</div>
    `;
    return el;
}

// --- Role Specific Helper Widgets ---

async function createAstronomerStatusWidget(user) {
    const card = document.createElement('div');
    card.className = 'card';

    const today = new Date().toISOString().split('T')[0];
    let todayStatus = 'unknown';
    try {
        const availMap = await DataService.getAvailabilityMap(user.id);
        todayStatus = availMap[today] || 'unknown';
    } catch (e) { }

    let statusText = 'Not Set';
    let statusColor = 'var(--color-text-muted)';
    if (todayStatus === 'available') { statusText = 'Available'; statusColor = 'var(--color-status-success)'; }
    if (todayStatus === 'maybe') { statusText = 'Maybe'; statusColor = 'var(--color-status-warning)'; }
    if (todayStatus === 'unavailable') { statusText = 'Unavailable'; statusColor = 'var(--color-status-danger)'; }

    card.innerHTML = `
            <h3 style="margin:0 0 12px 0; font-size: 1rem; color: var(--color-text-muted);">Today's Availability</h3>
                <div class="flex justify-between items-center">
            <div class="flex items-center" style="gap: 8px;">
                 <div style="width: 12px; height: 12px; border-radius: 50%; background: ${statusColor}; box-shadow: 0 0 8px ${statusColor};"></div>
                 <span style="font-weight: 600; font-size: 1.1rem;">${statusText}</span>
            </div>
            <button class="btn btn-sm btn-secondary" onclick="window.location.hash='#/availability'">Update</button>
        </div>
            `;
    return card;
}

async function createManagerStatsWidget() {
    const card = document.createElement('div');
    card.className = 'card';

    let pendingEvents = 0;
    try {
        const events = await DataService.getEvents();
        pendingEvents = events.filter(e => e.status === 'Pending').length;
        // Note: Assuming 'status' field exists or inferred. If not, maybe check requests.
        // Let's use Requests instead for accuracy if Event status isn't robust.
        // Actually, let's just count total events for now as "Active"
        pendingEvents = events.length;
    } catch (e) { }

    card.innerHTML = `
        <h3 style="margin:0 0 12px 0; font-size: 1rem; color: var(--color-text-muted);">Platform Overview</h3>
        <div class="flex justify-between items-end">
            <div>
                <div style="font-size: 2rem; font-weight: 700; color: var(--color-primary); line-height: 1;">${pendingEvents}</div>
                <div style="font-size: 0.8rem; color: var(--color-text-secondary); margin-top: 4px;">Total Scheduled Events</div>
            </div>
            <button class="btn btn-sm btn-primary" onclick="window.location.hash='#/create-event'">+ New Event</button>
        </div>
    `;
    return card;
}

async function createAstronomerNextRequestWidget(user) {
    const card = document.createElement('div');
    card.style.marginBottom = 'var(--spacing-lg)';

    try {
        const pending = await DataService.getRequestsForUser(user.id);
        if (pending.length > 0) {
            const req = pending[0];
            card.className = 'card';
            card.style.borderLeft = '4px solid var(--color-accent)';
            card.innerHTML = `
                <h3 style="margin:0 0 12px 0; font-size: 1rem;">Next Assignment Request</h3>
                <div style="font-weight: 600; font-size: 1.1rem; margin-bottom: 4px;">${req.title}</div>
                 <div style="color: var(--color-text-secondary); font-size: 0.9rem;">${req.date} • ${req.time}</div>
                 <div style="margin-top: 12px;">
                    <button class="btn btn-primary w-full" onclick="window.location.hash='#/requests'">Manage Requests</button>
                 </div>
        `;
        }
    } catch (e) { }

    return card;
}


