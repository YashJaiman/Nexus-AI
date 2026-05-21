import React from 'react'
import { useTheme } from '../context/ThemeContext'

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <button 
      className="d-icon-btn theme-toggle-btn" 
      onClick={toggleTheme} 
      title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Theme`}
      aria-label={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Theme`}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '1.1rem',
        padding: 0
      }}
    >
      <span 
        className="theme-toggle-icon" 
        style={{ 
          display: 'inline-block', 
          transform: theme === 'dark' ? 'rotate(0deg) scale(1)' : 'rotate(180deg) scale(1.15)',
          transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)'
        }}
      >
        {theme === 'dark' ? '🌙' : '☀️'}
      </span>
    </button>
  )
}
