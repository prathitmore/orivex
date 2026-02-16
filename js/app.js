
import { Layout } from './components/Layout.js';
import { LoginPage } from './pages/Login.js';
import { DashboardPage } from './pages/Dashboard.js';
import { EventsPage } from './pages/Events.js';
import { CreateUserPage } from './pages/CreateUser.js';
import { AstronomersDirectoryPage } from './pages/AstronomersDirectory.js';
import { AvailabilityPage } from './pages/Availability.js';
import { RequestsPage } from './pages/Requests.js';
import { ProfilePage } from './pages/Profile.js';
import { RoleSelectionPage } from './pages/RoleSelection.js';
import { ManageEventPage } from './pages/ManageEvent.js';
import { CreateEventPage } from './pages/CreateEvent.js';
import { HorizonCalendarPage } from './pages/HorizonCalendar.js';
import { ExpensesPage } from './pages/Expenses.js';

const app = document.getElementById('app');

// Router configuration
const routes = {
    '/': LoginPage,
    '/login': LoginPage,
    '/dashboard': DashboardPage,
    '/events': EventsPage,
    '/create-user': CreateUserPage,
    '/astronomers': AstronomersDirectoryPage,
    '/availability': AvailabilityPage,
    '/requests': RequestsPage,
    '/profile': ProfilePage,
    '/role-select': RoleSelectionPage,
    '/manage-event': ManageEventPage,
    '/create-event': CreateEventPage,
    '/calendar': HorizonCalendarPage,
    '/expenses': ExpensesPage
};

async function router() {
    const hash = window.location.hash.slice(1) || '/';
    // Handle query parameters by splitting ? 
    // e.g. /manage-event?id=123 -> path: /manage-event
    const path = hash.split('?')[0];

    const PageComponent = routes[path] || routes['/dashboard']; // Default fallback often better than 404

    // Auth Check (Simple)
    const publicPages = ['/', '/login'];
    const noNavPages = ['/', '/login', '/role-select'];
    const user = sessionStorage.getItem('orivex_user');

    if (!user && !publicPages.includes(path)) {
        window.location.hash = '#/login';
        return;
    }

    try {
        let pageContent;

        // Handle pages that might be async (most are now)
        const result = PageComponent();

        if (result instanceof Promise) {
            pageContent = await result;
        } else {
            pageContent = result;
        }

        if (noNavPages.includes(path)) {
            app.innerHTML = '';
            app.appendChild(pageContent);
        } else {
            app.innerHTML = '';
            app.appendChild(Layout(pageContent));
        }
    } catch (error) {
        console.error('Router error:', error);
        app.innerHTML = `<div style="padding: 20px; color: red;">
            <h2>Application Error</h2>
            <pre>${error.stack || error.message}</pre>
        </div>`;
    }
}

window.addEventListener('hashchange', router);
window.addEventListener('load', router);
