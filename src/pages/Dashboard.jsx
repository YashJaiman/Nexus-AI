import React, { useState, useEffect, useRef, useCallback, Suspense, lazy } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useNotifications } from '../context/NotificationContext'
import { getTasks as fetchTasksApi, updateTask as updateTaskApi } from '../api/tasks'
import { getDashboardStats } from '../api/analytics'
import ThemeToggle from '../components/ThemeToggle'
import NotificationDropdown from '../components/NotificationDropdown'
import CommandPalette from '../components/CommandPalette'
import { PROJECTS } from '../data/projects'
import { getAvatarTemplate } from '../data/avatars'
import './Dashboard.css'

// Lazy-load subpage panels for optimized code splitting
const TasksSection = lazy(() => import('./Tasks'))
const AiAssistantSection = lazy(() => import('./AiAssistant'))
const NotesSection = lazy(() => import('./Notes'))
const AnalyticsSection = lazy(() => import('./Analytics'))
const SettingsSection = lazy(() => import('./Settings'))
const ProjectsSection = lazy(() => import('./Projects'))

/* ─────────────────────────────────────────
   Static Data
───────────────────────────────────────── */
const NAV = [
  { id: 'dashboard', icon: '⬡', label: 'Dashboard'    },
  { id: 'ai',        icon: '🤖', label: 'AI Assistant'  },
  { id: 'tasks',     icon: '✦',  label: 'Tasks'          },
  { id: 'notes',     icon: '◈',  label: 'Notes'          },
  { id: 'analytics', icon: '◉',  label: 'Analytics'      },
  { id: 'projects',  icon: '⬟',  label: 'Projects'       },
  { id: 'settings',  icon: '⚙',  label: 'Settings'       },
]

const STATS = [
  { label: 'AI Requests',       value: '18.4K', delta: '+34%', up: true,  icon: '🤖', color: '#00d4ff', glow: 'rgba(0,212,255,0.35)',   bg: 'rgba(0,212,255,0.08)',   pct: 88 },
  { label: 'Tasks Completed',   value: '284',   delta: '+12%', up: true,  icon: '✦',  color: '#a855f7', glow: 'rgba(168,85,247,0.35)',  bg: 'rgba(168,85,247,0.08)',  pct: 74 },
  { label: 'Productivity Score',value: '96.2%', delta: '+5%',  up: true,  icon: '◉',  color: '#10b981', glow: 'rgba(16,185,129,0.35)',  bg: 'rgba(16,185,129,0.08)',  pct: 96 },
  { label: 'Active Projects',   value: '12',    delta: '-2',   up: false, icon: '⬟',  color: '#f59e0b', glow: 'rgba(245,158,11,0.35)',  bg: 'rgba(245,158,11,0.08)',  pct: 60 },
]

/* Helper to map Mongoose Task fields to Dashboard display format */
const mapTaskForDashboard = (t) => ({
  id: t._id,
  title: t.title,
  priority: t.priority || 'medium',
  category: t.category || 'work',
  done: t.completed || false,
  due: t.dueDate ? formatDueLabel(t.dueDate) : 'No date',
  project: t.category ? t.category.charAt(0).toUpperCase() + t.category.slice(1) : 'General',
})

const formatDueLabel = (iso) => {
  const d = new Date(iso)
  const today = new Date(); today.setHours(0,0,0,0)
  const diff = Math.floor((d - today) / 86400000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  if (diff === -1) return 'Yesterday'
  if (diff < -1) return `${Math.abs(diff)}d ago`
  return d.toLocaleDateString('en-US', { month:'short', day:'numeric' })
}

const AI_ACTIVITIES = [
  { id:1, model:'GPT-4 Turbo',  task:'Summarising Q4 Revenue Report',     time:'2m ago',  status:'running', tokens:'2.4K'  },
  { id:2, model:'NexusVision',  task:'Image classification batch (1.2K)',  time:'8m ago',  status:'done',    tokens:'11.1K' },
  { id:3, model:'CodePilot v3', task:'Auth module refactoring',            time:'15m ago', status:'done',    tokens:'5.6K'  },
  { id:4, model:'SentimentAI',  task:'Customer feedback sentiment scan',   time:'1h ago',  status:'queued',  tokens:'—'     },
]

const AI_CHAT = [
  { role:'ai',   text:'Hello Alex! How can I help you today?' },
  { role:'user', text:'Summarise the Q4 performance report.' },
  { role:'ai',   text:'Sure! Q4 revenue grew 28% YoY reaching $4.2M. Top growth driver: Enterprise plan (+41%). Churn dropped to 1.4%. Shall I generate a full PDF report?' },
]

const QUICK_PROMPTS = ['📊 Generate Report','✦ Add New Task','📝 Create Note','⬟ New Project','⚡ Run Analysis','🔍 Deep Search']

const CHART_MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const CHART_AI  = [30,45,38,60,52,75,68,82,71,90,84,95]
const CHART_TASK= [20,35,28,48,40,58,55,65,60,72,68,80]

const DONUT = [
  { label:'Development', pct:42, color:'#00d4ff' },
  { label:'Design',      pct:28, color:'#a855f7' },
  { label:'Research',    pct:18, color:'#10b981' },
  { label:'Meetings',    pct:12, color:'#f59e0b' },
]

/* helper */
function getGreeting() {
  const h = new Date().getHours()
  return h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening'
}

/* ─────────────────────────────────────────
   Component
───────────────────────────────────────── */
export default function Dashboard() {
  const { user, token, logout }       = useAuth()
  const { toggleTheme }               = useTheme()
  const { unreadCount, addNotification } = useNotifications()
  const navigate                      = useNavigate()
  const [activeNav,   setActiveNav]   = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileOpen,  setMobileOpen]  = useState(false)
  const [tasks,       setTasks]       = useState([])
  const [tasksLoading, setTasksLoading] = useState(true)
  const [dbStats,     setDbStats]     = useState(null)
  const [dbStatsLoading, setDbStatsLoading] = useState(true)
  const [notifOpen,   setNotifOpen]   = useState(false)
  const [cmdPaletteOpen, setCmdPaletteOpen] = useState(false)
  const [aiInput,     setAiInput]     = useState('')
  const [aiMessages,  setAiMessages]  = useState(AI_CHAT)
  const [aiTyping,    setAiTyping]    = useState(false)
  const [time,        setTime]        = useState(new Date())
  const [initialPrompt, setInitialPrompt] = useState(null)
  const chatEndRef = useRef(null)
  const avatarTemplate = getAvatarTemplate(user?.avatar)

  /* Live clock */
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  /* Keyboard shortcut for spotlight command palette */
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setCmdPaletteOpen(prev => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  /* Fetch dashboard analytics KPIs */
  useEffect(() => {
    if (activeNav !== 'dashboard' || !token) return
    let cancelled = false
    const fetchStats = async () => {
      try {
        setDbStatsLoading(true)
        const res = await getDashboardStats()
        if (!cancelled && res?.success && res?.stats) {
          setDbStats(res.stats)
        }
      } catch (err) {
        console.error('[Dashboard Stats] Failed to fetch stats:', err)
      } finally {
        if (!cancelled) setDbStatsLoading(false)
      }
    }
    fetchStats()
    return () => { cancelled = true }
  }, [activeNav, token])

  /* Scroll chat to bottom */
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [aiMessages])

  /* Fetch tasks from backend API when dashboard is active */
  useEffect(() => {
    if (activeNav !== 'dashboard' || !token) return
    let cancelled = false
    const loadTasks = async () => {
      try {
        setTasksLoading(true)
        const res = await fetchTasksApi()
        if (!cancelled && res?.success && Array.isArray(res.tasks)) {
          setTasks(res.tasks.map(mapTaskForDashboard))
        }
      } catch (err) {
        console.error('[Dashboard] Failed to fetch tasks:', err)
      } finally {
        if (!cancelled) setTasksLoading(false)
      }
    }
    loadTasks()
    return () => { cancelled = true }
  }, [activeNav, token])

  const toggleTask = useCallback(async (id) => {
    const target = tasks.find(t => t.id === id)
    if (!target) return
    const newDone = !target.done
    // Optimistic UI update
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: newDone } : t))
    try {
      await updateTaskApi(id, { completed: newDone })
      addNotification(
        'success',
        newDone ? 'Task Completed' : 'Task Re-opened',
        `"${target.title}" status has been modified.`
      )
    } catch (err) {
      console.error('[Dashboard] Failed to toggle task:', err)
      // Rollback on failure
      setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !newDone } : t))
    }
  }, [tasks, addNotification])

  const handleLogout = () => { logout(); navigate('/', { replace: true }) }

  const displayName = user?.fullName || user?.name || 'Alex Rivera'
  const displayAv = avatarTemplate?.emoji || displayName.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()
  const avatarStyle = avatarTemplate?.gradient ? { background: avatarTemplate.gradient } : undefined
  const activeProjectCount = PROJECTS.filter((project) => project.status === 'active').length

  const sendAiMessage = (text) => {
    if (!text.trim()) return
    const userMsg = { role: 'user', text }
    setAiMessages(prev => [...prev, userMsg])
    setAiInput('')
    setAiTyping(true)
    setTimeout(() => {
      setAiMessages(prev => [...prev, { role: 'ai', text: `Processing: "${text.slice(0,40)}…" — I'll have that ready for you shortly.` }])
      setAiTyping(false)
    }, 1600)
  }

  const done = tasks.filter(t => t.done).length
  const fmt  = (d) => d.toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit', second:'2-digit' })

  const handleQuickAction = (label) => {
    const actionMap = {
      'Create Task': {
        nav: 'tasks',
        notice: ['success', 'Task workspace ready', 'Opening Tasks so you can create and organize work items.']
      },
      'AI Report': {
        nav: 'ai',
        prompt: 'Generate a concise Nexus AI workspace report using current activity, including tasks, projects, notes, and top priorities.',
        notice: ['info', 'AI report queued', 'Opening AI Assistant with a contextual reporting prompt.']
      },
      'Add Note': {
        nav: 'notes',
        notice: ['success', 'Notes workspace ready', 'Opening Notes to capture your next memo.']
      },
      'New Project': {
        nav: 'projects',
        notice: ['info', 'Projects view ready', 'Opening Projects to review active initiatives.']
      },
      'Run Analytics': {
        nav: 'ai',
        prompt: 'Analyze my workspace metrics and suggest 3 concrete improvements based on completion ratio, note volume, and project progress.',
        notice: ['info', 'Analytics prompt queued', 'Opening AI Assistant with an analytics-focused prompt.']
      },
      'Export Data': {
        nav: 'analytics',
        notice: ['info', 'Analytics workspace ready', 'Open Analytics to review export-ready metrics.']
      }
    }

    const selected = actionMap[label]
    if (!selected) return

    if (selected.prompt) {
      setInitialPrompt(selected.prompt)
    }
    setActiveNav(selected.nav)

    if (selected.notice) {
      const [type, title, message] = selected.notice
      addNotification(type, title, message)
    }
  }

  const dynamicStats = [
    { 
      label: 'Workflow Score',       
      value: `${dbStats ? dbStats.doneRatio : 0}%`, 
      delta: 'Optimal', 
      up: true,  
      icon: '📈', 
      color: '#00d4ff', 
      glow: 'rgba(0,212,255,0.35)',   
      bg: 'rgba(0,212,255,0.08)',   
      pct: dbStats ? dbStats.doneRatio : 0 
    },
    { 
      label: 'Tasks Completed',   
      value: `${dbStats ? dbStats.completedTasks : 0}/${dbStats ? dbStats.totalTasks : 0}`,   
      delta: `${dbStats && dbStats.totalTasks > 0 ? Math.round((dbStats.completedTasks / dbStats.totalTasks) * 100) : 0}%`, 
      up: true,  
      icon: '✦',  
      color: '#a855f7', 
      glow: 'rgba(168,85,247,0.35)',  
      bg: 'rgba(168,85,247,0.08)',  
      pct: dbStats && dbStats.totalTasks > 0 ? Math.round((dbStats.completedTasks / dbStats.totalTasks) * 100) : 0 
    },
    { 
      label: 'Saved Memos',
      value: `${dbStats ? dbStats.totalNotes : 0}`, 
      delta: 'Active',  
      up: true,  
      icon: '📝',  
      color: '#10b981', 
      glow: 'rgba(16,185,129,0.35)',  
      bg: 'rgba(16,185,129,0.08)',  
      pct: dbStats ? Math.min(100, dbStats.totalNotes * 10) : 0 
    },
    { 
      label: 'Active Projects',   
      value: `${activeProjectCount}`,    
      delta: 'Synced',   
      up: true, 
      icon: '⬟',  
      color: '#f59e0b', 
      glow: 'rgba(245,158,11,0.35)',  
      bg: 'rgba(245,158,11,0.08)',  
      pct: Math.round((activeProjectCount / PROJECTS.length) * 100)
    },
  ]

  return (
    <div className="d-root">

      {/* Mobile overlay */}
      {mobileOpen && <div className="d-overlay" onClick={() => setMobileOpen(false)} />}

      {/* ══════════ SIDEBAR ══════════ */}
      <aside className={`d-sidebar ${sidebarOpen ? 'd-expanded' : 'd-collapsed'} ${mobileOpen ? 'd-mob-open' : ''}`}>

        {/* Animated left stripe */}
        <div className="d-sidebar-stripe" />

        {/* Logo */}
        <div className="d-logo">
          <span className="d-logo-icon">✨</span>
          {sidebarOpen && <span className="d-logo-txt">Nexus AI</span>}
        </div>

        {/* Nav */}
        <nav className="d-nav">
          {NAV.map(n => (
            <button
              key={n.id}
              className={`d-nav-btn ${activeNav === n.id ? 'd-nav-active' : ''}`}
              onClick={() => { setActiveNav(n.id); setMobileOpen(false) }}
              title={!sidebarOpen ? n.label : ''}
            >
              <span className="d-nav-ico">{n.icon}</span>
              {sidebarOpen && <span className="d-nav-lbl">{n.label}</span>}
              {activeNav === n.id && <span className="d-active-bar" />}
            </button>
          ))}
        </nav>

        {/* Collapse btn */}
        <button className="d-collapse-btn" onClick={() => setSidebarOpen(p => !p)}>
          <span style={{ display:'inline-block', transform: sidebarOpen ? 'rotate(0deg)' : 'rotate(180deg)', transition:'transform .3s' }}>‹</span>
        </button>

        {/* Footer */}
        <div className="d-sidebar-footer">
          {sidebarOpen && (
            <div className="d-user-row">
              <div className="d-user-av" style={avatarStyle}>{displayAv}</div>
              <div>
                <p className="d-user-nm">{displayName}</p>
                <p className="d-user-rl">Pro Plan ✦</p>
              </div>
            </div>
          )}
          <button className="d-logout" title="Logout" onClick={handleLogout}>⏻{sidebarOpen && ' Logout'}</button>
        </div>
      </aside>

      {/* ══════════ MAIN ══════════ */}
      <div className="d-main">

        {/* TOP HEADER */}
        <header className="d-header">
          <div className="d-header-left">
            <button className="d-burger" onClick={() => setMobileOpen(p => !p)}>
              <span/><span/><span/>
            </button>
            <div className="d-breadcrumb">
              <span className="d-bc-root">Nexus AI</span>
              <span className="d-bc-sep">›</span>
              <span className="d-bc-cur">{NAV.find(n => n.id === activeNav)?.label ?? 'Dashboard'}</span>
            </div>
          </div>

          <div className="d-search-wrap" onClick={() => setCmdPaletteOpen(true)} style={{ cursor: 'pointer' }}>
            <span className="d-search-ico">🔍</span>
            <input className="d-search" placeholder="Search tasks, notes, projects…" readOnly style={{ cursor: 'pointer' }} />
            <kbd className="d-kbd">⌘K</kbd>
          </div>

          <div className="d-header-right">
            {/* AI status */}
            <div className="d-ai-status">
              <span className="d-ai-dot" />
              <span className="d-ai-lbl">AI Online</span>
            </div>

            {/* Time */}
            <span className="d-time">{fmt(time)}</span>

            {/* Notifications */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <button 
                className="d-icon-btn d-notif-bell-btn" 
                onClick={() => setNotifOpen(!notifOpen)}
                aria-label="View notifications"
              >
                🔔
                {unreadCount > 0 && <span className="d-badge">{unreadCount}</span>}
              </button>
              <NotificationDropdown isOpen={notifOpen} onClose={() => setNotifOpen(false)} />
            </div>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Profile */}
            <div className="d-profile">
              <div className="d-av" style={avatarStyle}>{displayAv}</div>
              <div className="d-prof-info">
                <p className="d-prof-name">{displayName}</p>
                <p className="d-prof-role">{user?.role || 'Admin'}</p>
              </div>
              <span className="d-caret">▾</span>
            </div>
          </div>
        </header>

        {/* ── CONTENT ── */}
        <div className="d-content">
          <Suspense fallback={
            <div className="nx-loading-container" style={{ minHeight: '40vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: 'var(--color-dark-text-secondary)' }}>
              <div 
                style={{ 
                  width: '36px', 
                  height: '36px', 
                  border: '2px solid rgba(0, 212, 255, 0.1)', 
                  borderTopColor: 'var(--color-primary)', 
                  borderRadius: '50%', 
                  animation: 'nx-spin 0.8s linear infinite',
                  marginBottom: '1rem' 
                }} 
              />
              <p style={{ fontSize: '0.75rem', letterSpacing: '0.12em', margin: 0 }}>Syncing Neural Link...</p>
            </div>
          }>
            {activeNav === 'tasks' && <TasksSection />}
            {activeNav === 'ai' && (
              <AiAssistantSection
                initialPrompt={initialPrompt}
                setInitialPrompt={setInitialPrompt}
              />
            )}
            {activeNav === 'notes' && <NotesSection />}
            {activeNav === 'analytics' && <AnalyticsSection />}
            {activeNav === 'projects' && <ProjectsSection />}
            {activeNav === 'settings' && <SettingsSection />}
          </Suspense>

          {activeNav === 'dashboard' && (
            <>

          {/* ── 1. WELCOME BANNER ── */}
          <section className="d-welcome fade-in">
            <div className="d-welcome-grid" />
            <div className="d-welcome-left">
              <p className="d-welcome-eye"><span className="d-online-dot"/> System operational</p>
              <h1 className="d-welcome-h1">Good {getGreeting()}, <span className="d-grad">{displayName}</span> 👋</h1>
              <p className="d-welcome-p">
                Your workspace is active. You have completed <strong>{dbStats ? dbStats.completedTasks : 0} tasks</strong> out of <strong>{dbStats ? dbStats.totalTasks : 0}</strong> in total.
              </p>
              <div className="d-welcome-btns">
                <button className="d-cta-btn" onClick={() => setActiveNav('tasks')}>⚡ Manage Tasks</button>
                <button className="d-cta-btn-ghost" onClick={() => setActiveNav('analytics')}>📊 Platform Analytics</button>
              </div>
            </div>
            <div className="d-welcome-right">
              <div className="d-wstat"><span className="d-wstat-v">{dbStats ? dbStats.completedTasks : 0}/{dbStats ? dbStats.totalTasks : 0}</span><span className="d-wstat-l">Completed</span></div>
              <div className="d-wdiv"/>
              <div className="d-wstat"><span className="d-wstat-v">{dbStats ? dbStats.totalNotes : 0}</span><span className="d-wstat-l">Memos</span></div>
              <div className="d-wdiv"/>
              <div className="d-wstat"><span className="d-wstat-v">99.97%</span><span className="d-wstat-l">Uptime</span></div>
            </div>
          </section>

          {/* ── 2. STAT CARDS ── */}
          <section>
            <div className="d-section-hdr">
              <h2 className="d-section-title">Key Metrics</h2>
              <span className="d-live-badge">● Live</span>
            </div>
            <div className="d-stats-grid">
              {dynamicStats.map((s, i) => (
                <div key={i} className="d-stat-card fade-in"
                  style={{ '--sc':'var(--c)', '--ccolor':s.color, '--cglow':s.glow, '--cbg':s.bg, animationDelay:`${i*80}ms` }}>
                  <div className="d-stat-top">
                    <div className="d-stat-icon-box" style={{ background:s.bg, boxShadow:`0 0 14px ${s.glow}` }}>
                      <span style={{ fontSize:'1.1rem' }}>{s.icon}</span>
                    </div>
                    <span className={`d-stat-delta ${s.up ? 'up' : 'down'}`}>{s.up?'▲':'▼'} {s.delta}</span>
                  </div>
                  <div className="d-stat-val" style={{ color:s.color }}>{s.value}</div>
                  <div className="d-stat-lbl">{s.label}</div>
                  <div className="d-prog-track"><div className="d-prog-fill" style={{ width:`${s.pct}%`, background:s.color, boxShadow:`0 0 8px ${s.glow}` }}/></div>
                </div>
              ))}
            </div>
          </section>

          {/* ── 3. MID ROW: AI Assistant + Tasks ── */}
          <div className="d-mid-row">

            {/* AI Assistant Panel */}
            <section className="d-ai-panel fade-in">
              <div className="d-section-hdr">
                <h2 className="d-section-title">AI Assistant</h2>
                <span className="d-ai-model-tag">GPT-4 Turbo</span>
              </div>

              {/* Chat window */}
              <div className="d-chat-window">
                {aiMessages.map((m, i) => (
                  <div key={i} className={`d-msg d-msg-${m.role}`}>
                    {m.role === 'ai' && <div className="d-msg-av">✨</div>}
                    <div className="d-msg-bubble">{m.text}</div>
                    {m.role === 'user' && <div className="d-msg-av d-msg-user-av">A</div>}
                  </div>
                ))}
                {aiTyping && (
                  <div className="d-msg d-msg-ai">
                    <div className="d-msg-av">✨</div>
                    <div className="d-msg-bubble d-typing"><span/><span/><span/></div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Quick prompts */}
              <div className="d-quick-prompts">
                {QUICK_PROMPTS.map((p,i) => (
                  <button key={i} className="d-prompt-chip" onClick={() => { setInitialPrompt(p); setActiveNav('ai'); }}>{p}</button>
                ))}
              </div>

              {/* Input */}
              <div className="d-chat-input-wrap">
                <input
                  className="d-chat-input"
                  placeholder="Ask Nexus AI anything…"
                  value={aiInput}
                  onChange={e => setAiInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && aiInput.trim()) {
                      setInitialPrompt(aiInput);
                      setActiveNav('ai');
                      setAiInput('');
                    }
                  }}
                />
                <button className="d-chat-send" onClick={() => {
                  if (aiInput.trim()) {
                    setInitialPrompt(aiInput);
                    setActiveNav('ai');
                    setAiInput('');
                  }
                }}>⟶</button>
              </div>
            </section>

            {/* Tasks Panel */}
            <section className="d-tasks-panel fade-in" style={{ animationDelay:'100ms' }}>
              <div className="d-section-hdr">
                <h2 className="d-section-title">Recent Tasks</h2>
                <button className="d-add-btn" onClick={() => setActiveNav('tasks')}>+ Manage Tasks</button>
              </div>
 
              <div className="d-task-list">
                {tasksLoading ? (
                  /* Skeleton loading state */
                  <div style={{ display:'flex', flexDirection:'column', gap:'0.6rem', padding:'0.5rem 0' }}>
                    {[1,2,3].map(i => (
                      <div key={i} style={{ display:'flex', alignItems:'center', gap:'0.75rem', padding:'0.75rem', background:'rgba(255,255,255,0.03)', borderRadius:'10px' }}>
                        <div style={{ width:'22px', height:'22px', borderRadius:'6px', background:'rgba(255,255,255,0.06)', animation:'pulse 1.5s ease-in-out infinite' }} />
                        <div style={{ flex:1, display:'flex', flexDirection:'column', gap:'0.35rem' }}>
                          <div style={{ height:'12px', width:`${70 - i*10}%`, borderRadius:'4px', background:'rgba(255,255,255,0.06)', animation:'pulse 1.5s ease-in-out infinite', animationDelay:`${i*150}ms` }} />
                          <div style={{ height:'10px', width:'40%', borderRadius:'4px', background:'rgba(255,255,255,0.04)', animation:'pulse 1.5s ease-in-out infinite', animationDelay:`${i*200}ms` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : tasks.length === 0 ? (
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'2rem 0', color:'var(--color-dark-text-secondary)' }}>
                    <span style={{ fontSize:'1.5rem', marginBottom:'0.5rem' }}>✦</span>
                    <p style={{ fontSize:'0.8rem', margin:0 }}>No tasks yet — create one to get started!</p>
                  </div>
                ) : (
                  tasks.slice(0, 5).map(t => (
                    <div key={t.id} className={`d-task-item ${t.done ? 'd-task-done' : ''}`}>
                      <button className={`d-chk ${t.done ? 'd-chk-on' : ''}`} onClick={() => toggleTask(t.id)}>
                        {t.done && '✓'}
                      </button>
                      <div className="d-task-body">
                        <span className="d-task-title">{t.title}</span>
                        <span className="d-task-proj">
                          {t.project || (t.category ? t.category.charAt(0).toUpperCase() + t.category.slice(1) : 'General')}
                        </span>
                      </div>
                      <span className={`d-prio d-prio-${t.priority}`}>{t.priority}</span>
                      <span className="d-task-due">{t.due || 'No date'}</span>
                    </div>
                  ))
                )}
              </div>

              {/* Progress */}
              <div className="d-task-footer">
                <div className="d-task-prog-track">
                  <div className="d-task-prog-fill" style={{ width:`${tasks.length > 0 ? (done/tasks.length)*100 : 0}%` }}/>
                </div>
                <span className="d-task-prog-txt">{done} / {tasks.length} completed</span>
              </div>
            </section>
          </div>

          {/* ── 4. ANALYTICS ROW ── */}
          <div className="d-analytics-row">

            {/* Activity Chart */}
            <section className="d-chart-card fade-in">
              <div className="d-section-hdr">
                <h2 className="d-section-title">Activity Overview</h2>
                <div className="d-chart-tabs">
                  {['Weekly','Monthly','Yearly'].map(t => (
                    <button key={t} className={`d-ctab ${t==='Monthly'?'d-ctab-active':''}`}>{t}</button>
                  ))}
                </div>
              </div>

              {/* Legend */}
              <div className="d-chart-legend">
                <span className="d-leg-item"><span className="d-leg-dot" style={{background:'#00d4ff'}}/>AI Requests</span>
                <span className="d-leg-item"><span className="d-leg-dot" style={{background:'#a855f7'}}/>Tasks</span>
              </div>

              {/* Dual bar chart */}
              <div className="d-bar-chart">
                <div className="d-bar-y-axis">
                  {[100,75,50,25,0].map(v => <span key={v} className="d-y-tick">{v}</span>)}
                </div>
                <div className="d-bars">
                  {CHART_MONTHS.map((m,i) => (
                    <div key={m} className="d-bar-col">
                      <div className="d-bar-pair">
                        <div className="d-bar d-bar-cyan" style={{ height:`${CHART_AI[i]}%`, animationDelay:`${i*50}ms` }}/>
                        <div className="d-bar d-bar-purple" style={{ height:`${CHART_TASK[i]}%`, animationDelay:`${i*50+20}ms` }}/>
                      </div>
                      <span className="d-bar-lbl">{m}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Donut + Metrics */}
            <section className="d-metrics-card fade-in" style={{ animationDelay:'80ms' }}>
              <div className="d-section-hdr">
                <h2 className="d-section-title">Time Breakdown</h2>
              </div>

              {/* Faux donut */}
              <div className="d-donut-wrap">
                <div className="d-donut">
                  <div className="d-donut-inner">
                    <span className="d-donut-pct">96%</span>
                    <span className="d-donut-lbl">Efficiency</span>
                  </div>
                </div>
              </div>

              <div className="d-donut-list">
                {DONUT.map((d,i) => (
                  <div key={i} className="d-donut-item">
                    <div className="d-donut-indicator" style={{ background:d.color, boxShadow:`0 0 8px ${d.color}88` }}/>
                    <span className="d-donut-name">{d.label}</span>
                    <div className="d-donut-bar-track">
                      <div className="d-donut-bar-fill" style={{ width:`${d.pct}%`, background:d.color }}/>
                    </div>
                    <span className="d-donut-pct-lbl" style={{ color:d.color }}>{d.pct}%</span>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* ── 5. BOTTOM ROW: AI Activity + Projects + Quick Actions ── */}
          <div className="d-bottom-row">

            {/* Recent Activities */}
            <section className="d-ai-activity fade-in">
              <div className="d-section-hdr">
                <h2 className="d-section-title">Recent Activities</h2>
                <span className="d-pulse-dot"/>
              </div>
              <div className="d-act-list">
                {dbStatsLoading ? (
                  /* Skeleton loading state */
                  <div style={{ display:'flex', flexDirection:'column', gap:'0.6rem', padding:'0.5rem 0' }}>
                    {[1,2,3].map(i => (
                      <div key={i} style={{ display:'flex', alignItems:'center', gap:'0.75rem', padding:'0.75rem', background:'rgba(255,255,255,0.03)', borderRadius:'10px' }}>
                        <div style={{ width:'20px', height:'20px', borderRadius:'50%', background:'rgba(255,255,255,0.06)', animation:'pulse 1.5s ease-in-out infinite' }} />
                        <div style={{ flex:1, display:'flex', flexDirection:'column', gap:'0.35rem' }}>
                          <div style={{ height:'10px', width:`${60 - i*5}%`, borderRadius:'4px', background:'rgba(255,255,255,0.06)', animation:'pulse 1.5s ease-in-out infinite', animationDelay:`${i*150}ms` }} />
                          <div style={{ height:'8px', width:'30%', borderRadius:'4px', background:'rgba(255,255,255,0.04)', animation:'pulse 1.5s ease-in-out infinite', animationDelay:`${i*200}ms` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (dbStats?.activityFeed || []).length === 0 ? (
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'2rem 0', color:'var(--color-dark-text-secondary)' }}>
                    <span style={{ fontSize:'1.5rem', marginBottom:'0.5rem' }}>⚡</span>
                    <p style={{ fontSize:'0.8rem', margin:0 }}>No activities logged yet.</p>
                  </div>
                ) : (
                  (dbStats?.activityFeed || []).map(a => (
                    <div key={a.id} className="d-act-item">
                      <div className="d-act-icon-wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.05rem' }}>
                        {a.type === 'task' ? '✦' : a.type === 'note' ? '📝' : '⚙️'}
                      </div>
                      <div className="d-act-info">
                        <p className="d-act-model" style={{ color: a.badgeColor || '#00d4ff', margin: 0, fontWeight: 500 }}>{a.title}</p>
                        <p className="d-act-task" style={{ fontSize: '0.78rem', margin: '2px 0 0 0', opacity: 0.8 }}>{a.detail}</p>
                      </div>
                      <div className="d-act-meta" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                        <span className="d-act-status" style={{ border: `1px solid ${a.badgeColor || '#00d4ff'}44`, color: a.badgeColor || '#00d4ff', background: `${a.badgeColor || '#00d4ff'}10`, padding: '2px 6px', borderRadius: '4px', fontSize: '0.625rem', fontWeight: 600 }}>
                          {a.badge}
                        </span>
                        <span className="d-act-time" style={{ fontSize: '0.68rem', opacity: 0.5 }}>
                          {new Date(a.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* Projects */}
            <section className="d-projects fade-in" style={{ animationDelay:'80ms' }}>
              <div className="d-section-hdr">
                <h2 className="d-section-title">Projects</h2>
                <button className="d-add-btn">+ New</button>
              </div>
              <div className="d-proj-list">
                {PROJECTS.map((p,i) => (
                  <div key={p.id || i} className="d-proj-item">
                    <div className="d-proj-row">
                      <div className="d-proj-dot" style={{ background:p.color, boxShadow:`0 0 8px ${p.color}88` }}/>
                      <span className="d-proj-name">{p.name}</span>
                      <span className={`d-proj-status d-ps-${p.status}`}>{p.status}</span>
                      <span className="d-proj-tasks">{p.tasks} tasks</span>
                    </div>
                    <div className="d-proj-prog-track">
                      <div className="d-proj-prog-fill" style={{ width:`${p.progress}%`, background:`linear-gradient(90deg,${p.color},${p.color}88)`, boxShadow:`0 0 6px ${p.color}66` }}/>
                    </div>
                    <span className="d-proj-pct">{p.progress}%</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Quick Actions */}
            <section className="d-quick-actions fade-in" style={{ animationDelay:'160ms' }}>
              <div className="d-section-hdr">
                <h2 className="d-section-title">Quick Actions</h2>
              </div>
              <div className="d-qa-grid">
                {[
                  { icon:'✦',  label:'Create Task',        color:'#00d4ff', glow:'rgba(0,212,255,0.4)'  },
                  { icon:'🤖', label:'AI Report',           color:'#a855f7', glow:'rgba(168,85,247,0.4)' },
                  { icon:'◈',  label:'Add Note',            color:'#10b981', glow:'rgba(16,185,129,0.4)' },
                  { icon:'⬟',  label:'New Project',         color:'#f59e0b', glow:'rgba(245,158,11,0.4)' },
                  { icon:'◉',  label:'Run Analytics',       color:'#06b6d4', glow:'rgba(6,182,212,0.4)'  },
                  { icon:'📤', label:'Export Data',         color:'#ef4444', glow:'rgba(239,68,68,0.4)'  },
                ].map((q,i) => (
                  <button key={i} className="d-qa-btn" style={{ '--qc':q.color, '--qg':q.glow }}
                    onClick={() => handleQuickAction(q.label)}>
                    <span className="d-qa-icon">{q.icon}</span>
                    <span className="d-qa-lbl">{q.label}</span>
                    <span className="d-qa-arr">→</span>
                  </button>
                ))}
              </div>
            </section>
          </div>
          </>
          )}
        </div>{/* /d-content */}
      </div>{/* /d-main */}

      <CommandPalette 
        isOpen={cmdPaletteOpen} 
        onClose={() => setCmdPaletteOpen(false)} 
        setActiveNav={setActiveNav}
        tasks={tasks}
        toggleTheme={toggleTheme}
      />
    </div>
  )
}
