const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000/api';

export type SessionUser = {
  id: string;
  name?: string;
  role: 'admin' | 'client' | 'user';
  clientId: string;
  isProfileComplete: boolean;
};

export class ApiError extends Error {
  constructor(public status: number, message: string, public code?: string) {
    super(message);
  }
}

let refreshPromise: Promise<boolean> | null = null;

async function refreshAccessSession(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = fetch(`${API_BASE}/session/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    })
      .then((response) => response.ok)
      .catch(() => false)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

async function request<T>(path: string, init: RequestInit = {}, allowRefresh = true): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...init.headers
    }
  });

  if (response.status === 401 && allowRefresh && path !== '/session/login' && path !== '/session/refresh') {
    const refreshed = await refreshAccessSession();
    if (refreshed) return request<T>(path, init, false);
  }

  if (response.status === 204) return undefined as T;
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ApiError(response.status, payload.error || 'Request failed', payload.code);
  }
  return payload as T;
}

export const api = {
  login: (code: string, clientId = 'default_client') =>
    request<{ user: SessionUser }>('/session/login', {
      method: 'POST',
      body: JSON.stringify({ code, clientId })
    }, false),

  session: () => request<{ user: SessionUser }>('/session'),

  refresh: () => request<{ user: SessionUser }>('/session/refresh', { method: 'POST' }, false),

  logout: () => request<void>('/session/logout', { method: 'POST' }, false),

  profile: () => request<{ profile: Record<string, string>; isProfileComplete: boolean }>('/profile'),

  completeProfile: (profile: {
    fullName: string;
    relationToCouple: string;
    dietaryPreference: string;
    phone: string;
  }) => request<{ success: true; isProfileComplete: true }>('/profile', {
    method: 'PUT',
    body: JSON.stringify(profile)
  })
};
