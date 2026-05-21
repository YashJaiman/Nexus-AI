import { request } from './client'

/**
 * Register a new User account
 */
export async function signupUser({ fullName, email, password }) {
  return request('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ fullName, email, password }),
  })
}

/**
 * Authenticate User credentials
 */
export async function loginUser({ email, password }) {
  return request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

/**
 * Retrieve current user profile details via JWT
 */
export async function getCurrentUser() {
  return request('/api/auth/me', { method: 'GET' })
}

/**
 * Update profile details
 */
export async function updateProfile(profileData) {
  return request('/api/auth/profile', {
    method: 'PUT',
    body: JSON.stringify(profileData),
  })
}

/**
 * Update account password
 */
export async function updatePassword(passwordData) {
  return request('/api/auth/password', {
    method: 'PUT',
    body: JSON.stringify(passwordData),
  })
}

/**
 * Expire all sessions by incrementing tokenVersion
 */
export async function logoutAllSessions() {
  return request('/api/auth/logout-all', { method: 'POST' })
}
