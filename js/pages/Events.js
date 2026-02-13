
import { DataService } from '../services/data.js';

export async function EventsPage() {
    const container = document.createElement('div');
    container.className = 'container fade-in';

    container.innerHTML = `
        <div class="flex justify-between items-center" style="margin-bottom: var(--spacing-lg);">
            <h2 style="margin: 0;">Events</h2>
            <button class="btn btn-primary" onclick="window.location.hash='#/create-event'">+ New</button>
        </div>

        <div class="flex" style="gap: var(--spacing-sm); margin-bottom: var(--spacing-md); overflow-x: auto; padding-bottom: 4px;">
            <button class="btn btn-secondary" style="font-size: 0.8rem; background: var(--color-text-primary); color: var(--color-bg-primary);">All</button>
            <button class="btn btn-secondary" style="font-size: 0.8rem;">Upcoming</button>
            <button class="btn btn-secondary" style="font-size: 0.8rem;">Past</button>
        </div>
    `;

    try {
        const events = await DataService.getEvents();

        if (events.length === 0) {
            container.innerHTML += `<p class="text-center" style="margin-top: 2rem; color: var(--color-text-muted);">No events found.</p>`;
        } else {
            // Sort by date (newest first for now, or closest upcoming)
            events.sort((a, b) => b.date.localeCompare(a.date));

            events.forEach(evt => {
                const card = document.createElement('div');
                card.className = 'card';
                card.style.marginBottom = 'var(--spacing-md)';

                let statusColor = 'var(--color-text-muted)';
                if (evt.status === 'Confirmed') statusColor = 'var(--color-status-success)';
                if (evt.status === 'Pending') statusColor = 'var(--color-status-warning)';

                const assignedCount = evt.assigned ? evt.assigned.length : 0;
                const totalNeeded = evt.total_needed || 0;

                card.innerHTML = `
                    <div class="flex justify-between items-start" style="margin-bottom: var(--spacing-xs);">
                        <h3 style="font-size: 1rem; margin: 0;">${evt.title}</h3>
                        <span style="font-size: 0.75rem; color: ${statusColor}; border: 1px solid ${statusColor}; padding: 2px 6px; border-radius: 4px;">${evt.status}</span>
                    </div>
                    <div style="font-size: 0.9rem; color: var(--color-text-secondary); margin-bottom: var(--spacing-md);">
                        ${evt.date} • ${evt.time}
                    </div>
                     <div style="font-size: 0.85rem; color: var(--color-text-muted); margin-bottom: var(--spacing-md);">
                        📍 ${evt.location}
                    </div>
                    <div class="flex justify-between items-center">
                        <div class="flex items-center" style="font-size: 0.8rem; gap: 4px;">
                            <span>👥</span> ${assignedCount} / ${totalNeeded} Astronomers
                        </div>
                        <button class="btn btn-secondary" style="padding: 4px 12px; font-size: 0.8rem;" onclick="window.location.hash='#/manage-event?id=${evt.id}'">Manage</button>
                    </div>
                `;
                container.appendChild(card);
            });
        }
    } catch (e) {
        console.error("Error loading events:", e);
        container.innerHTML += `<p>Error loading events.</p>`;
    }

    return container;
}
