const API_BASE = './api';

export const DataService = {
    async handleResponse(res) {
        if (!res.ok) {
            const error = await res.json().catch(() => ({ message: res.statusText }));
            throw new Error(error.message || `API Error: ${res.status}`);
        }
        return res.json();
    },

    async getUsers() {
        const res = await fetch(`${API_BASE}/users?ts=${Date.now()}`);
        return this.handleResponse(res);
    },

    async getUser(userId) {
        const res = await fetch(`${API_BASE}/users/${userId}?ts=${Date.now()}`);
        if (!res.ok) return null;
        return res.json();
    },

    async createUser(userData) {
        const res = await fetch(`${API_BASE}/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });
        return this.handleResponse(res);
    },

    async updateUserDetails(userId, data) {
        const res = await fetch(`${API_BASE}/users/${userId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return this.handleResponse(res);
    },

    async getUserStats(userId) {
        try {
            const res = await fetch(`${API_BASE}/users/${userId}/stats?ts=${Date.now()}`);
            return await this.handleResponse(res);
        } catch (e) {
            console.error("Stats fetch failed:", e);
            return { assigned_events: 0, pending_requests: 0 };
        }
    },

    async deleteUser(userId) {
        const res = await fetch(`${API_BASE}/users/${userId}`, {
            method: 'DELETE'
        });
        return this.handleResponse(res);
    },

    async updateUserRoles(userId, roles) {
        const res = await fetch(`${API_BASE}/users/${userId}/role`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ roles })
        });
        return this.handleResponse(res);
    },

    async getLocations() {
        const res = await fetch(`${API_BASE}/locations?ts=${Date.now()}`);
        if (!res.ok) return [];
        return res.json();
    },

    async addLocation(name, latitude = null, longitude = null) {
        const res = await fetch(`${API_BASE}/locations`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, latitude, longitude })
        });
        return this.handleResponse(res);
    },

    async deleteLocation(id) {
        const res = await fetch(`${API_BASE}/locations/${id}`, { method: 'DELETE' });
        return this.handleResponse(res);
    },

    // --- Events ---

    async getEvents() {
        const res = await fetch(`${API_BASE}/events?ts=${Date.now()}`);
        return this.handleResponse(res);
    },

    async getAcceptedEvents(userId) {
        const res = await fetch(`${API_BASE}/users/${userId}/accepted_events?ts=${Date.now()}`);
        return this.handleResponse(res);
    },

    async createEvent(eventData) {
        const res = await fetch(`${API_BASE}/events`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(eventData)
        });
        return this.handleResponse(res);
    },

    async updateEvent(eventId, eventData) {
        const res = await fetch(`${API_BASE}/events/${eventId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(eventData)
        });
        return this.handleResponse(res);
    },

    async deleteEvent(eventId) {
        const res = await fetch(`${API_BASE}/events/${eventId}`, {
            method: 'DELETE'
        });
        return this.handleResponse(res);
    },

    async getRequestsForUser(userId) {
        const res = await fetch(`${API_BASE}/requests/${userId}?ts=${Date.now()}`);
        return this.handleResponse(res);
    },

    async getRequestsForEvent(eventId) {
        const res = await fetch(`${API_BASE}/requests/event/${eventId}?ts=${Date.now()}`);
        return this.handleResponse(res);
    },

    async updateRequestStatus(reqId, status) {
        const res = await fetch(`${API_BASE}/requests/${reqId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });
        return this.handleResponse(res);
    },

    // --- Availability ---

    async getAvailabilityMap(userId) {
        const res = await fetch(`${API_BASE}/availability/${userId}?ts=${Date.now()}`);
        return this.handleResponse(res);
    },

    async getAllAvailability() {
        const res = await fetch(`${API_BASE}/availability/all?ts=${Date.now()}`);
        return this.handleResponse(res);
    },

    async setAvailability(userId, date, status) {
        const res = await fetch(`${API_BASE}/availability`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId, date, status })
        });
        return this.handleResponse(res);
    },

    // --- Expenses ---

    async createExpense(expenseData) {
        const res = await fetch(`${API_BASE}/expenses`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(expenseData)
        });
        return this.handleResponse(res);
    },

    async getExpenses(filters = {}) {
        const params = new URLSearchParams(filters).toString();
        const res = await fetch(`${API_BASE}/expenses?${params}&ts=${Date.now()}`);
        return this.handleResponse(res);
    },

    async updateExpenseStatus(expenseId, status) {
        const res = await fetch(`${API_BASE}/expenses/${expenseId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });
        return this.handleResponse(res);
    },

    async updatePaymentInfo(userId, paymentInfo) {
        const res = await fetch(`${API_BASE}/users/${userId}/payment_info`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ payment_info: paymentInfo })
        });
        return this.handleResponse(res);
    },

    async resetPasswordRequest(email) {
        const res = await fetch(`${API_BASE}/auth/reset-password-request`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        return this.handleResponse(res);
    },

    async resetPasswordConfirm(email, otp, newPassword) {
        const res = await fetch(`${API_BASE}/auth/reset-password-confirm`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, otp, new_password: newPassword })
        });
        return this.handleResponse(res);
    }
};

