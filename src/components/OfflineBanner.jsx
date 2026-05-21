import React, { useState, useEffect } from 'react'

export default function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine)

  useEffect(() => {
    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (!isOffline) return null

  return (
    <div 
      className="offline-banner glass fade-in"
      style={{
        position: 'fixed',
        top: '12px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '0.55rem 1.2rem',
        borderRadius: '50px',
        background: 'rgba(239, 68, 68, 0.12)',
        border: '1px solid rgba(239, 68, 68, 0.35)',
        boxShadow: '0 0 18px rgba(239, 68, 68, 0.2)',
        backdropFilter: 'blur(10px)',
        color: '#fca5a5',
        fontSize: '0.8rem',
        fontWeight: 600
      }}
      role="alert"
    >
      <span 
        style={{ 
          width: '7px', 
          height: '7px', 
          background: '#ef4444', 
          borderRadius: '50%', 
          boxShadow: '0 0 8px #ef4444', 
          display: 'inline-block',
          animation: 'nx-pulse-orb 1.5s ease-in-out infinite alternate' 
        }} 
      />
      <span>Neural Link Severed — Operating in Offline Sandbox</span>
    </div>
  )
}
