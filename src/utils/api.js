const API_BASE = '/api';

class ApiError extends Error {
    constructor(status, message, code) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.code = code;
    }
}

let refreshPromise = null;

const getCookie = (name) => {
    if (typeof document === 'undefined') return '';
    const prefix = `${encodeURIComponent(name)}=`;
    const entry = document.cookie.split('; ').find(value => value.startsWith(prefix));
    return entry ? decodeURIComponent(entry.slice(prefix.length)) : '';
};

const isMutation = (method = 'GET') => !['GET', 'HEAD', 'OPTIONS'].includes(method.toUpperCase());

const buildHeaders = (path, init = {}) => {
    const headers = new Headers(init.headers || {});
    if (init.body && !(init.body instanceof FormData) && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
    }

    if (isMutation(init.method) && !['/session/login', '/session/exchange'].includes(path)) {
        const csrf = getCookie('csrf_token');
        if (csrf) headers.set('X-CSRF-Token', csrf);
    }
    return headers;
};

const parseResponse = async (res) => {
    if (res.status === 204) return undefined;
    return res.json().catch(() => ({}));
};

const refreshSession = async () => {
    if (!refreshPromise) {
        const path = '/session/refresh';
        refreshPromise = fetch(`${API_BASE}${path}`, {
            method: 'POST',
            credentials: 'include',
            headers: buildHeaders(path, { method: 'POST' })
        })
            .then(res => res.ok)
            .catch(() => false)
            .finally(() => { refreshPromise = null; });
    }
    return refreshPromise;
};

const request = async (path, init = {}, allowRefresh = true) => {
    const res = await fetch(`${API_BASE}${path}`, {
        ...init,
        credentials: 'include',
        headers: buildHeaders(path, init)
    });

    if (
        res.status === 401 &&
        allowRefresh &&
        !['/session/login', '/session/exchange', '/session/refresh'].includes(path)
    ) {
        const refreshed = await refreshSession();
        if (refreshed) return request(path, init, false);
    }

    const payload = await parseResponse(res);
    if (!res.ok) {
        throw new ApiError(res.status, payload?.error || 'Request failed', payload?.code);
    }
    return payload;
};

const uploadImageDataUrl = async (dataUrl, clientId = 'default_client') => {
    const result = await request('/assets', {
        method: 'POST',
        body: JSON.stringify({ dataUrl, clientId })
    });
    return result.url;
};

const materializeImageAssets = async (value, clientId) => {
    if (typeof value === 'string') {
        return value.startsWith('data:image/') ? uploadImageDataUrl(value, clientId) : value;
    }
    if (Array.isArray(value)) {
        return Promise.all(value.map((child) => materializeImageAssets(child, clientId)));
    }
    if (value && typeof value === 'object') {
        const entries = await Promise.all(
            Object.entries(value).map(async ([key, child]) => [key, await materializeImageAssets(child, clientId)])
        );
        return Object.fromEntries(entries);
    }
    return value;
};

const normalizeSessionUser = (user = {}) => ({
    ...user,
    isRegistered: Boolean(user.isRegistered ?? user.isProfileComplete),
    profileComplete: Boolean(user.isProfileComplete)
});

const loginWithLegacyOrInvitation = async (code, clientId) => {
    try {
        const result = await request('/session/login', {
            method: 'POST',
            body: JSON.stringify({ code, clientId })
        }, false);
        return { success: true, user: normalizeSessionUser(result.user) };
    } catch (error) {
        if (error?.status !== 401) throw error;
        const exchanged = await request('/session/exchange', {
            method: 'POST',
            body: JSON.stringify({ token: code })
        }, false);
        return { success: true, user: normalizeSessionUser(exchanged.user), invitationExchanged: true };
    }
};

export const api = {
    login: async (code, clientId = 'default_client') => {
        try {
            return await loginWithLegacyOrInvitation(String(code || '').trim(), clientId);
        } catch (error) {
            return { success: false, error: error?.message || 'Invalid or expired invitation' };
        }
    },

    session: async () => {
        const result = await request('/session');
        return { ...result, user: normalizeSessionUser(result.user) };
    },

    logout: () => request('/session/logout', { method: 'POST' }, false),

    exchangeInvitation: async (token) => {
        const result = await request('/session/exchange', {
            method: 'POST',
            body: JSON.stringify({ token })
        }, false);
        return { ...result, user: normalizeSessionUser(result.user) };
    },

    profile: () => request('/profile'),

    completeProfile: (profile) => request('/profile', {
        method: 'PUT',
        body: JSON.stringify(profile)
    }),

    completeClientRegistration: async () => ({
        success: false,
        error: 'Secure organiser onboarding now happens through the profile flow.'
    }),

    getContent: async (key, clientId = 'default_client') => {
        try {
            return await request(`/content/${encodeURIComponent(key)}?clientId=${encodeURIComponent(clientId)}`);
        } catch (error) {
            console.error(`Failed to fetch ${key}`, error);
            return null;
        }
    },

    updateContent: async (key, data, clientId = 'default_client') => {
        const normalized = await materializeImageAssets(data, clientId);
        const result = await request(`/content/${encodeURIComponent(key)}?clientId=${encodeURIComponent(clientId)}`, {
            method: 'POST',
            body: JSON.stringify(normalized)
        });
        return { ...result, value: normalized };
    },

    uploadImage: async (dataUrl, clientId = 'default_client') => ({
        url: await uploadImageDataUrl(dataUrl, clientId)
    }),

    submitRSVP: async (userId, data, clientId) => {
        try {
            const body = { data };
            if (userId) body.userId = userId;
            if (clientId) body.clientId = clientId;
            return await request('/rsvp', { method: 'POST', body: JSON.stringify(body) });
        } catch (error) {
            console.error(error);
            return { success: false, error: error?.message || 'Unable to save RSVP' };
        }
    },

    deleteRSVP: async (id) => {
        try {
            return await request(`/rsvp/${encodeURIComponent(id)}`, { method: 'DELETE' });
        } catch (error) {
            console.error(error);
            return { success: false, error: error?.message || 'Unable to delete RSVP' };
        }
    },

    getUsers: async (clientId) => {
        try {
            const query = clientId ? `?clientId=${encodeURIComponent(clientId)}` : '';
            return await request(`/users${query}`);
        } catch (error) {
            console.error(error);
            return [];
        }
    },

    getGuests: async (clientId) => {
        try {
            const query = clientId ? `?clientId=${encodeURIComponent(clientId)}` : '';
            return await request(`/guests${query}`);
        } catch (error) {
            console.error(error);
            return [];
        }
    },

    addGuest: async (name, clientId) => {
        try {
            return await request('/guests', {
                method: 'POST',
                body: JSON.stringify({ name, clientId })
            });
        } catch (error) {
            return { success: false, error: error?.message || 'Unable to add guest' };
        }
    },

    updateGuest: async (id, name, clientId) => {
        try {
            return await request(`/guests/${encodeURIComponent(id)}`, {
                method: 'PUT',
                body: JSON.stringify({ name, clientId })
            });
        } catch (error) {
            return { success: false, error: error?.message || 'Unable to update guest' };
        }
    },

    deleteGuest: async (id, clientId) => {
        try {
            const query = clientId ? `?clientId=${encodeURIComponent(clientId)}` : '';
            return await request(`/guests/${encodeURIComponent(id)}${query}`, { method: 'DELETE' });
        } catch (error) {
            return { success: false, error: error?.message || 'Unable to delete guest' };
        }
    },

    registerGuest: async (_name, invitationToken, _clientId) => {
        try {
            const result = await api.exchangeInvitation(invitationToken);
            return { success: true, user: result.user };
        } catch (error) {
            return { success: false, error: error?.message || 'Invitation is invalid or expired' };
        }
    },

    createUser: async (userData) => {
        try {
            const result = await request('/users', {
                method: 'POST',
                body: JSON.stringify(userData)
            });
            const credential = result?.invitation?.token || result?.clientAccessCode || null;
            return {
                ...result,
                user: result?.user ? {
                    ...result.user,
                    access_code: credential,
                    accessCode: credential,
                    _invitation: result.invitation || null
                } : result?.user
            };
        } catch (error) {
            return { success: false, error: error?.message || 'Unable to create user' };
        }
    },

    createInvitation: async (userId, expiresInHours = 72) => {
        try {
            return await request('/invitations', {
                method: 'POST',
                body: JSON.stringify({ userId, expiresInHours })
            });
        } catch (error) {
            return { success: false, error: error?.message || 'Unable to create invitation' };
        }
    },

    deleteUser: async (id) => {
        try {
            return await request(`/users/${encodeURIComponent(id)}`, { method: 'DELETE' });
        } catch (error) {
            return { success: false, error: error?.message || 'Unable to delete user' };
        }
    },

    getSeatOccupancy: async () => {
        try {
            const result = await request('/seats/occupied');
            return Array.isArray(result?.seats) ? result.seats : [];
        } catch (error) {
            if (error?.status === 401 || error?.status === 428) return [];
            console.error(error);
            return [];
        }
    },

    getAllRSVPs: async (clientId) => {
        try {
            const query = clientId ? `?clientId=${encodeURIComponent(clientId)}` : '';
            return await request(`/rsvps${query}`);
        } catch (error) {
            if (error?.status === 401 || error?.status === 403 || error?.status === 428) return [];
            throw error;
        }
    },

    getClients: async () => {
        try {
            return await request('/clients');
        } catch (error) {
            console.error(error);
            return [];
        }
    },

    getGlobalStats: () => request('/clients/stats'),

    createClient: async (id, name, details = {}) => {
        const result = await request('/clients', {
            method: 'POST',
            body: JSON.stringify({ id, name, ...details })
        });
        return {
            ...result,
            ownerToken: result?.ownerInvitation?.token || null,
            ownerLoginFragment: result?.ownerInvitation?.loginFragment || null
        };
    },

    deleteClient: (id) => request(`/clients/${encodeURIComponent(id)}`, { method: 'DELETE' })
};

export { ApiError };
