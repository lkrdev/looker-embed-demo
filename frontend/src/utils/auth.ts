const AUTH_STORAGE_KEY = 'looker_embed_demo_auth_session';
// Synchronized with backend COOKIE_MAX_AGE_SHORT (30 days)
const EXPIRATION_MINUTES = 30 * 24 * 60;

export interface AuthSession {
  email: string;
  provider: 'google' | 'microsoft' | 'email';
  expiresAt: number;
}

/**
 * Sets a mock authentication session in localStorage that expires in 30 days (matching backend session cookie TTL).
 */
export function setAuthSession(provider: 'google' | 'microsoft' | 'email', email: string = 'demo@example.com'): void {
  try {
    const expiresAt = Date.now() + EXPIRATION_MINUTES * 60 * 1000;
    const session: AuthSession = {
      email,
      provider,
      expiresAt,
    };
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  } catch (error) {
    console.error('Failed to save authentication session to localStorage');
  }
}

/**
 * Checks if a valid, non-expired mock authentication session exists in localStorage.
 */
export function isAuthenticated(): boolean {
  try {
    const data = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!data) return false;

    const session: AuthSession = JSON.parse(data);
    if (!session || typeof session.expiresAt !== 'number') {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      return false;
    }

    if (Date.now() > session.expiresAt) {
      // Token expired, clean up
      localStorage.removeItem(AUTH_STORAGE_KEY);
      return false;
    }

    return true;
  } catch (error) {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return false;
  }
}

/**
 * Retrieves the current authentication session if valid.
 */
export function getAuthSession(): AuthSession | null {
  try {
    if (!isAuthenticated()) return null;
    const data = localStorage.getItem(AUTH_STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    return null;
  }
}

/**
 * Clears the mock authentication session and resets all user preferences/customizations to defaults.
 */
export function clearAuthSession(): void {
  try {
    const keysToRemove = [
      AUTH_STORAGE_KEY,
      'TANSTACK_QUERY_GLOBAL_OFFLINE_CACHE',
      'brand',
      'language',
      'theme',
      'embed_type',
      'sidebar_collapsed',
      'source_enabled',
      'looker_ca_cached_conversations',
    ];
    keysToRemove.forEach((key) => localStorage.removeItem(key));
  } catch (error) {
    console.error('Failed to remove authentication session from localStorage');
  }
}
