
import { DataService } from '../services/data.js';
import { AuthService } from '../services/auth.js';

export async function ManageEventPage() {
    const container = document.createElement('div');
    container.className = 'container fade-in';

    // Parse ID from URL query ?id=...
    const hashParts = window.location.hash.split('?');
    const params = new URLSearchParams(hashParts[1]);
    const eventId = params.get('id');
    const currentUser = AuthService.getCurrentUser();

    // State for Editing
    let isEditing = false;
    let currentEventData = null;
    let allLocations = [];

    try {
        const [events, users, locations] = await Promise.all([
            DataService.getEvents(),
            DataService.getUsers(),
            DataService.getLocations()
        ]);
        allLocations = locations;
        const event = events.find(e => e.id === eventId);
        currentEventData = event;
        const allUsers = users; // Re-use already fetched users

        let requests = [];
        try { requests = await DataService.getRequestsForEvent(eventId); } catch (e) { }

        if (!event) { container.innerHTML = '<p>Event not found.</p>'; return container; }

        // Render Function
        const render = () => {
            // ... (keep header) ...
            container.innerHTML = `
                <div class="flex items-center justify-between" style="margin-bottom: var(--spacing-lg);">
                    <div class="flex items-center">
                        <button onclick="window.history.back()" style="background:none; color: var(--color-text-primary); font-size: 1.5rem; margin-right: var(--spacing-md);">←</button>
                        <h2 style="margin: 0;">${isEditing ? 'Edit Event' : 'Manage Event'}</h2>
                    </div>
                </div>

                <div class="card" style="margin-bottom: var(--spacing-lg);">
                    ${isEditing ? renderEditForm() : renderViewMode(event)}
                </div>

                ${!isEditing ? `
                <h3 style="font-size: 1rem; margin-bottom: var(--spacing-md);">Astronomer Status</h3>
                <div class="flex flex-col" style="gap: var(--spacing-sm);">
                    ${requests.length === 0 ? '<p style="color: var(--color-text-muted);">No astronomers assigned.</p>' : ''}
                    ${requests.map(req => {
                // ... existing astronomer rendering ...
                const uid = req.userId || req.user_id;
                const user = allUsers.find(u => String(u.id) === String(uid));
                const userName = user ? user.name : 'Unknown User';

                let badgeColor = 'var(--color-text-muted)';
                let badgeBorder = 'rgba(255,255,255,0.2)';
                if (req.status === 'accepted') { badgeColor = 'var(--color-status-success)'; badgeBorder = 'var(--color-status-success)'; }
                if (req.status === 'declined') { badgeColor = 'var(--color-status-danger)'; badgeBorder = 'var(--color-status-danger)'; }
                if (req.status === 'pending') { badgeColor = 'var(--color-status-warning)'; badgeBorder = 'var(--color-status-warning)'; }

                return `
                                <div class="card flex justify-between items-center" style="padding: var(--spacing-md);">
                                    <div class="flex items-center" style="gap: 12px;">
                                        <div style="width: 32px; height: 32px; background: var(--color-bg-tertiary); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.8rem;">${userName.charAt(0)}</div>
                                        <span>${userName}</span>
                                    </div>
                                    <span style="font-size: 0.8rem; padding: 2px 8px; border: 1px solid ${badgeBorder}; color: ${badgeColor}; border-radius: 12px; text-transform: capitalize;">${req.status}</span>
                                </div>
                                `;
            }).join('')}
                </div>
                ` : ''}

                ${currentUser.currentRole === 'manager' && !isEditing ? `
                <div style="margin-top: var(--spacing-xl); display:flex; gap:10px;">
                    <button id="edit-event-btn" class="btn btn-secondary w-full" style="color: var(--color-accent); border: 1px solid var(--color-accent);">Edit Details</button>
                    <button id="cancel-event-btn" class="btn btn-secondary w-full" style="color: var(--color-status-danger); border: 1px solid var(--color-status-danger);">Cancel Event</button>
                </div>
                ` : ''}
            `;

            // Attach listeners
            if (isEditing) {
                container.querySelector('#save-edit-btn').onclick = async () => {
                    const title = container.querySelector('[name="title"]').value;
                    const date = container.querySelector('[name="date"]').value;
                    const time = container.querySelector('[name="time"]').value;
                    let location = container.querySelector('[name="location"]')?.value;

                    // If using select
                    const locSelect = container.querySelector('#location-select');
                    if (locSelect && locSelect.value) {
                        location = locSelect.value;
                        if (location === 'custom') {
                            location = container.querySelector('#custom-location-input').value;
                        }
                    }

                    // Get assigned astronomers
                    const assigned = [];
                    container.querySelectorAll('.astro-checkbox:checked').forEach(cb => {
                        assigned.push(cb.value);
                    });

                    await DataService.updateEvent(event.id, { title, date, time, location, assigned });
                    alert('Event updated');
                    window.location.reload();
                };
                container.querySelector('#cancel-edit-btn').onclick = () => {
                    isEditing = false;
                    render();
                }

                // Toggle custom location input
                const locSel = container.querySelector('#location-select');
                if (locSel) {
                    locSel.onchange = () => {
                        const customInput = container.querySelector('#custom-location-group');
                        if (locSel.value === 'custom') {
                            customInput.style.display = 'block';
                        } else {
                            customInput.style.display = 'none';
                        }
                    };
                }
            } else {
                // ... view listeners ...
                if (container.querySelector('#edit-event-btn')) {
                    container.querySelector('#edit-event-btn').onclick = () => { isEditing = true; render(); };
                }
                if (container.querySelector('#cancel-event-btn')) {
                    container.querySelector('#cancel-event-btn').onclick = async () => {
                        if (confirm('Are you sure you want to cancel this event?')) {
                            await DataService.deleteEvent(event.id);
                            alert('Event cancelled.');
                            window.history.back();
                        }
                    };
                }
            }
        };

        const renderViewMode = (e) => `
            <div class="flex justify-between items-start">
                 <div>
                    <h3 style="margin-bottom: 4px;">${e.title}</h3>
                    <div style="color: var(--color-text-secondary); font-size: 0.9rem;">${e.date} • ${e.time}</div>
                    <div style="color: var(--color-text-muted); font-size: 0.9rem;">📍 ${e.location}</div>
                 </div>
                 <span style="border: 1px solid var(--color-accent); color: var(--color-accent); padding: 4px 8px; border-radius: 4px; font-size: 0.8rem;">${e.status}</span>
            </div>
        `;

        const renderEditForm = () => {
            const assignedSet = new Set(event.assigned || []);

            // Filter astronomers (role based check would be ideal but 'roles' is array of strings)
            const astronomers = allUsers.filter(u => u.roles.includes('astronomer') || u.roles.includes('stargazer'));

            return `
            <div class="flex flex-col" style="gap: var(--spacing-md);">
                <label style="font-size: 0.9rem; color: var(--color-text-secondary);">Event Name</label>
                <input class="input" name="title" value="${event.title}" placeholder="e.g. Stargazing Night">
                
                <div class="flex gap-2">
                    <div style="flex: 1;">
                        <label style="font-size: 0.9rem; color: var(--color-text-secondary);">Date</label>
                        <input class="input" type="date" name="date" value="${event.date}" style="color-scheme: dark;">
                    </div>
                    <div style="flex: 1;">
                        <label style="font-size: 0.9rem; color: var(--color-text-secondary);">Time</label>
                        <input class="input" type="time" name="time" value="${event.time}" style="color-scheme: dark;">
                    </div>
                </div>
                
                <div>
                     <label style="font-size: 0.9rem; color: var(--color-text-secondary);">Location</label>
                     <select id="location-select" class="input" style="width: 100%;">
                        <option value="" disabled>Select Location</option>
                        ${allLocations.map(l => `<option value="${l.name}" ${event.location === l.name ? 'selected' : ''}>${l.name}</option>`).join('')}
                        <option value="custom" ${!allLocations.find(l => l.name === event.location) ? 'selected' : ''}>Custom Location...</option>
                    </select>
                    <div id="custom-location-group" style="margin-top: 8px; display: ${!allLocations.find(l => l.name === event.location) ? 'block' : 'none'};">
                        <input id="custom-location-input" class="input" value="${event.location}" placeholder="Enter custom location">
                    </div>
                </div>

                <div>
                    <label style="font-size: 0.9rem; color: var(--color-text-secondary);">Select Astronomers</label>
                    <div style="background: var(--color-bg-secondary); border-radius: var(--radius-sm); padding: 8px; max-height: 200px; overflow-y: auto;">
                        ${astronomers.map(u => `
                            <label class="flex items-center" style="padding: 8px; cursor: pointer; border-bottom: 1px solid rgba(255,255,255,0.05);">
                                <input type="checkbox" class="astro-checkbox" value="${u.id}" ${assignedSet.has(u.id) ? 'checked' : ''} style="margin-right: 12px;">
                                <span>${u.name}</span>
                            </label>
                        `).join('')}
                    </div>
                </div>
                
                <div class="flex gap-2" style="margin-top: 16px;">
                    <button id="save-edit-btn" class="btn btn-primary w-full">Save Changes</button>
                    <button id="cancel-edit-btn" class="btn btn-secondary w-full">Cancel</button>
                </div>
            </div>
        `};

        render();

    } catch (e) {
        console.error("ManageEvent Error", e);
        container.innerHTML = '<p>Error loading event details.</p>';
    }

    return container;
}
