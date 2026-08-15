const API_BASE = '/api';

export const api = {
    // Auth
    login: async (code, clientId) => {
        const res = await fetch(`${API_BASE}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, clientId })
        });
        return res.json();
    },

    completeClientRegistration: async (userId, name, formData) => {
        const res = await fetch(`${API_BASE}/complete-client-registration`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, name, formData })
        });
        return res.json();
    },

    // Content (Events, Gallery, etc.)
    getContent: async (key, clientId = 'default_client') => {
        try {
            const res = await fetch(`${API_BASE}/content/${key}?clientId=${clientId}`);
            if (!res.ok) return null;
            return res.json();
        } catch (e) {
            console.error(`Failed to fetch ${key}`, e);
            return null;
        }
    },

    updateContent: async (key, data, clientId = 'default_client') => {
        const res = await fetch(`${API_BASE}/content/${key}?clientId=${clientId}`, {
            method: 'POST', // or PUT
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return res.json();
    },

    // RSVPs
    submitRSVP: async (userId, data, clientId) => {
        try {
            const res = await fetch(`${API_BASE}/rsvp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, data, clientId })
            });
            return await res.json();
        } catch (e) {
            console.error(e);
            return { success: false };
        }
    },

    deleteRSVP: async (id) => {
        try {
            const res = await fetch(`${API_BASE}/rsvp/${id}`, {
                method: 'DELETE',
            });
            return await res.json();
        } catch (e) {
            console.error(e);
            return { success: false };
        }
    },

    // User / Token Management
    getUsers: async (clientId) => {
        try {
            const url = clientId ? `${API_BASE}/users?clientId=${clientId}` : `${API_BASE}/users`;
            const res = await fetch(url);
            return await res.json();
        } catch (e) {
            console.error(e);
            return [];
        }
    },

    // Guest List (Whitelist)
    getGuests: async (clientId) => {
        try {
            const url = clientId ? `${API_BASE}/guests?clientId=${clientId}` : `${API_BASE}/guests`;
            const res = await fetch(url);
            return await res.json();
        } catch (e) {
            console.error(e);
            return [];
        }
    },

    addGuest: async (name, clientId) => {
        try {
            const res = await fetch(`${API_BASE}/guests`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, clientId })
            });
            return await res.json();
        } catch (e) {
            console.error(e);
            return { success: false };
        }
    },

    updateGuest: async (id, name) => {
        try {
            const res = await fetch(`${API_BASE}/guests/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name })
            });
            return await res.json();
        } catch (e) {
            console.error(e);
            return { success: false };
        }
    },

    deleteGuest: async (id) => {
        try {
            const res = await fetch(`${API_BASE}/guests/${id}`, {
                method: 'DELETE',
            });
            return await res.json();
        } catch (e) {
            console.error(e);
            return { success: false };
        }
    },

    registerGuest: async (name, globalCode, clientId) => {
        try {
            const res = await fetch(`${API_BASE}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, globalCode, clientId })
            });
            return await res.json();
        } catch (e) {
            console.error(e);
            return { success: false, error: 'Connection error' };
        }
    },

    createUser: async (userData) => {
        try {
            const res = await fetch(`${API_BASE}/users`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });
            return await res.json();
        } catch (e) {
            console.error(e);
            return { success: false };
        }
    },

    deleteUser: async (id) => {
        try {
            const res = await fetch(`${API_BASE}/users/${id}`, {
                method: 'DELETE',
            });
            return await res.json();
        } catch (e) {
            console.error(e);
            return { success: false };
        }
    },

    getAllRSVPs: async (clientId) => {
        const url = clientId ? `${API_BASE}/rsvps?clientId=${clientId}` : `${API_BASE}/rsvps`;
        const res = await fetch(url);
        return res.json();
    },

    // Clients (Global Admin)
    getClients: async () => {
        const res = await fetch(`${API_BASE}/clients`);
        return res.json();
    },

    getGlobalStats: async () => {
        const res = await fetch(`${API_BASE}/clients/stats`);
        return res.json();
    },

    createClient: async (id, name, details = {}) => {
        const res = await fetch(`${API_BASE}/clients`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, name, ...details })
        });
        return res.json();
    },

    deleteClient: async (id) => {
        const res = await fetch(`${API_BASE}/clients/${id}`, {
            method: 'DELETE'
        });
        return res.json();
    }
};
