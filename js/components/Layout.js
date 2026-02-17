
export function Layout(content) {
    const container = document.createElement('div');
    container.className = 'app-container';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.minHeight = '100vh';
    container.style.position = 'relative';
    container.style.zIndex = '1';


    // Header
    const header = document.createElement('header');
    header.className = 'app-header';
    header.style.padding = 'var(--spacing-sm) var(--spacing-md)'; // Reduced padding
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';
    header.style.backgroundColor = 'rgba(18, 18, 18, 0.6)'; // Semi-transparent
    header.style.backdropFilter = 'blur(12px)';
    header.style.borderBottom = 'none'; // Remove divider
    header.style.position = 'sticky';
    header.style.top = '0';
    header.style.zIndex = '100';

    header.innerHTML = `
        <img src="assets/orivex_logo.png" alt="Orivex" style="height: 32px;"> <!-- Reduced from 50px -->
        <div id="user-avatar" onclick="window.location.hash='#/profile'" style="width: 32px; height: 32px; background: var(--color-bg-tertiary); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; cursor: pointer;">
            <!-- Avatar initial -->
        </div>
    `;

    // Main Content Area
    const main = document.createElement('main');
    main.className = 'app-content';
    main.style.flex = '1';
    main.style.width = '100%'; // Ensure full width
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
    nav.style.backgroundColor = 'rgba(10, 10, 12, 0.85)'; // Darker, more premium background
    nav.style.backdropFilter = 'blur(16px)'; // Stronger blur
    nav.style.borderTop = '1px solid rgba(255,255,255,0.08)';
    nav.style.display = 'flex';
    nav.style.justifyContent = 'space-between';
    nav.style.padding = '12px 24px'; // More professional breathing room
    nav.style.zIndex = '100';
    nav.style.boxShadow = '0 -4px 20px rgba(0,0,0,0.4)';

    // Modern SVG Icons (Streamlined outline style)
    const icons = {
        home: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>`,
        horizon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>`,
        events: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>`,
        money: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>`,
        team: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>`,
        clock: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`,
        inbox: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>`
    };

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
            { icon: icons.home, label: 'Home', path: '#/dashboard' },
            { icon: icons.horizon, label: 'Horizon', path: '#/calendar' },
            { icon: icons.events, label: 'Events', path: '#/events' },
            { icon: icons.money, label: 'Pay', path: '#/expenses' },
            { icon: icons.team, label: 'Team', path: '#/astronomers' }
        ];
    } else if (role === 'astronomer' || role === 'stargazer') {
        navItems = [
            { icon: icons.home, label: 'Home', path: '#/dashboard' },
            { icon: icons.horizon, label: 'Horizon', path: '#/calendar' },
            { icon: icons.money, label: 'Pay', path: '#/expenses' },
            { icon: icons.clock, label: 'Avail', path: '#/availability' },
            { icon: icons.inbox, label: 'Reqs', path: '#/requests' }
        ];
    }

    navItems.forEach(item => {
        const link = document.createElement('a');
        link.href = item.path;
        link.className = 'nav-item'; // For potential CSS hover states
        link.style.display = 'flex';
        link.style.flexDirection = 'column';
        link.style.alignItems = 'center';
        link.style.justifyContent = 'center';
        link.style.color = 'var(--color-text-muted)'; // Default muted color
        link.style.fontSize = '10px';
        link.style.fontWeight = '500';
        link.style.gap = '4px';
        link.style.textDecoration = 'none';
        link.style.flex = '1'; // Distribute space evenly
        link.style.transition = 'all 0.2s ease';

        const isActive = window.location.hash.startsWith(item.path);

        // Active State Styling
        if (isActive) {
            link.style.color = 'var(--color-accent)'; // Active color
            link.style.transform = 'translateY(-2px)'; // Subtle lift
        }

        link.innerHTML = `
            <div style="opacity: ${isActive ? '1' : '0.7'}; transition: opacity 0.2s;">${item.icon}</div>
            <span style="letter-spacing: 0.3px;">${item.label}</span>
        `;

        // Hover effect helper
        link.onmouseenter = () => { if (!isActive) link.style.color = 'var(--color-text-primary)'; };
        link.onmouseleave = () => { if (!isActive) link.style.color = 'var(--color-text-muted)'; };

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
