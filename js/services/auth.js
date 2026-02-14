
import { DataService } from './data.js';

// Direct function access is more reliable if redirects are tricky
// But Flask expects its own routes.
// The Flask app is mounted at /.netlify/functions/api
// So api/login becomes /.netlify/functions/api/api/login potentially?
// No, apig-wsgi handles this usually.
// Let's try pointing directly to the function endpoint.
const API_BASE = '/.netlify/functions/api';
const USER_STORAGE_KEY = 'orivex_user';

export const AuthService = {
    isAuthenticated() {
        return !!sessionStorage.getItem(USER_STORAGE_KEY);
    },

    getCurrentUser() {
        const userStr = sessionStorage.getItem(USER_STORAGE_KEY);
        return userStr ? JSON.parse(userStr) : null;
    },

    async refreshUser() {
        const user = this.getCurrentUser();
        if (!user) return null;

        try {
            const freshUser = await DataService.getUser(user.id);
            if (freshUser) {
                // Preserve currentRole if valid, or default to first new role
                freshUser.currentRole = user.currentRole;

                // If the current role we had is no longer in the user's assigned roles
                if (!freshUser.roles.includes(freshUser.currentRole)) {
                    // Default to the first role available
                    freshUser.currentRole = freshUser.roles[0];
                }

                // If no current role set yet (e.g. fresh login/migration), set it
                if (!freshUser.currentRole && freshUser.roles.length > 0) {
                    freshUser.currentRole = freshUser.roles[0];
                }

                sessionStorage.setItem(USER_STORAGE_KEY, JSON.stringify(freshUser));
                return freshUser;
            }
        } catch (e) {
            console.error('Failed to refresh user session', e);
        }
        return user; // Return stale user if fetch fails, to allow offline/error continuity
    },

    async login(name, password) {
        try {
            const res = await fetch(`${API_BASE}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, password })
            });

            const contentType = res.headers.get("content-type");
            if (contentType && contentType.indexOf("application/json") !== -1) {
                const data = await res.json();
                if (data.success) {
                    const user = data.user;
                    // Add currentRole for UI
                    user.currentRole = user.roles[0];
                    sessionStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
                    return { success: true, user };
                } else {
                    return { success: false, message: data.message };
                }
            } else {
                const text = await res.text();
                console.error("Non-JSON response:", text);
                return { success: false, message: `Server Error (${res.status}): ${text.substring(0, 100)}` };
            }
        } catch (e) {
            console.error("Login Exception:", e);
            return { success: false, message: `Network/Client Error: ${e.message}` };
        }
    },

    logout() {
        sessionStorage.removeItem(USER_STORAGE_KEY);
        window.location.hash = '#/login';
        window.location.reload();
    },

    switchRole(newRole) {
        const user = this.getCurrentUser();
        if (user && user.roles.includes(newRole)) {
            user.currentRole = newRole;
            sessionStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
            return true;
        }
        return false;
    }
};
