import { request } from './client'

/**
 * Fetch analytics datasets
 */
export async function getAnalytics() {
  return request('/api/analytics', { method: 'GET' })
}

/**
 * Retrieve dashboard telemetry summary
 */
export async function getDashboardStats() {
  return request('/api/analytics/dashboard-stats', { method: 'GET' })
}
