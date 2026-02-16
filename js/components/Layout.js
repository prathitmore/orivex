
export function Layout(content) {
    const container = document.createElement('div');
    container.className = 'app-container';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.minHeight = '100vh';

    // Header
    const header = document.createElement('header');
    header.className = 'app-header';
    header.style.padding = 'var(--spacing-sm) var(--spacing-md)'; // Reduced padding
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';
    header.style.backgroundColor = 'var(--color-bg-secondary)'; // darker header
    header.style.borderBottom = '1px solid rgba(255,255,255,0.05)';
    header.style.position = 'sticky';
    header.style.top = '0';
    header.style.zIndex = '100';

    header.innerHTML = `
        <img src="assets/orivex_logo.png" alt="Orivex" style="height: 32px;"> <!-- Reduced from 50px -->
        <div id="user-avatar" style="width: 32px; height: 32px; background: var(--color-bg-tertiary); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; cursor: pointer;">
            <!-- Avatar initial -->
        </div>
    `;

    // Main Content Area
    const main = document.createElement('main');
    main.className = 'app-content';
    main.style.flex = '1';
    main.style.padding = 'var(--spacing-md)'; // Reduced from lg
    main.style.maxWidth = '100%';
    main.style.overflowY = 'auto'; // scrollable content
    main.style.marginBottom = '60px'; // Space for bottom nav

    if (typeof content === 'string') {
        main.innerHTML = content;
    } else {
        main.appendChild(content);
    }

    // Bottom Navigation (Mobile First)
    const nav = document.createElement('nav');
    nav.className = 'app-nav';
    nav.style.position = 'fixed';
    nav.style.bottom = '0';
    nav.style.left = '0';
    nav.style.width = '100%';
    nav.style.backgroundColor = 'var(--color-bg-overlay)';
    nav.style.backdropFilter = 'blur(10px)';
    nav.style.borderTop = '1px solid rgba(255,255,255,0.05)';
    nav.style.display = 'flex';
    nav.style.justifyContent = 'space-around';
    nav.style.padding = '8px 0'; // Reduced vertical padding
    nav.style.zIndex = '100';

    // Determine Nav Items based on Role
    let role = 'astronomer';
    const userStr = sessionStorage.getItem('orivex_user');
    if (userStr) {
        const user = JSON.parse(userStr);
        role = user.currentRole || 'astronomer';
    }

    let navItems = [];
    if (role === 'manager') {
        navItems = [
            { icon: '🏠', label: 'Home', path: '#/dashboard' },
            { icon: '🌍', label: 'Horizon', path: '#/calendar' },
            { icon: '🗓️', label: 'Events', path: '#/events' },
            { icon: '💰', label: 'Pay', path: '#/expenses' }, // Shortened label
            { icon: '👥', label: 'Team', path: '#/astronomers' },
            { icon: '👤', label: 'Profile', path: '#/profile' }
        ];
    } else if (role === 'astronomer' || role === 'stargazer') {
        navItems = [
            { icon: '🏠', label: 'Home', path: '#/dashboard' },
            { icon: '🌍', label: 'Horizon', path: '#/calendar' },
            { icon: '💰', label: 'Pay', path: '#/expenses' }, // Shortened label
            { icon: '⏰', label: 'Avail', path: '#/availability' }, // Shortened label
            { icon: '📩', label: 'Reqs', path: '#/requests' }, // Shortened label
            { icon: '👤', label: 'Profile', path: '#/profile' }
        ];
    }

    navItems.forEach(item => {
        const link = document.createElement('a');
        link.href = item.path;
        link.style.display = 'flex';
        link.style.flexDirection = 'column';
        link.style.alignItems = 'center';
        link.style.color = 'var(--color-text-secondary)';
        link.style.fontSize = '10px'; // Reduced font size
        link.style.gap = '2px';
        link.style.textDecoration = 'none';
        link.style.minWidth = '40px'; // ensure touch target

        // Highlight active link
        if (window.location.hash.startsWith(item.path)) {
            link.style.color = 'var(--color-accent)';
        }

        link.innerHTML = `
            <span style="font-size: 18px;">${item.icon}</span> <!-- Reduced icon size -->
            <span>${item.label}</span>
        `;
        nav.appendChild(link);
    });

    container.appendChild(header);
    container.appendChild(main);
    container.appendChild(nav);

    // Update avatar if user exists
    setTimeout(() => {
        const userStr = sessionStorage.getItem('orivex_user');
        if (userStr) {
            const user = JSON.parse(userStr);
            const avatarEl = container.querySelector('#user-avatar');
            if (avatarEl) avatarEl.textContent = user.name.charAt(0);
        }
    }, 0);

    return container;
}
