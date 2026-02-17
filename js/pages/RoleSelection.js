import { AuthService } from '../services/auth.js';
import { DataService } from '../services/data.js';
import { CosmicBackground } from '../components/CosmicBackground.js';

export async function RoleSelectionPage() {
    let user = AuthService.getCurrentUser();
    if (!user) return document.createComment('Redirecting...');

    const container = document.createElement('div');

    // Mount Cosmic Background
    const cosmicBg = CosmicBackground();
    document.body.appendChild(cosmicBg);

    // Cleanup logic
    const observer = new MutationObserver((mutations) => {
        if (!document.body.contains(container)) {
            if (cosmicBg.cleanup) cosmicBg.cleanup();
            if (cosmicBg.parentNode) cosmicBg.parentNode.removeChild(cosmicBg);
            observer.disconnect();
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    container.className = 'flex flex-col items-center justify-center min-h-screen fade-in';
    container.style.padding = 'var(--spacing-lg)';
    container.style.position = 'relative';
    container.style.zIndex = '1';
    container.style.background = 'transparent';

    const heading = document.createElement('h2');
    heading.textContent = 'Select Dashboard';
    heading.style.textAlign = 'center';
    heading.style.marginBottom = 'var(--spacing-xl)';
    container.appendChild(heading);

    const grid = document.createElement('div');
    grid.style.display = 'grid';
    grid.style.gap = 'var(--spacing-lg)';
    grid.style.width = '100%';
    grid.style.maxWidth = '400px';

    user.roles.forEach(role => {
        const card = document.createElement('button');
        card.className = 'card btn'; // reset btn styles
        card.style.display = 'flex';
        card.style.flexDirection = 'column';
        card.style.alignItems = 'center';
        card.style.padding = 'var(--spacing-xl) var(--spacing-lg)';
        card.style.cursor = 'pointer';
        card.style.border = '1px solid rgba(255,255,255,0.1)';
        card.style.transition = 'all 0.2s ease';
        card.style.height = 'auto'; // override btn fixed height if any

        // Icon based on role
        let icon = '🔭';
        let label = 'Astronomer Mode';
        let desc = 'View schedule and requests';

        if (role === 'manager') {
            icon = '⚡';
            label = 'Manager Mode';
            desc = 'Manage events and assignments';
        } else if (role === 'stargazer') {
            icon = '✨';
            label = 'Stargazer Mode';
            desc = 'View schedule and requests (Paid Role)';
        }

        // ...

        card.innerHTML = `
            <div style="font-size: 3rem; margin-bottom: var(--spacing-md);">${icon}</div>
            <div style="font-size: 1.25rem; font-weight: 600; margin-bottom: var(--spacing-xs); color: var(--color-text-primary);">${label}</div>
            <div style="font-size: 0.9rem; color: var(--color-text-secondary); font-weight: 400;">${desc}</div>
        `;

        card.addEventListener('click', () => {
            AuthService.switchRole(role);
            window.location.hash = '#/dashboard';
        });

        // Hover effect helper in JS since we are inline
        card.onmouseenter = () => { card.style.borderColor = 'var(--color-accent)'; card.style.transform = 'scale(1.02)'; };
        card.onmouseleave = () => { card.style.borderColor = 'rgba(255,255,255,0.1)'; card.style.transform = 'scale(1)'; };

        grid.appendChild(card);
    });

    container.appendChild(grid);
    return container;
}
