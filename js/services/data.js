
const API_BASE = '/api';

export const DataService = {
    async getUsers() {
        const res = await fetch(`${API_BASE}/users`);
        return await res.json();
    },

    async getUser(userId) {
        const res = await fetch(`${API_BASE}/users/${userId}`);
        if (!res.ok) return null;
        return await res.json();
    },

    async createUser(userData) {
        const res = await fetch(`${API_BASE}/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });
        return await res.json();
    },

    async updateUserDetails(userId, data) {
        const res = await fetch(`${API_BASE}/users/${userId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data) // Can include name, base_location, password
        });
        return await res.json();
    },

    async getUserStats(userId) {
        try {
            const res = await fetch(`${API_BASE}/users/${userId}/stats`);
            return await res.json();
        } catch (e) {
            return { assigned_events: 0, pending_requests: 0 };
        }
    },

    async deleteUser(userId) {
        const res = await fetch(`${API_BASE}/users/${userId}`, {
            method: 'DELETE'
        });
        return await res.json();
    },

    async updateUserRoles(userId, roles) {
        await fetch(`${API_BASE}/users/${userId}/role`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ roles })
        });
    },

    async getLocations() {
        const res = await fetch(`${API_BASE}/locations`);
        if (!res.ok) return [];
        return res.json();
    },

    async addLocation(name, latitude = null, longitude = null) {
        const res = await fetch(`${API_BASE}/locations`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, latitude, longitude })
        });
        return res.json();
    },

    async deleteLocation(id) {
        const res = await fetch(`${API_BASE}/locations/${id}`, { method: 'DELETE' });
        return res.json();
    },

    // --- Events ---

    async getEvents() {
        const res = await fetch(`${API_BASE}/events`);
        return await res.json();
    },

    async getAcceptedEvents(userId) {
        const res = await fetch(`${API_BASE}/users/${userId}/accepted_events`);
        return await res.json();
    },

    async createEvent(eventData) {
        const res = await fetch(`${API_BASE}/events`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(eventData)
        });
        return await res.json();
    },

    async updateEvent(eventId, eventData) {
        await fetch(`${API_BASE}/events/${eventId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(eventData)
        });
    },

    async deleteEvent(eventId) {
        await fetch(`${API_BASE}/events/${eventId}`, {
            method: 'DELETE'
        });
    },

    async getRequestsForUser(userId) {
        const res = await fetch(`${API_BASE}/requests/${userId}`);
        return await res.json();
    },

    async getRequestsForEvent(eventId) {
        const res = await fetch(`${API_BASE}/requests/event/${eventId}`);
        return await res.json();
    },

    async updateRequestStatus(reqId, status) {
        await fetch(`${API_BASE}/requests/${reqId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });
    },

    // --- Availability ---

    async getAvailabilityMap(userId) {
        const res = await fetch(`${API_BASE}/availability/${userId}`);
        return await res.json();
    },

    async getAllAvailability() {
        // Return array of { user_id, date, status }
        const res = await fetch(`${API_BASE}/availability/all`);
        return await res.json();
    },

    async setAvailability(userId, date, status) {
        await fetch(`${API_BASE}/availability`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId, date, status })
        });
    },

    // --- Expenses ---

    async createExpense(expenseData) {
        const res = await fetch(`${API_BASE}/expenses`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(expenseData)
        });
        return await res.json();
    },

    async getExpenses(filters = {}) {
        const params = new URLSearchParams(filters).toString();
        const res = await fetch(`${API_BASE}/expenses?${params}`);
        return await res.json();
    },

    async updateExpenseStatus(expenseId, status) {
        await fetch(`${API_BASE}/expenses/${expenseId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });
    },

    async updatePaymentInfo(userId, paymentInfo) {
        await fetch(`${API_BASE}/users/${userId}/payment_info`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ payment_info: paymentInfo })
        });
    },

    async resetPasswordRequest(email) {
        const res = await fetch(`${API_BASE}/auth/reset-password-request`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        return res.json();
    },

    async resetPasswordConfirm(email, otp, newPassword) {
        const res = await fetch(`${API_BASE}/auth/reset-password-confirm`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, otp, new_password: newPassword })
        });
        return res.json();
    }
};
