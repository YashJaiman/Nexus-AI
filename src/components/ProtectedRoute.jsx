/**
 * Nexus AI — Route Guards
 * ─────────────────────────────────────────────────────────────
 * ProtectedRoute  → requires login  → else redirect to /login
 * PublicOnlyRoute → requires NO login → else redirect to /dashboard
 */

import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/* ── ProtectedRoute ──────────────────────────────────────────
   Wrap any route element that requires the user to be logged in.
   Usage:
     <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
────────────────────────────────────────────────────────────── */
export function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    // Save the page they tried to visit so we can redirect after login
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}

/* ── PublicOnlyRoute ─────────────────────────────────────────
   Wrap login/signup pages — logged-in users should never see them.
   Usage:
     <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
────────────────────────────────────────────────────────────── */
export function PublicOnlyRoute({ children }) {
  const { isAuthenticated } = useAuth()

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}
