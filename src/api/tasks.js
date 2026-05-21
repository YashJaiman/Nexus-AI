import { request } from './client'

/**
 * Fetch all tasks owned by the authenticated user
 */
export async function getTasks() {
  return request('/api/tasks', { method: 'GET' })
}

/**
 * Create a new task belonging to the active user
 */
export async function createTask(taskData) {
  return request('/api/tasks', {
    method: 'POST',
    body: JSON.stringify(taskData),
  })
}

/**
 * Update task properties (title, details, completed, etc.)
 */
export async function updateTask(id, taskData) {
  return request(`/api/tasks/${id}`, {
    method: 'PUT',
    body: JSON.stringify(taskData),
  })
}

/**
 * Delete a specific task
 */
export async function deleteTask(id) {
  return request(`/api/tasks/${id}`, { method: 'DELETE' })
}
