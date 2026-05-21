import React, { useState, useEffect, useRef } from 'react'
import './CommandPalette.css'

export default function CommandPalette({ 
  isOpen, 
  onClose, 
  setActiveNav, 
  tasks = [], 
  notes = [], 
  onAddTask, 
  onAddNote, 
  toggleTheme 
}) {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const overlayRef = useRef(null)
  const inputRef = useRef(null)

  // Focus input automatically on open
  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
      
      const handleEscape = (e) => {
        if (e.key === 'Escape') onClose()
      }
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  // Static commands list
  const defaultCommands = [
    { id: 'nav-dashboard', category: 'Navigation', label: 'Go to Dashboard', icon: '⬡', action: () => setActiveNav('dashboard') },
    { id: 'nav-ai', category: 'Navigation', label: 'Go to AI Assistant', icon: '🤖', action: () => setActiveNav('ai') },
    { id: 'nav-tasks', category: 'Navigation', label: 'Go to Tasks', icon: '✦', action: () => setActiveNav('tasks') },
    { id: 'nav-notes', category: 'Navigation', label: 'Go to Memos', icon: '◈', action: () => setActiveNav('notes') },
    { id: 'nav-analytics', category: 'Navigation', label: 'Go to Analytics', icon: '◉', action: () => setActiveNav('analytics') },
    { id: 'nav-settings', category: 'Navigation', label: 'Go to Settings', icon: '⚙', action: () => setActiveNav('settings') },
    
    { id: 'action-theme', category: 'Actions', label: 'Toggle Light/Dark Theme', icon: '🌗', action: () => toggleTheme() },
    { id: 'action-task', category: 'Actions', label: 'Create New Task', icon: '⚡', action: () => { setActiveNav('tasks'); if (onAddTask) onAddTask(); } },
    { id: 'action-note', category: 'Actions', label: 'Create New Note', icon: '📝', action: () => { setActiveNav('notes'); if (onAddNote) onAddNote(); } },
    
    { id: 'ai-summary', category: 'AI Quick Prompts', label: 'AI Prompt: Summarize current workload', icon: '🧠', action: () => { setActiveNav('ai'); window.dispatchEvent(new CustomEvent('nx-ai-prompt', { detail: 'Summarize my outstanding tasks and help me plan my day.' })); } },
    { id: 'ai-debug', category: 'AI Quick Prompts', label: 'AI Prompt: Help me write an optimized algorithm', icon: '💻', action: () => { setActiveNav('ai'); window.dispatchEvent(new CustomEvent('nx-ai-prompt', { detail: 'Give me a template for a binary search tree in JavaScript.' })); } }
  ]

  // Add tasks and notes into search scope dynamically
  const taskCommands = tasks.map(t => ({
    id: `task-${t._id || t.id}`,
    category: 'Active Tasks',
    label: `Task: ${t.title}`,
    icon: '✦',
    action: () => setActiveNav('tasks')
  }))

  const noteCommands = notes.map(n => ({
    id: `note-${n._id || n.id}`,
    category: 'Memos',
    label: `Memo: ${n.title || 'Untitled note'}`,
    icon: '◈',
    action: () => setActiveNav('notes')
  }))

  const allCommands = [...defaultCommands, ...taskCommands, ...noteCommands]

  // Filter commands by search query
  const filtered = allCommands.filter(c => 
    c.label.toLowerCase().includes(query.toLowerCase()) ||
    c.category.toLowerCase().includes(query.toLowerCase())
  )

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => (prev + 1) % filtered.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => (prev - 1 + filtered.length) % filtered.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (filtered[selectedIndex]) {
        filtered[selectedIndex].action()
        onClose()
      }
    }
  }

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div 
      className="cmd-overlay" 
      ref={overlayRef} 
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-label="System Command Palette"
    >
      <div className="cmd-container glass">
        <div className="cmd-input-wrap">
          <span className="cmd-search-ico">🔍</span>
          <input 
            type="text" 
            className="cmd-input" 
            placeholder="Type a command or search workspace..."
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
            onKeyDown={handleKeyDown}
            ref={inputRef}
          />
          <kbd className="cmd-esc-kbd">ESC</kbd>
        </div>

        <div className="cmd-results">
          {filtered.length === 0 ? (
            <div className="cmd-empty">
              <p>No results found for "{query}"</p>
            </div>
          ) : (
            // Group by category to show clean segments
            filtered.map((cmd, idx) => {
              const showCategoryHeader = idx === 0 || filtered[idx - 1].category !== cmd.category
              
              return (
                <React.Fragment key={cmd.id}>
                  {showCategoryHeader && (
                    <div className="cmd-category-hdr">{cmd.category}</div>
                  )}
                  <div 
                    className={`cmd-item ${idx === selectedIndex ? 'selected' : ''}`}
                    onClick={() => { cmd.action(); onClose(); }}
                    style={{ contentVisibility: 'auto' }}
                  >
                    <span className="cmd-item-icon">{cmd.icon}</span>
                    <span className="cmd-item-label">{cmd.label}</span>
                    {idx === selectedIndex && <span className="cmd-item-enter">⏎ Go</span>}
                  </div>
                </React.Fragment>
              )
            })
          )}
        </div>

        <div className="cmd-footer">
          <span>↑↓ to navigate</span>
          <span>↵ to select</span>
          <span>esc to close</span>
        </div>
      </div>
    </div>
  )
}
