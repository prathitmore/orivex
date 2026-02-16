
import { DataService } from '../services/data.js';

export async function CreateEventPage() {
    const container = document.createElement('div');
    container.className = 'container fade-in';

    container.innerHTML = `
        <div class="flex items-center" style="margin-bottom: var(--spacing-lg);">
            <button onclick="window.history.back()" style="background:none; color: var(--color-text-primary); font-size: 1.5rem; margin-right: var(--spacing-md);">←</button>
            <h2 style="margin: 0;">Create Event</h2>
        </div>
        
        <form id="create-event-form" class="flex flex-col" style="gap: var(--spacing-lg);">
            <div>
                <label style="display: block; margin-bottom: var(--spacing-xs); color: var(--color-text-secondary); font-size: 0.9rem;">Event Name</label>
                <input type="text" name="title" class="input" placeholder="e.g. Stargazing Night" required>
            </div>

            <div class="flex" style="gap: var(--spacing-md);">
                <div class="w-full">
                    <label style="display: block; margin-bottom: var(--spacing-xs); color: var(--color-text-secondary); font-size: 0.9rem;">Date</label>
                    <input type="date" name="date" id="event-date" class="input" style="color-scheme: dark;" required min="${new Date().toISOString().split('T')[0]}">
                </div>
                <div class="w-full">
                    <label style="display: block; margin-bottom: var(--spacing-xs); color: var(--color-text-secondary); font-size: 0.9rem;">Time</label>
                    <input type="time" name="time" class="input" style="color-scheme: dark;" required>
                </div>
            </div>

             <div>
                <label style="display: block; margin-bottom: var(--spacing-xs); color: var(--color-text-secondary); font-size: 0.9rem;">Location</label>
                <select name="location" id="event-location" class="input">
                    <option value="" disabled selected>Loading locations...</option>
                </select>
            </div>

            <div>
                <label style="display: block; margin-bottom: var(--spacing-xs); color: var(--color-text-secondary); font-size: 0.9rem;">Select Astronomers</label>
                <div id="astronomer-list" style="background: var(--color-bg-tertiary); padding: var(--spacing-md); border-radius: var(--radius-md); max-height: 200px; overflow-y: auto;">
                    <p style="color: var(--color-text-muted); text-align: center;">Loading...</p>
                </div>
            </div>

            <button type="submit" class="btn btn-primary w-full" style="margin-top: var(--spacing-md);">Create Event & Send Requests</button>
        </form>
    `;

    // Fetch users and availability
    try {
        const users = await DataService.getUsers();
        // Filter those who have 'astronomer' role (check if roles array includes it)
        const astronomers = users.filter(u => u.roles.includes('astronomer'));

        // Fetch ALL availability to check status locally
        const allAvailability = await DataService.getAllAvailability();
        const locations = await DataService.getLocations();

        const locSelect = container.querySelector('#event-location');
        locSelect.innerHTML = '';
        if (locations.length === 0) {
            const opt = document.createElement('option');
            opt.text = "No locations found (Add in Profile)";
            locSelect.appendChild(opt);
        } else {
            locations.forEach(loc => {
                const opt = document.createElement('option');
                opt.value = loc.name;
                opt.text = loc.name;
                locSelect.appendChild(opt);
            });
        }

        const listContainer = container.querySelector('#astronomer-list');
        const dateInput = container.querySelector('#event-date');

        const renderList = (selectedDate) => {
            listContainer.innerHTML = '';

            if (astronomers.length === 0) {
                listContainer.innerHTML = '<p style="color: var(--color-text-muted); font-size: 0.9rem;">No astronomers found.</p>';
            } else {
                if (allAvailability.length === 0) {
                    const warn = document.createElement('div');
                    warn.style.color = 'var(--color-status-warning)';
                    warn.style.fontSize = '0.8rem';
                    warn.style.textAlign = 'center';
                    warn.style.marginBottom = '8px';
                    warn.innerText = "Warning: No availability data loaded.";
                    listContainer.appendChild(warn);
                }

                astronomers.forEach(u => {
                    // Check availability for this date
                    let status = 'unknown';
                    if (selectedDate) {
                        // Strict check
                        const entry = allAvailability.find(a =>
                            String(a.user_id) === String(u.id) &&
                            String(a.date) === String(selectedDate)
                        );
                        if (entry) status = String(entry.status).toLowerCase();
                    }

                    let statusDot = `<span style="width: 8px; height: 8px; border-radius: 50%; background: var(--color-text-muted); display:inline-block;"></span>`;
                    let statusLabel = "";

                    if (status === 'available') {
                        statusDot = `<span style="width: 8px; height: 8px; border-radius: 50%; background: var(--color-status-success); display:inline-block;"></span>`;
                        statusLabel = `<span style="font-size: 0.75rem; color: var(--color-status-success); margin-left: 4px;">Available</span>`;
                    } else if (status === 'maybe') {
                        statusDot = `<span style="width: 8px; height: 8px; border-radius: 50%; background: var(--color-status-warning); display:inline-block;"></span>`;
                        statusLabel = `<span style="font-size: 0.75rem; color: var(--color-status-warning); margin-left: 4px;">Maybe</span>`;
                    } else if (status === 'unavailable' || status === 'busy') {
                        statusDot = `<span style="width: 8px; height: 8px; border-radius: 50%; background: var(--color-status-danger); display:inline-block;"></span>`;
                        statusLabel = `<span style="font-size: 0.75rem; color: var(--color-status-danger); margin-left: 4px;">Busy</span>`;
                    }

                    const label = document.createElement('label');
                    label.className = 'flex items-center';
                    label.style.padding = '8px 0';
                    label.style.cursor = 'pointer';
                    label.style.borderBottom = '1px solid rgba(255,255,255,0.05)';

                    label.innerHTML = `
                        <input type="checkbox" name="astronomers" value="${u.id}" style="margin-right: 12px; accent-color: var(--color-accent);">
                        <div style="flex: 1;">
                            <div class="flex justify-between items-center">
                                <div style="font-size: 0.9rem; font-weight: 500;">${u.name}</div>
                                <div class="flex items-center" style="gap: 4px;">${statusDot} ${statusLabel}</div>
                            </div>

                        </div>
                    `;
                    listContainer.appendChild(label);
                });
            }
        };

        // Initial render (no date selected)
        renderList(null);

        // Re-render when date changes
        dateInput.addEventListener('change', (e) => {
            renderList(e.target.value);
        });

    } catch (e) {
        console.error("Failed to load users", e);
        container.querySelector('#astronomer-list').innerHTML = '<p style="color:red">Failed to load users.</p>';
    }

    // Form Submit
    container.querySelector('form').onsubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);

        // Validate Date
        const selectedDate = formData.get('date');
        const todayStr = new Date().toISOString().split('T')[0];
        if (selectedDate < todayStr) {
            alert("Cannot create events in the past.");
            return;
        }

        const selectedAstronomers = [];
        container.querySelectorAll('input[name="astronomers"]:checked').forEach(cb => {
            selectedAstronomers.push(cb.value);
        });

        if (selectedAstronomers.length === 0) {
            if (!confirm("No astronomers selected. Create event anyway?")) return;
        }

        const eventData = {
            title: formData.get('title'),
            date: formData.get('date'),
            time: formData.get('time'),
            location: formData.get('location'),
            total_needed: selectedAstronomers.length || 1,
            assigned: selectedAstronomers
        };

        try {
            await DataService.createEvent(eventData);
            alert('Event Created Successfully!');
            window.location.hash = '#/events';
        } catch (e) {
            alert('Error creating event');
        }
    };

    return container;
}
