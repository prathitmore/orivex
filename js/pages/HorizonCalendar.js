
import { DataService } from '../services/data.js';
import { AuthService } from '../services/auth.js';

export async function HorizonCalendarPage() {
    const container = document.createElement('div');
    container.className = 'container fade-in';
    const currentUser = AuthService.getCurrentUser();

    container.innerHTML = `
        <h2 style="margin-bottom: var(--spacing-lg);">Horizon Calendar</h2>
    `;

    // Inject Styles for Responsive Calendar
    const style = document.createElement('style');
    style.textContent = `
        .calendar-wrapper {
            width: 100%;
            margin: 0 auto;
        }
        .calendar-weekdays {
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            gap: 4px;
            text-align: center;
            font-size: 0.75rem;
            margin-bottom: 8px;
            color: var(--color-text-muted);
        }
        .calendar-grid {
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            gap: 4px;
        }
        .calendar-day {
            background: var(--color-bg-secondary);
            border-radius: var(--radius-sm);
            cursor: pointer;
            position: relative;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            border: 1px solid transparent; /* transparent border by default */
            transition: all 0.2s ease;
        }
        .calendar-day:hover {
            transform: translateY(-2px);
            background: var(--color-bg-tertiary);
            border-color: rgba(255,255,255,0.1);
        }
        
        /* Mobile Styles (Default) */
        .calendar-day {
            height: 60px; /* Slightly taller than 50px for better aesthetic */
            padding: 4px;
            align-items: center;
            justify-content: flex-start;
        }
        .day-number {
            font-size: 0.8rem;
            font-weight: bold;
            margin-bottom: 2px;
            color: var(--color-text-primary);
        }
        .moon-phaser {
            margin-top: auto;
            text-align: center;
            line-height: 1;
        }
        .moon-icon {
            font-size: 1rem;
        }
        .moon-text {
            font-size: 0.6rem;
            color: var(--color-text-muted);
            display: none; /* Hide text on very small screens if needed, or keep */
        }

        /* Desktop Styles */
        @media (min-width: 768px) {
            .calendar-wrapper {
                max-width: 900px;
                padding: 0 20px;
            }
            .calendar-grid {
                gap: 12px;
            }
            .calendar-day {
                height: 120px;
                padding: 10px;
                align-items: flex-start;
            }
            .day-number {
                font-size: 1.1rem;
                margin-bottom: 8px;
            }
            .moon-phaser {
                width: 100%;
                display: flex;
                flex-direction: row;
                align-items: center;
                justify-content: space-between;
                position: absolute;
                bottom: 8px;
                left: 0;
                padding: 0 10px;
            }
            .moon-icon {
                font-size: 1.5rem;
            }
            .moon-text {
                font-size: 0.75rem;
                display: block;
            }
        }
    `;
    container.appendChild(style);

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
            // Re-inject title and clear content but keep style
            // Actually, better to just clear calendarEl
            calendarEl.innerHTML = '';

            // We need to ensure container still has the style and title if we wiped it? 
            // The logic below recreates structure inside `calendarEl` or `container`. 
            // Let's stick to the previous pattern: renderApp clears and rebuilds mainly the content part.

            const content = document.createElement('div');
            calendarEl.appendChild(content);

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
                const isAssigned = evt.assigned.includes(currentUser.id);
                const canView = currentUser.roles.includes('manager') || isAssigned;

                if (!canView) return;

                const eventCard = document.createElement('div');
                eventCard.className = 'card interactive';
                eventCard.style.borderLeft = '4px solid var(--color-accent)';
                eventCard.style.cursor = 'pointer';

                const assignedNames = evt.assigned.map(uid => {
                    const u = allUsers.find(user => user.id === uid);
                    return u ? u.name : 'Unknown';
                }).join(', ');

                let isExpanded = (selectedEventId === evt.id);

                const renderContent = async () => {
                    const moon = getMoonPhase(new Date(evt.date));

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
                                    renderApp();
                                }
                            };
                        }
                    }
                };

                renderContent();

                eventCard.onclick = () => {
                    isExpanded = !isExpanded;
                    renderContent();
                    if (isExpanded) {
                        selectedEventId = evt.id;
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
        <div class="calendar-wrapper">
            <div class="flex justify-between items-center" style="margin-bottom: var(--spacing-md);">
                <button id="prev-month" class="btn btn-secondary">&lt;</button>
                <h3>${monthNames[month]} ${year}</h3>
                <button id="next-month" class="btn btn-secondary">&gt;</button>
            </div>
            
            <div class="calendar-weekdays">
                <div>S</div><div>M</div><div>T</div><div>W</div><div>T</div><div>F</div><div>S</div>
            </div>
            
            <div id="days-grid" class="calendar-grid"></div>
        </div>
    `;

    container.querySelector('#prev-month').onclick = () => onNav(-1);
    container.querySelector('#next-month').onclick = () => onNav(1);

    const daysGrid = container.querySelector('#days-grid');
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Empty slots
    for (let i = 0; i < firstDay; i++) {
        const empty = document.createElement('div');
        empty.style.background = 'transparent';
        daysGrid.appendChild(empty);
    }

    // Days
    for (let i = 1; i <= daysInMonth; i++) {
        const dayBtn = document.createElement('div');
        dayBtn.className = 'calendar-day';

        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        const dayEvents = events.filter(e => e.date === dateStr);
        const currentDayDate = new Date(date.getFullYear(), date.getMonth(), i);
        const moon = getMoonPhase(currentDayDate);

        let contentHTML = `<div class="day-number">${i}</div>`;

        if (dayEvents.length > 0) {
            // Event Indicator
            const dot = `<div style="width: 8px; height: 8px; border-radius: 50%; background: var(--color-accent); margin-top: 4px; box-shadow: 0 0 4px var(--color-accent);"></div>`;
            contentHTML += dot;
            dayBtn.style.border = '1px solid var(--color-accent)';
        }

        // Moon Phase
        contentHTML += `
            <div class="moon-phaser">
                 <div class="moon-icon">${moon.icon}</div>
                 <div class="moon-text">${moon.illumination}%</div>
            </div>
        `;

        dayBtn.innerHTML = contentHTML;
        dayBtn.onclick = () => onDayClick(dateStr);
        daysGrid.appendChild(dayBtn);
    }
}

export function getMoonPhase(inputDate) {
    const date = new Date(inputDate);
    date.setHours(20, 0, 0, 0);

    const rad = Math.PI / 180;
    const t = (date.getTime() / 86400000) - 10957.5;

    const L = (218.316 + 13.176396 * t) * rad;
    const M = (134.963 + 13.064993 * t) * rad;
    const F = (93.272 + 13.229350 * t) * rad;

    const l = L + rad * 6.289 * Math.sin(M);
    const b = rad * 5.128 * Math.sin(F);

    const M_sun = (357.529 + 0.98560028 * t) * rad;
    const lambda_sun = (280.466 + 0.98564736 * t) * rad + rad * 1.915 * Math.sin(M_sun) + rad * 0.020 * Math.sin(2 * M_sun);

    const psi = Math.acos(Math.cos(b) * Math.cos(l - lambda_sun));
    const illumination = Math.round((1 - Math.cos(psi)) / 2 * 100);

    let angle = l - lambda_sun;
    while (angle < 0) angle += 2 * Math.PI;
    while (angle > 2 * Math.PI) angle -= 2 * Math.PI;

    const index = Math.round(angle / (Math.PI / 4)) % 8;

    const icons = ['🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘'];
    const names = ['New Moon', 'Waxing Crescent', 'First Quarter', 'Waxing Gibbous', 'Full Moon', 'Waning Gibbous', 'Last Quarter', 'Waning Crescent'];

    return {
        icon: icons[index],
        name: names[index],
        illumination: illumination
    };
}
