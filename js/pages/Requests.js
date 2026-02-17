
import { AuthService } from '../services/auth.js';
import { DataService } from '../services/data.js';

export async function RequestsPage() {
    const user = AuthService.getCurrentUser();
    const container = document.createElement('div');
    container.className = 'container fade-in';

    container.innerHTML = `
        <h2 style="margin-bottom: var(--spacing-lg);">Requests</h2>
    `;

    try {
        const [requests, acceptedEvents] = await Promise.all([
            DataService.getRequestsForUser(user.id),
            DataService.getAcceptedEvents(user.id)
        ]);

        const acceptedEventIds = new Set(acceptedEvents.map(e => e.id));

        // Filter: Must be pending AND not already part of an accepted event
        const pending = requests.filter(req =>
            req.status === 'pending' && !acceptedEventIds.has(req.event_id)
        );

        if (pending.length === 0) {
            container.innerHTML += `<p class="text-center" style="margin-top: var(--spacing-xl);">No pending requests.</p>`;
        } else {
            pending.forEach(req => {
                const card = document.createElement('div');
                card.className = 'card';
                card.style.marginBottom = 'var(--spacing-md)';

                card.innerHTML = `

                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: var(--spacing-sm);">
                        <div>
                            <h3 style="font-size: 1.1rem; margin-bottom: 4px;">${req.title}</h3>
                            <div style="color: var(--color-accent); font-size: 0.9rem;">${req.date}</div>
                        </div>
                        <div style="background: rgba(255,255,255,0.1); padding: 4px 8px; border-radius: 4px; font-size: 0.75rem;">${req.status}</div>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: 20px 1fr; gap: 8px; margin-bottom: var(--spacing-lg); color: var(--color-text-secondary); font-size: 0.9rem;">
                        <span>📍</span> <span>${req.loc}</span>
                        <span>⏰</span> <span>${req.time}</span>
                    </div>

                    <div class="flex" style="gap: var(--spacing-sm);">
                        <button class="btn btn-primary w-full btn-accept" style="background: var(--color-status-success); color: white; border: none;">Accept</button>
                        <button class="btn btn-secondary w-full btn-decline" style="color: var(--color-status-danger);">Decline</button>
                    </div>
                `;

                const handleStatusUpdate = async (status) => {
                    const btnWrap = card.querySelector('.flex');
                    const originalHtml = btnWrap.innerHTML;
                    btnWrap.innerHTML = `<div class="text-center w-full" style="font-size: 0.9rem; color: var(--color-accent);">Processing...</div>`;

                    try {
                        await DataService.updateRequestStatus(req.id, status);
                        if (status === 'accepted') {
                            alert('Event accepted!');
                        }
                        window.location.reload();
                    } catch (e) {
                        console.error(`Failed to ${status} request:`, e);
                        alert(`Error: ${e.message}`);
                        btnWrap.innerHTML = originalHtml;
                        // Re-bind events since we overwrote innerHTML
                        bindButtons();
                    }
                };

                const bindButtons = () => {
                    card.querySelector('.btn-accept').onclick = () => handleStatusUpdate('accepted');
                    card.querySelector('.btn-decline').onclick = () => handleStatusUpdate('declined');
                };

                bindButtons();
                container.appendChild(card);
            });
        }
    } catch (error) {
        console.error("Failed to load requests:", error);
        container.innerHTML += `<p style="color: red;">Error loading requests.</p>`;
    }

    return container;
}
