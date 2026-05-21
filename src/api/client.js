const API_URL = (import.meta.env.VITE_API_URL || 'https://nexus-ai-backend-fcdy.onrender.com').replace(/\/+$/, '');
export const TOKEN_KEY = 'nexus_auth_token';

/**
 * Global API Client fetch utility
 * Centralizes request headers, 401 Session Expired captures, and connection failures.
 */
export async function request(endpoint, options = {}) {
  const token = localStorage.getItem(TOKEN_KEY);
  
  const headers = {
    ...(!options.isMultipart && { 'Content-Type': 'application/json' }),
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers
  };

  const config = {
    ...options,
    headers
  };

  // Pre-fetch offline assertion
  if (!navigator.onLine) {
    throw new Error('OFFLINE: No network connectivity detected. Retrying...');
  }

  try {
    const res = await fetch(`${API_URL}${endpoint}`, config);

    if (res.status === 401) {
      // Dispatch global logout event to let AuthContext clean state
      window.dispatchEvent(new CustomEvent('nx-unauthorized-logout'));
      throw new Error('SESSION_EXPIRED: Neural link session expired. Re-authenticating...');
    }

    let data = {};
    try {
      data = await res.json();
    } catch (e) {
      // Body empty or not JSON
    }

    if (!res.ok) {
      throw new Error(data.message || `Portal node responded with code ${res.status}`);
    }

    return data;
  } catch (err) {
    // Distinguish generic network failure from explicit API failures
    if (err.name === 'TypeError' && err.message.toLowerCase().includes('failed to fetch')) {
      throw new Error('CONN_FAILED: Unable to connect to the Nexus API node. Check link.');
    }
    throw err;
  }
}
