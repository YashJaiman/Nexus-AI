import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { useToast } from './ToastContext'

const NotificationContext = createContext(null)

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState(() => {
    try {
      const stored = localStorage.getItem('nexus_notifications')
      return stored ? JSON.parse(stored) : [
        {
          id: 'init-1',
          type: 'system',
          title: 'Neural Link Established',
          message: 'Welcome to Nexus AI. Your workspace is online.',
          read: false,
          timestamp: new Date().toISOString()
        }
      ]
    } catch (e) {
      return []
    }
  })
  
  const toast = useToast()

  useEffect(() => {
    localStorage.setItem('nexus_notifications', JSON.stringify(notifications))
  }, [notifications])

  const addNotification = useCallback((type, title, message) => {
    const id = Date.now().toString(36) + Math.random().toString(36).substring(2, 5)
    const newNotif = {
      id,
      type, // 'task', 'ai', 'note', 'profile', 'system'
      title,
      message,
      read: false,
      timestamp: new Date().toISOString()
    }

    setNotifications(prev => [newNotif, ...prev])

    // Trigger toast notification
    if (type === 'error' || type === 'ai-error') {
      toast.error(`${title}: ${message}`)
    } else if (type === 'success' || type === 'task-completed') {
      toast.success(`${title}: ${message}`)
    } else {
      toast.info(`${title}: ${message}`)
    }
  }, [toast])

  const markAsRead = useCallback((id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }, [])

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }, [])

  const clearAll = useCallback(() => {
    setNotifications([])
  }, [])

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      addNotification,
      markAsRead,
      markAllAsRead,
      clearAll
    }}>
      {children}
    </NotificationContext.Provider>
  )
}
