/**
 * Nexus AI — Authentication Context Provider
 * ─────────────────────────────────────────────────────────────
 * Manages global authentication states, session persistence, and
 * auto-login validation workflows linked to the Node.js API server.
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { signupUser, loginUser, getCurrentUser } from '../api/auth'

/* ── Storage Keys ── */
export const TOKEN_KEY = 'nexus_auth_token'
export const USER_KEY  = 'nexus_user'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [checkingAuth, setCheckingAuth] = useState(true)

  /**
   * Action: Cleanly flush token storage and authentication context states
   */
  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setToken(null)
    setUser(null)
  }, [])

  /**
   * Startup Hook: Restores authenticated sessions on reload by verifying stored JWT
   */
  useEffect(() => {
    const initAuthSession = async () => {
      const savedToken = localStorage.getItem(TOKEN_KEY)

      if (savedToken) {
        try {
          // Query backend database to confirm if token is valid and extract user data
          const res = await getCurrentUser()
          if (res && res.success && res.user) {
            setToken(savedToken)
            setUser(res.user)
            localStorage.setItem(USER_KEY, JSON.stringify(res.user))
          } else {
            logout()
          }
        } catch (err) {
          console.warn('[Auth Session Restore] Auto-login validation failed:', err.message)
          logout()
        }
      }

      setCheckingAuth(false)
    }

    initAuthSession()

    // Listen for unauthorized events to trigger auto-logout
    const handleAutoLogout = () => {
      logout()
    }
    window.addEventListener('nx-unauthorized-logout', handleAutoLogout)
    return () => {
      window.removeEventListener('nx-unauthorized-logout', handleAutoLogout)
    }
  }, [logout])

  /**
   * Action: Signup handler querying backend register API
   */
  const signup = useCallback(async ({ fullName, email, password }) => {
    const res = await signupUser({ fullName, email, password })

    if (res && res.success && res.token && res.user) {
      localStorage.setItem(TOKEN_KEY, res.token)
      localStorage.setItem(USER_KEY, JSON.stringify(res.user))
      setToken(res.token)
      setUser(res.user)
      return res.user
    } else {
      throw new Error(res.message || 'Registration failed')
    }
  }, [])

  /**
   * Action: Login handler querying backend credentials API
   */
  const login = useCallback(async ({ email, password }) => {
    const res = await loginUser({ email, password })

    if (res && res.success && res.token && res.user) {
      localStorage.setItem(TOKEN_KEY, res.token)
      localStorage.setItem(USER_KEY, JSON.stringify(res.user))
      setToken(res.token)
      setUser(res.user)
      return res.user
    } else {
      throw new Error(res.message || 'Authentication failed')
    }
  }, [])

  /**
   * Action: Sync updated user fields in local state & localStorage
   */
  const updateUser = useCallback((updatedUser) => {
    localStorage.setItem(USER_KEY, JSON.stringify(updatedUser))
    setUser(updatedUser)
  }, [])

  const isAuthenticated = Boolean(token && user)

  const value = {
    user,
    token,
    checkingAuth,
    isAuthenticated,
    login,
    signup,
    logout,
    updateUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/**
 * Custom Consumer Hook: Access authentication properties and actions
 */
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be consumed inside a valid <AuthProvider>')
  }
  return ctx
}
