
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
        const requests = await DataService.getRequestsForUser(user.id);

        if (requests.length === 0) {
            container.innerHTML += `<p class="text-center" style="margin-top: var(--spacing-xl);">No pending requests.</p>`;
        } else {
            requests.forEach(req => {
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

                card.querySelector('.btn-accept').onclick = async () => {
                    await DataService.updateRequestStatus(req.id, 'accepted');
                    alert('Event accepted!');
                    window.location.reload();
                };

                card.querySelector('.btn-decline').onclick = async () => {
                    await DataService.updateRequestStatus(req.id, 'declined');
                    window.location.reload();
                };

                container.appendChild(card);
            });
        }
    } catch (error) {
        console.error("Failed to load requests:", error);
        container.innerHTML += `<p style="color: red;">Error loading requests.</p>`;
    }

    return container;
}
