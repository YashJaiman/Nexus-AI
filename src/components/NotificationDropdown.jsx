import React, { useRef, useEffect } from 'react'
import { useNotifications } from '../context/NotificationContext'

export default function NotificationDropdown({ isOpen, onClose }) {
  const { notifications, markAsRead, markAllAsRead, clearAll } = useNotifications()
  const dropdownRef = useRef(null)

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        // Only close if we didn't click the bell button itself
        if (!e.target.closest('.d-notif-bell-btn')) {
          onClose()
        }
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick)
      
      // Close on Escape key press
      const handleEscape = (e) => {
        if (e.key === 'Escape') onClose()
      }
      document.addEventListener('keydown', handleEscape)
      return () => {
        document.removeEventListener('mousedown', handleOutsideClick)
        document.removeEventListener('keydown', handleEscape)
      }
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div 
      className="notif-dropdown glass fade-in" 
      ref={dropdownRef} 
      role="dialog" 
      aria-label="Notification Center"
      style={{
        position: 'absolute',
        top: '75px',
        right: '20px',
        width: '320px',
        maxHeight: '400px',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 1000,
        padding: '1rem',
        borderRadius: '1rem',
        background: 'var(--color-sidebar-bg)',
        border: '1px solid var(--color-glass-border)',
        boxShadow: 'var(--shadow-lg)'
      }}
    >
      <div 
        className="notif-header"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid var(--color-dark-border)',
          paddingBottom: '0.5rem',
          marginBottom: '0.5rem'
        }}
      >
        <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-dark-text)' }}>Notifications</span>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            onClick={markAllAsRead}
            style={{
              background: 'none',
              padding: 0,
              fontSize: '0.72rem',
              color: 'var(--color-primary)',
              fontWeight: 600
            }}
          >
            Mark all read
          </button>
          <span style={{ fontSize: '0.7rem', color: 'var(--color-dark-text-secondary)' }}>•</span>
          <button 
            onClick={clearAll}
            style={{
              background: 'none',
              padding: 0,
              fontSize: '0.72rem',
              color: 'var(--color-error)',
              fontWeight: 600
            }}
          >
            Clear
          </button>
        </div>
      </div>
      
      <div 
        className="notif-list"
        style={{
          overflowY: 'auto',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          paddingRight: '4px'
        }}
      >
        {notifications.length === 0 ? (
          <div 
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '2rem 0',
              color: 'var(--color-dark-text-secondary)'
            }}
          >
            <span style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🔔</span>
            <p style={{ fontSize: '0.8rem', margin: 0 }}>No new alerts</p>
          </div>
        ) : (
          notifications.map((n) => (
            <div 
              key={n.id} 
              className={`notif-item ${n.read ? 'read' : 'unread'}`}
              onClick={() => markAsRead(n.id)}
              style={{
                padding: '0.6rem 0.75rem',
                borderRadius: '0.5rem',
                background: n.read ? 'rgba(255, 255, 255, 0.01)' : 'rgba(0, 212, 255, 0.05)',
                border: `1px solid ${n.read ? 'transparent' : 'rgba(0, 212, 255, 0.15)'}`,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                position: 'relative'
              }}
            >
              <div 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '2px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {!n.read && (
                    <span 
                      style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: 'var(--color-primary)',
                        display: 'inline-block'
                      }} 
                    />
                  )}
                  <span style={{ fontWeight: 600, fontSize: '0.78rem', color: 'var(--color-dark-text)' }}>
                    {n.title}
                  </span>
                </div>
                <span style={{ fontSize: '0.65rem', color: 'var(--color-dark-text-secondary)', opacity: 0.6 }}>
                  {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p style={{ fontSize: '0.72rem', color: 'var(--color-dark-text-secondary)', margin: 0, lineHeight: 1.3 }}>
                {n.message}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
