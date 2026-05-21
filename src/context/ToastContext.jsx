import React, { createContext, useContext, useState, useCallback } from 'react'
import '../styles/Toast.css'

const ToastContext = createContext(null)

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.map(t => t.id === id ? { ...t, exiting: true } : t))
    // Wait for fade out animation before removal
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 300)
  }, [])

  const toast = useCallback((message, type = 'info', duration = 3500) => {
    const id = Date.now() + Math.random().toString(36).slice(2, 9)
    setToasts((prev) => [...prev, { id, message, type, exiting: false }])

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, duration)
    }

    return id
  }, [removeToast])

  const success = useCallback((message, duration) => toast(message, 'success', duration), [toast])
  const error = useCallback((message, duration) => toast(message, 'error', duration), [toast])
  const info = useCallback((message, duration) => toast(message, 'info', duration), [toast])
  const warning = useCallback((message, duration) => toast(message, 'warning', duration), [toast])

  const api = { success, error, info, warning }

  // Map type icons
  const getIcon = (type) => {
    switch (type) {
      case 'success': return '✓'
      case 'error':   return '✕'
      case 'warning': return '⚠'
      case 'info':
      default:        return '✦'
    }
  }

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="nx-toast-container">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`nx-toast nx-toast-${t.type} ${t.exiting ? 'nx-toast-exit' : ''}`}
          >
            <div className="nx-toast-icon">{getIcon(t.type)}</div>
            <div className="nx-toast-content">{t.message}</div>
            <button className="nx-toast-close" onClick={() => removeToast(t.id)}>
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
