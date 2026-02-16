
import { DataService } from '../services/data.js';
import { AuthService } from '../services/auth.js';

export async function HorizonCalendarPage() {
    const container = document.createElement('div');
    container.className = 'container fade-in';
    const currentUser = AuthService.getCurrentUser();

    container.innerHTML = `
        <h2 style="margin-bottom: var(--spacing-lg);">Horizon Calendar</h2>
    `;

    const calendarEl = document.createElement('div');
    container.appendChild(calendarEl);

    // State
    let currentDate = new Date();
    let selectedDate = null;
    let selectedEventId = null;
    let allUsers = [];

    // Check for query param
    const hashParts = window.location.hash.split('?');
    if (hashParts.length > 1) {
        const params = new URLSearchParams(hashParts[1]);
        const dateParam = params.get('date');
        const evtIdParam = params.get('eventId');
        if (dateParam) {
            selectedDate = dateParam;
            // Also update current date to that month so if they go back, they see that month
            currentDate = new Date(dateParam);
        }
        if (evtIdParam) {
            selectedEventId = evtIdParam;
        }
    }

    // Initial Data Load
    try {
        const [events, users] = await Promise.all([
            DataService.getEvents(),
            DataService.getUsers()
        ]);
        allUsers = users;

        // Render Initial
        renderApp();

        function renderApp() {
            container.innerHTML = `
                 <h2 style="margin-bottom: var(--spacing-lg);">Horizon Calendar</h2>
            `;
            const content = document.createElement('div');
            container.appendChild(content);

            if (selectedDate) {
                renderDayView(content);
            } else {
                renderCalendarView(content);
            }
        }

        function renderCalendarView(target) {
            renderCalendar(currentDate, target, events, (offset) => {
                currentDate.setMonth(currentDate.getMonth() + offset);
                renderApp();
            }, (dateStr, evtId = null) => {
                selectedDate = dateStr;
                selectedEventId = evtId;
                renderApp();
            });
        }

        function renderDayView(target) {
            let dayEvents = events.filter(e => e.date === selectedDate);

            // Filter if specific event selected via pill click
            if (selectedEventId) {
                const specificEvent = dayEvents.filter(e => String(e.id) === String(selectedEventId));
                // Only apply filter if we found the event (prevents blank screen on bad ID)
                if (specificEvent.length > 0) {
                    dayEvents = specificEvent;
                }
            }

            target.innerHTML = `
                <div class="fade-in">
                    <button id="back-cal" class="btn btn-secondary" style="margin-bottom: var(--spacing-md);">← Back to Month</button>
                    <h3 style="margin-bottom: var(--spacing-md); font-size: 1.5rem;">${selectedDate}</h3>
                    <div id="day-events-list" class="flex flex-col" style="gap: var(--spacing-md);"></div>
                </div>
            `;

            target.querySelector('#back-cal').onclick = () => {
                selectedDate = null;
                selectedEventId = null;
                renderApp();
            };

            const list = target.querySelector('#day-events-list');

            if (dayEvents.length === 0) {
                list.innerHTML = '<p class="text-muted">No events scheduled.</p>';
                return;
            }

            dayEvents.forEach(evt => {
                // Check visibility
                const isAssigned = evt.assigned.includes(currentUser.id);
                const canView = currentUser.roles.includes('manager') || isAssigned;

                if (!canView) return;

                const eventCard = document.createElement('div');
                eventCard.className = 'card interactive'; // interactive for hover
                eventCard.style.borderLeft = '4px solid var(--color-accent)';
                eventCard.style.cursor = 'pointer';

                // Map assigned IDs to Names
                const assignedNames = evt.assigned.map(uid => {
                    const u = allUsers.find(user => user.id === uid);
                    return u ? u.name : 'Unknown';
                }).join(', ');

                // Check expansion state
                let isExpanded = (selectedEventId === evt.id);
                // If no specific event selected, maybe expand all? Or collapse all? Let's collapse all by default unless one targeted.

                // Helper to render content
                const renderContent = async () => {
                    // Check moon phase for this event
                    const moon = getMoonPhase(new Date(evt.date));

                    const eventDate = new Date(evt.date);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const isPast = eventDate < today;

                    eventCard.innerHTML = `
                        <div class="flex justify-between items-start">
                            <div style="flex: 1;">
                                <h4 style="margin: 0 0 4px 0; font-size: 1.25rem;">${evt.title}</h4>
                                <div style="color: var(--color-text-secondary); margin-bottom: ${isExpanded ? '12px' : '0'};">
                                    🕒 ${evt.time} &nbsp;|&nbsp; 📍 ${evt.location}
                                </div>
                                
                                <div class="details-section" style="display: ${isExpanded ? 'block' : 'none'}; margin-top: 12px; animation: fadeIn 0.3s ease;">
                                    <div style="background: rgba(255,255,255,0.05); padding: 12px; border-radius: var(--radius-sm); margin-bottom: 12px;">
                                        <div style="font-size: 0.85rem; color: var(--color-text-muted); margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px;">Astronomers</div>
                                        <div style="color: var(--color-text-primary);">${assignedNames || 'None assigned'}</div>
                                    </div>

                                    <div style="background: rgba(255,255,255,0.05); padding: 12px; border-radius: var(--radius-sm); margin-bottom: 12px; display: flex; align-items: center; gap: 12px;">
                                        <div style="font-size: 1.5rem;">${moon.icon}</div>
                                        <div>
                                            <div style="font-size: 0.85rem; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.5px;">Moon Phase</div>
                                            <div style="color: var(--color-text-primary);">${moon.name} (${moon.illumination}%)</div>
                                        </div>
                                    </div>
                                    
                                     ${currentUser.roles.includes('manager') ? `
                                        <div style="text-align: right; margin-bottom: 12px;">
                                            <button class="btn btn-secondary-danger delete-evt-btn">Cancel Event</button>
                                        </div>
                                    ` : ''}


                                </div>
                            </div>
                            <div style="margin-left: 12px; color: var(--color-text-muted); transform: rotate(${isExpanded ? '180deg' : '0deg'}); transition: transform 0.2s;">▼</div>
                        </div>
                    `;

                    // Re-attach delete listener if rendered
                    if (isExpanded && currentUser.roles.includes('manager')) {
                        const delBtn = eventCard.querySelector('.delete-evt-btn');
                        if (delBtn) {
                            delBtn.onclick = async (e) => {
                                e.stopPropagation();
                                if (confirm('Are you sure you want to cancel this event?')) {
                                    await DataService.deleteEvent(evt.id);
                                    const idx = events.findIndex(e => e.id === evt.id);
                                    if (idx > -1) events.splice(idx, 1);
                                    if (selectedEventId === evt.id) selectedEventId = null;
                                    renderApp(); // Refresh
                                }
                            };
                        }
                    }
                };

                renderContent();

                eventCard.onclick = () => {
                    isExpanded = !isExpanded;
                    renderContent();
                    // If expanding, maybe close others?
                    // Optional: close others logic here if we had access to other cards, 
                    // but simple toggle is often better for comparison.
                    if (isExpanded) {
                        selectedEventId = evt.id; // update state
                    } else {
                        if (selectedEventId === evt.id) selectedEventId = null;
                    }
                };

                list.appendChild(eventCard);
            });
        }

    } catch (e) {
        console.error(e);
        container.innerHTML = '<p>Error loading data.</p>';
    }

    return container;
}

function renderCalendar(date, container, events, onNav, onDayClick) {
    const month = date.getMonth();
    const year = date.getFullYear();
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    container.innerHTML = `
        <div class="flex justify-between items-center" style="margin-bottom: var(--spacing-md);">
            <button id="prev-month" class="btn btn-secondary">&lt;</button>
            <h3>${monthNames[month]} ${year}</h3>
            <button id="next-month" class="btn btn-secondary">&gt;</button>
        </div>
        <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; text-align: center; font-size: 0.7rem; margin-bottom: 8px; color: var(--color-text-muted);">
            <div>S</div><div>M</div><div>T</div><div>W</div><div>T</div><div>F</div><div>S</div>
        </div>
        <div id="days-grid" style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px;"></div>
    `;

    container.querySelector('#prev-month').onclick = () => onNav(-1);
    container.querySelector('#next-month').onclick = () => onNav(1);

    const daysGrid = container.querySelector('#days-grid');
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Empty slots
    for (let i = 0; i < firstDay; i++) {
        daysGrid.appendChild(document.createElement('div'));
    }

    // Days
    for (let i = 1; i <= daysInMonth; i++) {
        const dayBtn = document.createElement('button');
        dayBtn.className = 'card';
        dayBtn.style.padding = '4px';
        dayBtn.style.height = '60px'; // Slightly taller to fit content comfortably
        dayBtn.style.minHeight = 'auto';
        dayBtn.style.display = 'flex';
        dayBtn.style.flexDirection = 'column';
        dayBtn.style.alignItems = 'center';
        dayBtn.style.justifyContent = 'space-between'; // Distribute space
        dayBtn.style.textAlign = 'center';
        dayBtn.style.cursor = 'pointer';
        dayBtn.style.position = 'relative';

        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;

        // Check for events on this day
        const dayEvents = events.filter(e => e.date === dateStr);

        let content = `<span style="font-weight: bold; font-size: 0.8rem; color: var(--color-text-primary); margin-bottom: 2px;">${i}</span>`;

        if (dayEvents.length > 0) {
            // Logic: Show Event Dots (hide Moon)
            // Container for dots
            let dotsHtml = `<div style="display: flex; gap: 3px; margin-bottom: 4px; flex-wrap: wrap; justify-content: center;">`;
            // Limit dots to avoid overflow (e.g., max 4)
            const displayCount = Math.min(dayEvents.length, 4);
            for (let k = 0; k < displayCount; k++) {
                dotsHtml += `<div style="width: 6px; height: 6px; border-radius: 50%; background: var(--color-accent);"></div>`;
            }
            if (dayEvents.length > 4) {
                dotsHtml += `<div style="width: 4px; height: 4px; border-radius: 50%; background: var(--color-text-muted); align-self: center;"></div>`;
            }
            dotsHtml += `</div>`;

            content += dotsHtml;
            dayBtn.style.borderColor = 'var(--color-accent)';
        } else {
            // Logic: Show Moon Phase (when no events)
            const currentDayDate = new Date(date.getFullYear(), date.getMonth(), i);
            const moon = getMoonPhase(currentDayDate);

            content += `
                <div style="margin-top: auto; display: flex; flex-direction: column; align-items: center; line-height: 1;">
                    <div style="font-size: 1rem;">${moon.icon}</div>
                    <div style="font-size: 0.6rem; color: var(--color-text-muted); margin-top: 2px;">${moon.illumination}%</div>
                </div>
            `;
        }

        dayBtn.innerHTML = content;
        dayBtn.onclick = () => onDayClick(dateStr);

        daysGrid.appendChild(dayBtn);
    }
}

export function getMoonPhase(inputDate) {
    // Clone and set time to 20:00 (8 PM) for "Stargazing" context
    const date = new Date(inputDate);
    date.setHours(20, 0, 0, 0);

    const rad = Math.PI / 180;

    // Days since J2000
    // J2000 = 2451545.0
    // Unix Epoch = 2440587.5
    // Diff = 10957.5 days
    const t = (date.getTime() / 86400000) - 10957.5;

    // Geocentric coordinates of the Moon (Simplified)
    // Mean Longitude (L)
    const L = (218.316 + 13.176396 * t) * rad;
    // Mean Anomaly (M)
    const M = (134.963 + 13.064993 * t) * rad;
    // Mean Distance (F)
    const F = (93.272 + 13.229350 * t) * rad;

    // Ecliptic Longitude (l) with major perturbations
    // +6.289 * sin(M) is the Equation of Center
    const l = L + rad * 6.289 * Math.sin(M);
    // Ecliptic Latitude (b)
    const b = rad * 5.128 * Math.sin(F);

    // Sun coordinates
    // Mean Anomaly of Sun (M_sun)
    const M_sun = (357.529 + 0.98560028 * t) * rad;
    // Ecliptic Longitude of Sun (lambda_sun)
    // +1.915 * sin(M_sun) is Equation of Center for Sun
    const lambda_sun = (280.466 + 0.98564736 * t) * rad + rad * 1.915 * Math.sin(M_sun) + rad * 0.020 * Math.sin(2 * M_sun);

    // Elongation (psi) - Angular distance between Moon and Sun
    const psi = Math.acos(Math.cos(b) * Math.cos(l - lambda_sun));

    // Illumination fraction k
    // k = (1 + cos(phase_angle)) / 2
    // phase_angle is approximately 180 - psi
    // So k approx (1 - cos(psi)) / 2
    const illumination = Math.round((1 - Math.cos(psi)) / 2 * 100);

    // Determine Phase Index (Waxing vs Waning)
    // Based on relative angle
    let angle = l - lambda_sun;
    // Normalize to 0-2PI
    while (angle < 0) angle += 2 * Math.PI;
    while (angle > 2 * Math.PI) angle -= 2 * Math.PI;

    // Map angle to 8 segments
    // 0 = New, PI/4 = Waxing Crescent, etc.
    // Round to nearest 45 degrees (PI/4)
    const index = Math.round(angle / (Math.PI / 4)) % 8;

    const icons = ['🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘'];
    const names = ['New Moon', 'Waxing Crescent', 'First Quarter', 'Waxing Gibbous', 'Full Moon', 'Waning Gibbous', 'Last Quarter', 'Waning Crescent'];

    return {
        icon: icons[index],
        name: names[index],
        illumination: illumination
    };
}
