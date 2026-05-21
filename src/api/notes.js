import { request } from './client'

/**
 * Fetch all notes owned by the authenticated user
 */
export async function getNotes() {
  return request('/api/notes', { method: 'GET' })
}

/**
 * Create a new note belonging to the active user
 */
export async function createNote(noteData) {
  return request('/api/notes', {
    method: 'POST',
    body: JSON.stringify(noteData),
  })
}

/**
 * Update note properties
 */
export async function updateNote(id, noteData) {
  return request(`/api/notes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(noteData),
  })
}

/**
 * Delete a specific note
 */
export async function deleteNote(id) {
  return request(`/api/notes/${id}`, { method: 'DELETE' })
}
