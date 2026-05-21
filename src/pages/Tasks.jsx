/**
 * Nexus AI — Tasks Section
 * Upgraded premium productivity system with MongoDB backend persistence.
 */

import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { getTasks, createTask, updateTask, deleteTask as deleteTaskApi } from '../api/tasks'
import './Tasks.css'

const BLANK_FORM = {
  title: '',
  description: '',
  priority: 'medium',
  category: 'work',
  dueDate: '',
}

const PRIORITY_CONFIG = {
  high:   { label: 'High',   color: '#ef4444', bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.22)'   },
  medium: { label: 'Medium', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.22)'  },
  low:    { label: 'Low',    color: '#10b981', bg: 'rgba(16,185,129,0.1)',   border: 'rgba(16,185,129,0.2)'   },
}

const CATEGORY_CONFIG = {
  work:     { label: '💼 Work',     color: '#00d4ff' },
  ai:       { label: '🤖 AI',       color: '#a855f7' },
  personal: { label: '🌟 Personal', color: '#10b981' },
  projects: { label: '⬟ Projects',  color: '#f59e0b' },
}

const formatDate = (iso) => {
  if (!iso) return null
  const d = new Date(iso + 'T00:00:00')
  const today = new Date(); today.setHours(0,0,0,0)
  const diff = Math.floor((d - today) / 86400000)
  if (diff === 0) return { label: 'Today',     urgent: true  }
  if (diff === 1) return { label: 'Tomorrow',  urgent: false }
  if (diff < 0)  return { label: 'Overdue',    urgent: true  }
  return { label: d.toLocaleDateString('en-US', { month:'short', day:'numeric' }), urgent: false }
}

const mapTaskFromBackend = (t) => ({
  id: t._id,
  title: t.title,
  description: t.description || '',
  priority: t.priority || 'medium',
  category: t.category || 'work',
  dueDate: t.dueDate ? new Date(t.dueDate).toISOString().slice(0, 10) : '',
  done: t.completed || false,
  createdAt: t.createdAt
})

export default function TasksSection() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Search and Filter states
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const [catFilter, setCatFilter] = useState('all')
  const [priFilter, setPriFilter] = useState('all')

  // Modals visibility states
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)

  // Forms and selected entities
  const [createForm, setCreateForm] = useState(BLANK_FORM)
  const [editingTask, setEditingTask] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [formError, setFormError] = useState('')

  const { token } = useAuth()
  const toast = useToast()

  // Command palette event bridge
  useEffect(() => {
    const triggerCreate = () => setShowCreateModal(true)
    window.addEventListener('nx-open-task-create', triggerCreate)
    return () => window.removeEventListener('nx-open-task-create', triggerCreate)
  }, [])

  // Load tasks on mount
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true)
        setError('')
        const res = await getTasks()
        if (res && res.success && Array.isArray(res.tasks)) {
          setTasks(res.tasks.map(mapTaskFromBackend))
        }
      } catch (err) {
        console.error('Failed to load user tasks:', err)
        setError('Server communication issue: Failed to fetch tasks.')
        toast.error('Failed to synchronize tasks from server.')
      } finally {
        setLoading(false)
      }
    }
    fetchTasks()
  }, [token])

  // Computed counters
  const total = tasks.length
  const completed = tasks.filter(t => t.done).length
  const pending = total - completed
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0

  // Filtered and searched task list
  const filtered = tasks.filter(t => {
    const matchStatus = filter === 'all' ? true : filter === 'pending' ? !t.done : t.done
    const matchCat = catFilter === 'all' || t.category === catFilter
    const matchPri = priFilter === 'all' || t.priority === priFilter

    const query = searchQuery.toLowerCase().trim()
    const matchSearch = !query ||
      t.title.toLowerCase().includes(query) ||
      t.description.toLowerCase().includes(query)

    return matchStatus && matchCat && matchPri && matchSearch
  })

  const pendingList = filtered.filter(t => !t.done)
  const completedList = filtered.filter(t => t.done)

  // Handle task completion toggle
  const toggleDone = useCallback(async (id) => {
    const target = tasks.find(t => t.id === id)
    if (!target) return

    const newCompleted = !target.done
    // Optimistic Update
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: newCompleted } : t))

    try {
      await updateTask(id, { completed: newCompleted })
      toast.success(newCompleted ? 'Task marked as completed! 🎉' : 'Task restored to pending.')
    } catch (err) {
      console.error('Failed to update task:', err)
      toast.error('Failed to update task completion.')
      // Rollback
      setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !newCompleted } : t))
    }
  }, [tasks, toast])

  // Handle Create Task submission
  const handleCreateSubmit = async (e) => {
    e.preventDefault()
    if (!createForm.title.trim()) {
      setFormError('Task title is required.')
      return
    }

    try {
      setFormError('')
      const res = await createTask({
        title: createForm.title.trim(),
        description: createForm.description.trim(),
        priority: createForm.priority,
        category: createForm.category,
        dueDate: createForm.dueDate || undefined,
      })

      if (res && res.success && res.task) {
        const mapped = mapTaskFromBackend(res.task)
        setTasks(prev => [mapped, ...prev])
        setCreateForm(BLANK_FORM)
        setShowCreateModal(false)
        toast.success('Task created successfully! ⚡')
      }
    } catch (err) {
      console.error('Failed to create task:', err)
      setFormError(err.message || 'Server connection failure.')
      toast.error('Failed to create task.')
    }
  }

  // Handle Edit Modal Trigger
  const handleOpenEdit = (task) => {
    setEditingTask({ ...task })
    setFormError('')
    setShowEditModal(true)
  }

  // Handle Edit Task submission
  const handleEditSubmit = async (e) => {
    e.preventDefault()
    if (!editingTask.title.trim()) {
      setFormError('Task title is required.')
      return
    }

    try {
      setFormError('')
      const res = await updateTask(editingTask.id, {
        title: editingTask.title.trim(),
        description: editingTask.description.trim(),
        priority: editingTask.priority,
        category: editingTask.category,
        dueDate: editingTask.dueDate || undefined,
      })

      if (res && res.success && res.task) {
        const mapped = mapTaskFromBackend(res.task)
        setTasks(prev => prev.map(t => t.id === editingTask.id ? mapped : t))
        setEditingTask(null)
        setShowEditModal(false)
        toast.success('Task updated successfully! ⚙️')
      }
    } catch (err) {
      console.error('Failed to update task:', err)
      setFormError(err.message || 'Server connection failure.')
      toast.error('Failed to update task details.')
    }
  }

  // Handle Delete Modal Trigger
  const handleOpenDelete = (id) => {
    setDeletingId(id)
    setShowDeleteModal(true)
  }

  // Handle Delete Task execution
  const handleDeleteConfirm = async () => {
    if (!deletingId) return
    const targetId = deletingId

    try {
      // Set local exiting animation
      setTasks(prev => prev.map(t => t.id === targetId ? { ...t, isDeleting: true } : t))
      setShowDeleteModal(false)
      setDeletingId(null)

      await deleteTaskApi(targetId)
      setTimeout(() => {
        setTasks(prev => prev.filter(t => t.id !== targetId))
        toast.success('Task deleted successfully.')
      }, 300)
    } catch (err) {
      console.error('Failed to delete task:', err)
      toast.error('Failed to delete task.')
      setTasks(prev => prev.map(t => t.id === targetId ? { ...t, isDeleting: false } : t))
    }
  }

  // Batch delete completed tasks
  const handleClearCompleted = async () => {
    const completedTasks = tasks.filter(t => t.done)
    if (completedTasks.length === 0) return

    try {
      await Promise.all(completedTasks.map(t => deleteTaskApi(t.id)))
      setTasks(prev => prev.filter(t => !t.done))
      toast.success('Cleared completed tasks list.')
    } catch (err) {
      console.error('Failed to batch delete completed tasks:', err)
      toast.error('Failed to clear all completed tasks.')
    }
  }

  // Render loading skeletons
  if (loading) {
    return (
      <div className="ts-root">
        <div className="ts-page-header">
          <div>
            <div style={{ height: '32px', width: '220px', background: 'rgba(255,255,255,0.06)', borderRadius: '6px', animation: 'pulse 1.5s ease-in-out infinite' }} />
            <div style={{ height: '14px', width: '320px', background: 'rgba(255,255,255,0.03)', borderRadius: '4px', marginTop: '8px', animation: 'pulse 1.5s ease-in-out infinite' }} />
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '2rem' }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="ts-skeleton-card">
              <div className="ts-skeleton-shimmer" />
              <div className="ts-skeleton-line" style={{ height: '16px', width: `${60 + i * 8}%` }} />
              <div className="ts-skeleton-line" style={{ height: '12px', width: '40%', marginTop: '6px' }} />
            </div>
          ))}
        </div>
      </div>
    )
  }

  const exportToCSV = () => {
    if (tasks.length === 0) {
      toast.error('No tasks to export.')
      return
    }
    const headers = ['ID', 'Title', 'Description', 'Priority', 'Category', 'Due Date', 'Status']
    const rows = tasks.map(t => [
      t.id,
      `"${t.title.replace(/"/g, '""')}"`,
      `"${t.description.replace(/"/g, '""')}"`,
      t.priority,
      t.category,
      t.dueDate || 'N/A',
      t.done ? 'Completed' : 'Pending'
    ])
    
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.setAttribute('download', `NexusAI_Tasks_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Tasks exported to CSV! 📤')
  }

  const exportToJSON = () => {
    if (tasks.length === 0) {
      toast.error('No tasks to export.')
      return
    }
    const jsonStr = JSON.stringify(tasks, null, 2)
    const blob = new Blob([jsonStr], { type: 'application/json' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.setAttribute('download', `NexusAI_Tasks_${new Date().toISOString().slice(0, 10)}.json`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Tasks exported to JSON! 📤')
  }

  return (
    <div className="ts-root">
      {error && (
        <div className="ts-form-error" style={{ marginBottom: '1.5rem' }}>
          <span>⚠</span> {error}
        </div>
      )}

      {/* ── Page Header ── */}
      <div className="ts-page-header fade-in">
        <div>
          <h1 className="ts-page-title">Task Manager</h1>
          <p className="ts-page-sub">Track, prioritize, and optimize your goal structures.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', position: 'relative', alignItems: 'center' }}>
          <button 
            className="ts-add-main-btn" 
            style={{ 
              background: 'rgba(255,255,255,0.04)', 
              border: '1px solid rgba(0, 212, 255, 0.15)', 
              color: '#00d4ff' 
            }} 
            onClick={() => setShowExportMenu(!showExportMenu)}
          >
            📤 Export
          </button>
          
          {showExportMenu && (
            <div className="glass fade-in" style={{
              position: 'absolute',
              top: '50px',
              right: '150px',
              zIndex: 100,
              padding: '0.4rem',
              borderRadius: '0.625rem',
              background: 'rgba(10, 10, 26, 0.95)',
              border: '1px solid rgba(0, 212, 255, 0.2)',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              width: '130px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)'
            }}>
              <button 
                onClick={() => { exportToCSV(); setShowExportMenu(false); }}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: '#e0e0ff', 
                  padding: '0.5rem 0.75rem', 
                  fontSize: '0.75rem', 
                  textAlign: 'left', 
                  cursor: 'pointer', 
                  borderRadius: '0.375rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={e => e.target.style.background = 'rgba(0,212,255,0.1)'}
                onMouseLeave={e => e.target.style.background = 'none'}
              >
                📊 CSV format
              </button>
              <button 
                onClick={() => { exportToJSON(); setShowExportMenu(false); }}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: '#e0e0ff', 
                  padding: '0.5rem 0.75rem', 
                  fontSize: '0.75rem', 
                  textAlign: 'left', 
                  cursor: 'pointer', 
                  borderRadius: '0.375rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={e => e.target.style.background = 'rgba(0,212,255,0.1)'}
                onMouseLeave={e => e.target.style.background = 'none'}
              >
                ⚙️ JSON format
              </button>
            </div>
          )}

          <button className="ts-add-main-btn" onClick={() => setShowCreateModal(true)}>
            <span className="ts-add-icon">+</span>
            Create Task
          </button>
        </div>
      </div>

      {/* ── Progress Stats Bar ── */}
      <div className="ts-stats-bar fade-in">
        <div className="ts-stat-pill ts-stat-total">
          <span className="ts-stat-num">{total}</span>
          <span className="ts-stat-lbl">Total</span>
        </div>
        <div className="ts-stat-pill ts-stat-pending">
          <span className="ts-stat-num">{pending}</span>
          <span className="ts-stat-lbl">Pending</span>
        </div>
        <div className="ts-stat-pill ts-stat-done">
          <span className="ts-stat-num">{completed}</span>
          <span className="ts-stat-lbl">Completed</span>
        </div>

        {/* Progress bar */}
        <div className="ts-progress-wrap">
          <div className="ts-progress-labels">
            <span className="ts-progress-txt">SaaS Optimization Progress</span>
            <span className="ts-progress-pct">{pct}%</span>
          </div>
          <div className="ts-progress-track">
            <div className="ts-progress-fill" style={{ width: `${pct}%` }} />
            {pct > 0 && <div className="ts-progress-glow" style={{ left: `${pct}%` }} />}
          </div>
        </div>
      </div>

      {/* ── Live Search & Filters ── */}
      <div className="ts-filters fade-in">
        {/* Search */}
        <div className="ts-search-container">
          <span className="ts-search-ico-box">🔍</span>
          <input
            className="ts-search-input"
            placeholder="Search tasks by title or descriptions..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Status filters */}
        <div className="ts-filter-group">
          {['all', 'pending', 'completed'].map(f => (
            <button
              key={f}
              className={`ts-filter-btn ${filter === f ? 'ts-filter-active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? 'All Tasks' : f === 'pending' ? `Pending (${pending})` : `Done (${completed})`}
            </button>
          ))}
        </div>

        {/* Category filters */}
        <div className="ts-filter-group">
          <button className={`ts-cat-btn ${catFilter === 'all' ? 'ts-cat-active' : ''}`} onClick={() => setCatFilter('all')}>All Categories</button>
          {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => (
            <button
              key={key}
              className={`ts-cat-btn ${catFilter === key ? 'ts-cat-active' : ''}`}
              style={catFilter === key ? { borderColor: cfg.color, color: cfg.color } : {}}
              onClick={() => setCatFilter(key)}
            >
              {cfg.label}
            </button>
          ))}
        </div>

        {/* Priority filters */}
        <div className="ts-filter-group">
          <button className={`ts-pri-btn ${priFilter === 'all' ? 'ts-pri-active' : ''}`} onClick={() => setPriFilter('all')}>Any Priority</button>
          {Object.entries(PRIORITY_CONFIG).map(([key, cfg]) => (
            <button
              key={key}
              className={`ts-pri-btn ${priFilter === key ? 'ts-pri-active' : ''}`}
              style={priFilter === key ? { borderColor: cfg.color, color: cfg.color, background: cfg.bg } : {}}
              onClick={() => setPriFilter(key)}
            >
              {cfg.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Empty State ── */}
      {filtered.length === 0 && (
        <div className="ts-empty fade-in">
          <div className="ts-empty-icon">✦</div>
          <h3 className="ts-empty-title">No tasks found</h3>
          <p className="ts-empty-sub">
            {tasks.length === 0
              ? 'No tasks yet — start optimizing your workflow by creating a task.'
              : 'Try calibrating your search terms or filter constraints.'}
          </p>
          <button className="ts-submit-btn" onClick={() => setShowCreateModal(true)}>+ Create Task</button>
        </div>
      )}

      {/* ── Pending Tasks ── */}
      {pendingList.length > 0 && (
        <section className="ts-section fade-in">
          <div className="ts-section-hdr">
            <h2 className="ts-section-title">
              <span className="ts-section-dot ts-dot-pending" />
              Pending
              <span className="ts-count-badge">{pendingList.length}</span>
            </h2>
          </div>
          <div className="ts-card-list">
            {pendingList.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onToggle={toggleDone}
                onEdit={handleOpenEdit}
                onDelete={handleOpenDelete}
                isDeleting={task.isDeleting}
              />
            ))}
          </div>
        </section>
      )}

      {/* ── Completed Tasks ── */}
      {completedList.length > 0 && (
        <section className="ts-section fade-in">
          <div className="ts-section-hdr">
            <h2 className="ts-section-title">
              <span className="ts-section-dot ts-dot-done" />
              Completed
              <span className="ts-count-badge ts-count-done">{completedList.length}</span>
            </h2>
            <button className="ts-clear-btn" onClick={handleClearCompleted}>Clear Completed</button>
          </div>
          <div className="ts-card-list">
            {completedList.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onToggle={toggleDone}
                onEdit={handleOpenEdit}
                onDelete={handleOpenDelete}
                isDeleting={task.isDeleting}
              />
            ))}
          </div>
        </section>
      )}

      {/* ── CREATE TASK MODAL ── */}
      {showCreateModal && (
        <div className="nx-modal-overlay">
          <div className="nx-modal">
            <div className="nx-modal-header">
              <h2 className="nx-modal-title">✦ Create Task</h2>
              <button className="nx-modal-close" onClick={() => setShowCreateModal(false)}>✕</button>
            </div>

            <form onSubmit={handleCreateSubmit}>
              {formError && (
                <div className="ts-form-error"><span>⚠</span> {formError}</div>
              )}

              <div className="ts-field">
                <label className="ts-label">Task Title <span className="ts-required">*</span></label>
                <div className="ts-input-wrap">
                  <span className="ts-input-icon">✦</span>
                  <input
                    className="ts-input"
                    placeholder="Enter task objective..."
                    value={createForm.title}
                    onChange={e => setCreateForm({ ...createForm, title: e.target.value })}
                    maxLength={80}
                    autoFocus
                  />
                </div>
              </div>

              <div className="ts-field">
                <label className="ts-label">Description <span className="ts-optional">(optional)</span></label>
                <div className="ts-input-wrap ts-textarea-wrap">
                  <textarea
                    className="ts-input ts-textarea"
                    placeholder="Provide detailed description..."
                    value={createForm.description}
                    onChange={e => setCreateForm({ ...createForm, description: e.target.value })}
                    rows={3}
                    maxLength={300}
                  />
                </div>
              </div>

              <div className="ts-field-row">
                <div className="ts-field">
                  <label className="ts-label">Priority</label>
                  <div className="ts-input-wrap ts-select-wrap">
                    <span className="ts-input-icon">⚡</span>
                    <select
                      className="ts-input ts-select"
                      value={createForm.priority}
                      onChange={e => setCreateForm({ ...createForm, priority: e.target.value })}
                    >
                      <option value="high">🔴 High</option>
                      <option value="medium">🟡 Medium</option>
                      <option value="low">🟢 Low</option>
                    </select>
                  </div>
                </div>

                <div className="ts-field">
                  <label className="ts-label">Category</label>
                  <div className="ts-input-wrap ts-select-wrap">
                    <span className="ts-input-icon">◈</span>
                    <select
                      className="ts-input ts-select"
                      value={createForm.category}
                      onChange={e => setCreateForm({ ...createForm, category: e.target.value })}
                    >
                      <option value="work">💼 Work</option>
                      <option value="ai">🤖 AI</option>
                      <option value="personal">🌟 Personal</option>
                      <option value="projects">⬟ Projects</option>
                    </select>
                  </div>
                </div>

                <div className="ts-field">
                  <label className="ts-label">Due Date</label>
                  <div className="ts-input-wrap">
                    <span className="ts-input-icon">📅</span>
                    <input
                      type="date"
                      className="ts-input ts-date"
                      value={createForm.dueDate}
                      onChange={e => setCreateForm({ ...createForm, dueDate: e.target.value })}
                      min={new Date().toISOString().slice(0, 10)}
                    />
                  </div>
                </div>
              </div>

              <div className="ts-form-actions">
                <button type="button" className="ts-cancel-btn" onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button type="submit" className="ts-submit-btn">✦ Add Task</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── EDIT TASK MODAL ── */}
      {showEditModal && editingTask && (
        <div className="nx-modal-overlay">
          <div className="nx-modal">
            <div className="nx-modal-header">
              <h2 className="nx-modal-title">⚙️ Edit Task</h2>
              <button className="nx-modal-close" onClick={() => { setShowEditModal(false); setEditingTask(null); }}>✕</button>
            </div>

            <form onSubmit={handleEditSubmit}>
              {formError && (
                <div className="ts-form-error"><span>⚠</span> {formError}</div>
              )}

              <div className="ts-field">
                <label className="ts-label">Task Title <span className="ts-required">*</span></label>
                <div className="ts-input-wrap">
                  <span className="ts-input-icon">✦</span>
                  <input
                    className="ts-input"
                    value={editingTask.title}
                    onChange={e => setEditingTask({ ...editingTask, title: e.target.value })}
                    maxLength={80}
                    autoFocus
                  />
                </div>
              </div>

              <div className="ts-field">
                <label className="ts-label">Description <span className="ts-optional">(optional)</span></label>
                <div className="ts-input-wrap ts-textarea-wrap">
                  <textarea
                    className="ts-input ts-textarea"
                    value={editingTask.description}
                    onChange={e => setEditingTask({ ...editingTask, description: e.target.value })}
                    rows={3}
                    maxLength={300}
                  />
                </div>
              </div>

              <div className="ts-field-row">
                <div className="ts-field">
                  <label className="ts-label">Priority</label>
                  <div className="ts-input-wrap ts-select-wrap">
                    <span className="ts-input-icon">⚡</span>
                    <select
                      className="ts-input ts-select"
                      value={editingTask.priority}
                      onChange={e => setEditingTask({ ...editingTask, priority: e.target.value })}
                    >
                      <option value="high">🔴 High</option>
                      <option value="medium">🟡 Medium</option>
                      <option value="low">🟢 Low</option>
                    </select>
                  </div>
                </div>

                <div className="ts-field">
                  <label className="ts-label">Category</label>
                  <div className="ts-input-wrap ts-select-wrap">
                    <span className="ts-input-icon">◈</span>
                    <select
                      className="ts-input ts-select"
                      value={editingTask.category}
                      onChange={e => setEditingTask({ ...editingTask, category: e.target.value })}
                    >
                      <option value="work">💼 Work</option>
                      <option value="ai">🤖 AI</option>
                      <option value="personal">🌟 Personal</option>
                      <option value="projects">⬟ Projects</option>
                    </select>
                  </div>
                </div>

                <div className="ts-field">
                  <label className="ts-label">Due Date</label>
                  <div className="ts-input-wrap">
                    <span className="ts-input-icon">📅</span>
                    <input
                      type="date"
                      className="ts-input ts-date"
                      value={editingTask.dueDate}
                      onChange={e => setEditingTask({ ...editingTask, dueDate: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="ts-form-actions">
                <button type="button" className="ts-cancel-btn" onClick={() => { setShowEditModal(false); setEditingTask(null); }}>Cancel</button>
                <button type="submit" className="ts-submit-btn">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── DELETE CONFIRMATION MODAL ── */}
      {showDeleteModal && (
        <div className="nx-modal-overlay">
          <div className="nx-modal" style={{ maxWidth: '420px' }}>
            <div className="nx-modal-header">
              <h2 className="nx-modal-title">⚠ Confirm Deletion</h2>
              <button className="nx-modal-close" onClick={() => { setShowDeleteModal(false); setDeletingId(null); }}>✕</button>
            </div>
            <p style={{ fontSize: '0.875rem', lineHeight: '1.5', color: 'rgba(255,255,255,0.7)', margin: '0 0 1.5rem 0' }}>
              Are you sure you want to permanently delete this task? This action is irreversible.
            </p>
            <div className="ts-form-actions" style={{ border: 'none', paddingTop: 0, marginTop: 0 }}>
              <button type="button" className="ts-cancel-btn" onClick={() => { setShowDeleteModal(false); setDeletingId(null); }}>Cancel</button>
              <button
                type="button"
                className="ts-submit-btn"
                style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', color: '#fff', boxShadow: '0 0 16px rgba(239, 68, 68, 0.4)' }}
                onClick={handleDeleteConfirm}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function TaskCard({ task, onToggle, onEdit, onDelete, isDeleting }) {
  const pri = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium
  const cat = CATEGORY_CONFIG[task.category] || CATEGORY_CONFIG.work
  const due = task.dueDate ? formatDate(task.dueDate) : null

  return (
    <div
      className={`ts-card ${task.done ? 'ts-card-done' : ''} ${isDeleting ? 'ts-card-exit' : ''}`}
      style={{ '--pri-color': pri.color, '--pri-glow': pri.bg }}
    >
      <div className="ts-card-accent" style={{ background: pri.color, boxShadow: `0 0 8px ${pri.color}88` }} />

      <button
        className={`ts-chk ${task.done ? 'ts-chk-on' : ''}`}
        onClick={() => onToggle(task.id)}
        title={task.done ? 'Mark pending' : 'Mark done'}
        style={task.done ? { background: 'rgba(16, 185, 129, 0.2)', borderColor: '#10b981', boxShadow: '0 0 10px rgba(16, 185, 129, 0.3)' } : {}}
      >
        {task.done && <span className="ts-chk-mark">✓</span>}
      </button>

      <div className="ts-card-body">
        <div className="ts-card-top">
          <p className={`ts-card-title ${task.done ? 'ts-title-done' : ''}`}>{task.title}</p>
          <div className="ts-card-badges">
            <span className="ts-badge" style={{ color: pri.color, background: pri.bg, border: `1px solid ${pri.border}` }}>
              {pri.label}
            </span>
            <span className="ts-badge ts-cat-badge" style={{ color: cat.color, background: `${cat.color}14`, border: `1px solid ${cat.color}33` }}>
              {cat.label}
            </span>
            {due && (
              <span className={`ts-badge ts-due-badge ${due.urgent ? 'ts-due-urgent' : ''}`}>
                📅 {due.label}
              </span>
            )}
          </div>
        </div>
        {task.description && <p className="ts-card-desc">{task.description}</p>}
      </div>

      <div className="ts-card-opts">
        <button className="ts-edit-btn" onClick={() => onEdit(task)} title="Edit task">
          ✏️
        </button>
        <button className="ts-delete-btn" onClick={() => onDelete(task.id)} title="Delete task">
          ✕
        </button>
      </div>
    </div>
  )
}
