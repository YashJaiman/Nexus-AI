/**
 * Nexus AI — Notes Section
 * Split editor layout featuring live debounced auto-saving and markdown previews.
 */

import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { getNotes, createNote, updateNote, deleteNote } from '../api/notes'
import './Notes.css'

// A simple high-performance markdown parser to safely render headers, lists, code, and styles
const parseMarkdown = (md) => {
  if (!md) return ''
  let html = md
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  // Code blocks: ```javascript\ncode\n```
  html = html.replace(/```([\s\S]*?)```/g, (match, code) => {
    return `<pre><code>${code.trim()}</code></pre>`
  })

  // Inline code: `code`
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>')

  // Headers: # Header 1
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>')
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>')
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>')

  // Blockquotes: > Text
  html = html.replace(/^\s*>\s*(.*$)/gim, '<blockquote>$1</blockquote>')

  // Bold: **text**
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')

  // Bullet Lists: - item or * item
  html = html.replace(/^\s*[-*]\s+(.*$)/gim, '<li>$1</li>')
  // Group consecutive <li>s into <ul>s
  html = html.replace(/(<li>.*<\/li>)/gim, '<ul>$1<\/ul>')
  // Remove nested uls
  html = html.replace(/<\/ul>\s*<ul>/gim, '')

  // Line breaks
  html = html.replace(/\n/g, '<br/>')

  return html
}

export default function NotesSection() {
  const [notes, setNotes] = useState([])
  const [activeNote, setActiveNote] = useState(null)
  const [loading, setLoading] = useState(true)

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [catFilter, setCatFilter] = useState('all')

  // View state: 'write' | 'preview'
  const [mode, setMode] = useState('write')

  // Sync statuses: 'idle' | 'syncing' | 'saved'
  const [syncStatus, setSyncStatus] = useState('idle')
  const [showExportMenu, setShowExportMenu] = useState(false)

  const { token } = useAuth()
  const toast = useToast()

  // Ref to hold save timers to handle debouncing properly
  const saveTimerRef = useRef(null)

  // Command palette event bridge
  useEffect(() => {
    const triggerCreate = () => handleCreateNote()
    window.addEventListener('nx-open-note-create', triggerCreate)
    return () => window.removeEventListener('nx-open-note-create', triggerCreate)
  }, [notes])

  // Fetch user notes
  useEffect(() => {
    const fetchNotes = async () => {
      try {
        setLoading(true)
        const res = await getNotes()
        if (res && res.success && Array.isArray(res.notes)) {
          setNotes(res.notes)
          if (res.notes.length > 0) {
            setActiveNote(res.notes[0])
          }
        }
      } catch (err) {
        console.error('Failed to load user notes:', err)
        toast.error('Notes sync error. Offline sandbox active.')
      } finally {
        setLoading(false)
      }
    }
    fetchNotes()
  }, [])

  // Debounced auto-save handler
  const triggerAutoSave = (updatedNote) => {
    // Clear any pending save timer
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current)
    }

    setSyncStatus('syncing')

    saveTimerRef.current = setTimeout(async () => {
      try {
        await updateNote(updatedNote._id, {
          title: updatedNote.title,
          content: updatedNote.content,
          category: updatedNote.category
        })

        setSyncStatus('saved')
        setTimeout(() => setSyncStatus('idle'), 1500)
      } catch (err) {
        console.error('Failed to auto-save note:', err)
        setSyncStatus('idle')
        toast.error('Cloud synchronization failed. Retrying...')
      }
    }, 800) // 800ms debounce
  }

  // Handle active note changes (Title, Content, Category)
  const handleNoteChange = (fields) => {
    if (!activeNote) return

    const updated = { ...activeNote, ...fields }
    setActiveNote(updated)

    // Update inside note list (optimistic UI update)
    setNotes(prev => prev.map(n => n._id === updated._id ? updated : n))

    // Trigger auto-save
    triggerAutoSave(updated)
  }

  // Handle Create new note
  const handleCreateNote = async () => {
    try {
      const defaultNote = {
        title: 'Untitled Note',
        content: '',
        category: 'General'
      }

      const res = await createNote(defaultNote)
      if (res && res.success && res.note) {
        setNotes(prev => [res.note, ...prev])
        setActiveNote(res.note)
        setMode('write')
        toast.success('New note created.')
      }
    } catch (err) {
      console.error('Failed to create note:', err)
      toast.error('Failed to create note.')
    }
  }

  // Handle Delete note
  const handleDeleteNote = async () => {
    if (!activeNote) return
    const idToDelete = activeNote._id

    try {
      await deleteNote(idToDelete)
      const remaining = notes.filter(n => n._id !== idToDelete)
      setNotes(remaining)
      setActiveNote(remaining.length > 0 ? remaining[0] : null)
      toast.success('Note deleted.')
    } catch (err) {
      console.error('Failed to delete note:', err)
      toast.error('Failed to delete note.')
    }
  }

  // Filter notes list
  const filteredNotes = notes.filter(n => {
    const matchCat = catFilter === 'all' || n.category === catFilter
    const query = searchQuery.toLowerCase().trim()
    const matchSearch = !query ||
      n.title.toLowerCase().includes(query) ||
      (n.content && n.content.toLowerCase().includes(query))
    return matchCat && matchSearch
  })

  // Render loading list skeletons
  if (loading) {
    return (
      <div className="nt-root">
        <div className="nt-sidebar">
          <div className="nt-sb-header">
            <div className="nt-sb-top">
              <div style={{ height: '16px', width: '100px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }} />
            </div>
            <div style={{ height: '30px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', padding: '10px' }}>
            {[1, 2, 3, 4].map(i => (
              <div key={i} style={{ height: '60px', background: 'rgba(255,255,255,0.02)', borderRadius: '4px', marginBottom: '8px' }} />
            ))}
          </div>
        </div>
        <div className="nt-editor-space">
          <div className="nt-empty-editor">
            <div className="nt-sync-spinner" style={{ width: '20px', height: '20px' }} />
          </div>
        </div>
      </div>
    )
  }

  const exportToMarkdown = () => {
    if (!activeNote) {
      toast.error('No note selected to export.')
      return
    }
    const blob = new Blob([activeNote.content || ''], { type: 'text/markdown;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    const safeTitle = (activeNote.title || 'Untitled').toLowerCase().replace(/[^a-z0-9]+/g, '_')
    link.setAttribute('download', `${safeTitle}.md`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Note exported as Markdown! 📤')
  }

  const exportToTXT = () => {
    if (!activeNote) {
      toast.error('No note selected to export.')
      return
    }
    const blob = new Blob([activeNote.content || ''], { type: 'text/plain;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    const safeTitle = (activeNote.title || 'Untitled').toLowerCase().replace(/[^a-z0-9]+/g, '_')
    link.setAttribute('download', `${safeTitle}.txt`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Note exported as plain text! 📤')
  }

  return (
    <div className="nt-root fade-in">
      {/* ── Sidebar Pane ── */}
      <div className="nt-sidebar">
        <div className="nt-sb-header">
          <div className="nt-sb-top">
            <h3 className="nt-sb-title">Memos & Notes</h3>
            <button className="nt-new-btn" onClick={handleCreateNote}>+ Memo</button>
          </div>
          <div className="nt-search-wrap">
            <span className="nt-search-icon">🔍</span>
            <input
              className="nt-search-input"
              placeholder="Search notes..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Categories scroll filters */}
        <div className="nt-cat-filters">
          {['all', 'General', 'Work', 'AI', 'Personal', 'Projects'].map(cat => (
            <button
              key={cat}
              className={`nt-cat-chip ${catFilter === cat ? 'nt-cat-chip-active' : ''}`}
              onClick={() => setCatFilter(cat)}
            >
              {cat === 'all' ? 'All' : cat}
            </button>
          ))}
        </div>

        {/* Notes listing */}
        <div className="nt-list">
          {filteredNotes.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', fontSize: '0.75rem', color: 'rgba(255,255,255,0.25)' }}>
              No notes matched filters.
            </div>
          ) : (
            filteredNotes.map(note => {
              const dateStr = new Date(note.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
              return (
                <div
                  key={note._id}
                  className={`nt-item ${activeNote?._id === note._id ? 'nt-item-active' : ''}`}
                  onClick={() => {
                    // Flush pending save immediately if we switch notes
                    if (saveTimerRef.current) {
                      clearTimeout(saveTimerRef.current)
                      saveTimerRef.current = null
                      setSyncStatus('idle')
                    }
                    setActiveNote(note)
                    setMode('write')
                  }}
                >
                  <p className="nt-item-title">{note.title || 'Untitled Note'}</p>
                  <p className="nt-item-preview">
                    {note.content ? note.content.slice(0, 45) + (note.content.length > 45 ? '...' : '') : 'No content yet...'}
                  </p>
                  <div className="nt-item-meta">
                    <span className="nt-item-cat">{note.category || 'General'}</span>
                    <span>{dateStr}</span>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* ── Editor Workspace Pane ── */}
      <div className="nt-editor-space">
        {activeNote ? (
          <>
            {/* Active Header */}
            <div className="nt-ed-header">
              <input
                className="nt-ed-title-input"
                value={activeNote.title}
                onChange={e => handleNoteChange({ title: e.target.value })}
                placeholder="Enter note title..."
                maxLength={80}
              />

              <div className="nt-ed-controls">
                {/* Sync status */}
                {syncStatus !== 'idle' && (
                  <div className="nt-sync-status">
                    {syncStatus === 'syncing' ? (
                      <>
                        <span className="nt-sync-spinner" />
                        <span>Syncing...</span>
                      </>
                    ) : (
                      <span>✓ Cloud saved</span>
                    )}
                  </div>
                )}

                {/* Category selector */}
                <select
                  className="nt-ed-cat-select"
                  value={activeNote.category || 'General'}
                  onChange={e => handleNoteChange({ category: e.target.value })}
                >
                  <option value="General">General</option>
                  <option value="Work">Work</option>
                  <option value="AI">AI</option>
                  <option value="Personal">Personal</option>
                  <option value="Projects">Projects</option>
                </select>

                {/* Export Dropdown */}
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <button 
                    className="nt-toggle-btn"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(0,212,255,0.1)' }}
                    onClick={() => setShowExportMenu(!showExportMenu)}
                    title="Export note"
                  >
                    📤 Export
                  </button>
                  {showExportMenu && (
                    <div className="glass fade-in" style={{
                      position: 'absolute',
                      top: '38px',
                      right: 0,
                      zIndex: 100,
                      padding: '0.4rem',
                      borderRadius: '0.5rem',
                      background: 'rgba(10, 10, 26, 0.95)',
                      border: '1px solid rgba(0, 212, 255, 0.2)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      width: '120px',
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)'
                    }}>
                      <button 
                        onClick={() => { exportToMarkdown(); setShowExportMenu(false); }}
                        style={{ 
                          background: 'none', 
                          border: 'none', 
                          color: '#e0e0ff', 
                          padding: '0.4rem 0.6rem', 
                          fontSize: '0.75rem', 
                          textAlign: 'left', 
                          cursor: 'pointer', 
                          borderRadius: '4px',
                          transition: 'background 0.2s'
                        }}
                        onMouseEnter={e => e.target.style.background = 'rgba(0,212,255,0.1)'}
                        onMouseLeave={e => e.target.style.background = 'none'}
                      >
                        📝 Markdown (.md)
                      </button>
                      <button 
                        onClick={() => { exportToTXT(); setShowExportMenu(false); }}
                        style={{ 
                          background: 'none', 
                          border: 'none', 
                          color: '#e0e0ff', 
                          padding: '0.4rem 0.6rem', 
                          fontSize: '0.75rem', 
                          textAlign: 'left', 
                          cursor: 'pointer', 
                          borderRadius: '4px',
                          transition: 'background 0.2s'
                        }}
                        onMouseEnter={e => e.target.style.background = 'rgba(0,212,255,0.1)'}
                        onMouseLeave={e => e.target.style.background = 'none'}
                      >
                        📄 Plain Text (.txt)
                      </button>
                    </div>
                  )}
                </div>

                {/* Toggle tab */}
                <div className="nt-toggle-group">
                  <button
                    className={`nt-toggle-btn ${mode === 'write' ? 'nt-toggle-btn-active' : ''}`}
                    onClick={() => setMode('write')}
                  >
                    Write
                  </button>
                  <button
                    className={`nt-toggle-btn ${mode === 'preview' ? 'nt-toggle-btn-active' : ''}`}
                    onClick={() => setMode('preview')}
                  >
                    Preview
                  </button>
                </div>

                {/* Delete button */}
                <button className="nt-del-btn" onClick={handleDeleteNote} title="Delete note">
                  ✕
                </button>
              </div>
            </div>

            {/* Note Editor Area */}
            <div className="nt-body-pane">
              {mode === 'write' ? (
                <textarea
                  className="nt-textarea"
                  value={activeNote.content || ''}
                  onChange={e => handleNoteChange({ content: e.target.value })}
                  placeholder="Start writing markdown: # Header, - bullet, `code`..."
                />
              ) : (
                <div
                  className="nt-preview"
                  dangerouslySetInnerHTML={{ __html: parseMarkdown(activeNote.content) }}
                />
              )}
            </div>
          </>
        ) : (
          <div className="nt-empty-editor">
            <div className="nt-empty-icon">📝</div>
            <h4 className="nt-empty-title">No memo selected</h4>
            <p className="nt-empty-sub">Select an existing note from the sidebar or synchronize a new note structure.</p>
            <button className="ts-submit-btn" style={{ marginTop: '1.25rem' }} onClick={handleCreateNote}>
              + Create Note
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
