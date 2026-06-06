import i18n from '../i18n';
import { User, AuthTokens } from '../types';

const API_BASE = import.meta.env.VITE_API_BASE || '';

// --- Token Storage ---

const TOKEN_KEYS = {
  access: 'inno_access_token',
  refresh: 'inno_refresh_token',
  id: 'inno_id_token',
};

export function storeTokens(tokens: AuthTokens): void {
  localStorage.setItem(TOKEN_KEYS.access, tokens.access_token);
  if (tokens.refresh_token) localStorage.setItem(TOKEN_KEYS.refresh, tokens.refresh_token);
  if (tokens.id_token) localStorage.setItem(TOKEN_KEYS.id, tokens.id_token);
}

export function getAccessToken(): string | null {
  return localStorage.getItem(TOKEN_KEYS.access);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(TOKEN_KEYS.refresh);
}

export function clearTokens(): void {
  localStorage.removeItem(TOKEN_KEYS.access);
  localStorage.removeItem(TOKEN_KEYS.refresh);
  localStorage.removeItem(TOKEN_KEYS.id);
}

// --- Auth API ---

export async function loginApi(
  username: string,
  password: string,
): Promise<{ success: boolean; message: string; user?: User; tokens?: AuthTokens }> {
  try {
    const res = await fetch(`${API_BASE}/auth/password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: 'login', username, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      // Don't reveal whether the user exists or the password was wrong — always show generic message
      return { success: false, message: i18n.t('api.auth.loginFailed') };
    }

    const tokens: AuthTokens = data;
    storeTokens(tokens);

    // Fetch user info
    const user = await fetchCurrentUser(tokens.access_token);
    return { success: true, message: i18n.t('api.auth.loginSuccess'), user: user ?? undefined, tokens };
  } catch (err) {
    return { success: false, message: i18n.t('api.auth.networkError') };
  }
}

export async function registerApi(
  fullName: string,
  email: string,
  password: string,
): Promise<{ success: boolean; message: string; user?: User; tokens?: AuthTokens }> {
  try {
    const res = await fetch(`${API_BASE}/auth/password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: 'register', username: fullName, email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      return { success: false, message: data.error || i18n.t('api.auth.registerFailed') };
    }

    const tokens: AuthTokens = data;
    storeTokens(tokens);

    // Fetch user info
    const user = await fetchCurrentUser(tokens.access_token);
    return { success: true, message: i18n.t('api.auth.registerSuccess'), user: user ?? undefined, tokens };
  } catch (err) {
    return { success: false, message: i18n.t('api.auth.networkError') };
  }
}

export async function logoutApi(): Promise<void> {
  const accessToken = getAccessToken();
  const refreshToken = getRefreshToken();

  clearTokens();

  try {
    await fetch(`${API_BASE}/auth/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ access_token: accessToken, refresh_token: refreshToken }),
    });
  } catch {
    // Ignore logout errors — tokens are already cleared locally
  }
}

async function fetchCurrentUser(accessToken: string): Promise<User | null> {
  try {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      id: data.id,
      fullName: data.username || data.email || data.id,
      email: data.email || '',
    };
  } catch {
    return null;
  }
}

export async function checkAuth(): Promise<User | null> {
  const token = getAccessToken();
  if (!token) return null;
  return fetchCurrentUser(token);
}
