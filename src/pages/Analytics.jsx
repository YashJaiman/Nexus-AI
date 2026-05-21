/**
 * Nexus AI — Analytics Dashboard
 * Futuristic SaaS charts engine integrating Recharts data visualizations.
 */

import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useToast } from '../context/ToastContext'
import { getAnalytics } from '../api/analytics'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts'
import './Analytics.css'

export default function AnalyticsSection() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [syncTime, setSyncTime] = useState('')

  // Animated counters
  const [counts, setCounts] = useState({
    totalTasks: 0,
    completedTasks: 0,
    totalNotes: 0,
    productivityScore: 0
  })

  const { token } = useAuth()
  const { theme } = useTheme()
  const toast = useToast()

  const isLight = theme === 'light'
  const gridColor = isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.03)'
  const axisColor = isLight ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.3)'
  const tooltipBg = isLight ? 'rgba(255,255,255,0.96)' : 'rgba(10, 15, 30, 0.9)'
  const tooltipBorder = isLight ? 'rgba(0,0,0,0.1)' : 'rgba(0, 212, 255, 0.25)'
  const tooltipText = isLight ? '#07071a' : '#e0e0ff'

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        setLoading(true)
        const res = await getAnalytics()
        if (res && res.success && res.data) {
          setData(res.data)
          setSyncTime(new Date().toLocaleTimeString())

          // Trigger count-up animation
          const target = res.data.counters
          animateCounters(target)
        }
      } catch (err) {
        console.error('Failed to load analytics telemetry:', err)
        toast.error('Analytics system link failed. Offline fallback in use.')
        // Set offline premium mock data fallback
        const mockTarget = { totalTasks: 184, completedTasks: 142, totalNotes: 27, productivityScore: 92 }
        animateCounters(mockTarget)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalyticsData()
  }, [])

  const animateCounters = (target) => {
    let current = { totalTasks: 0, completedTasks: 0, totalNotes: 0, productivityScore: 0 }
    const duration = 1000 // 1s animation
    const steps = 30
    const interval = duration / steps
    let step = 0

    const timer = setInterval(() => {
      step++
      setCounts({
        totalTasks: Math.round(target.totalTasks * (step / steps)),
        completedTasks: Math.round(target.completedTasks * (step / steps)),
        totalNotes: Math.round(target.totalNotes * (step / steps)),
        productivityScore: Math.round(target.productivityScore * (step / steps))
      })

      if (step >= steps) {
        clearInterval(timer)
        setCounts(target)
      }
    }, interval)
  }

  // Custom tooltips for recharts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          background: tooltipBg,
          border: `1px solid ${tooltipBorder}`,
          borderRadius: '8px',
          padding: '0.75rem 1rem',
          backdropFilter: 'blur(12px)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.3)'
        }}>
          <p style={{ margin: 0, fontSize: '0.75rem', color: isLight ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.4)', fontFamily: 'Space Mono' }}>{label}</p>
          {payload.map((p, idx) => (
            <p key={idx} style={{ margin: '4px 0 0 0', fontSize: '0.85rem', fontWeight: 600, color: p.color || p.stroke }}>
              {p.name}: {p.value}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  // Circular widget math
  const radius = 64
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (counts.productivityScore / 100) * circumference

  if (loading) {
    return (
      <div className="an-root">
        <div className="an-page-header">
          <div>
            <div style={{ height: '32px', width: '220px', background: 'rgba(255,255,255,0.06)', borderRadius: '6px', animation: 'pulse 1.5s ease-in-out infinite' }} />
            <div style={{ height: '14px', width: '280px', background: 'rgba(255,255,255,0.03)', borderRadius: '4px', marginTop: '8px', animation: 'pulse 1.5s ease-in-out infinite' }} />
          </div>
        </div>

        {/* Skeleton grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginTop: '1.5rem' }}>
          {[1,2,3,4].map(i => (
            <div key={i} className="an-stat-card">
              <div className="an-shimmer" />
              <div style={{ height: '12px', width: '50%', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }} />
              <div style={{ height: '24px', width: '70%', background: 'rgba(255,255,255,0.08)', borderRadius: '6px', marginTop: '12px' }} />
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginTop: '1.5rem' }}>
          <div className="an-chart-card">
            <div className="an-shimmer" />
            <div className="an-skeleton-chart" />
          </div>
          <div className="an-chart-card">
            <div className="an-shimmer" />
            <div className="an-skeleton-chart" />
          </div>
        </div>
      </div>
    )
  }

  // Fetch charts data from DB response or mock offline defaults
  const productivityGraph = data?.productivityGraph || [
    { day: 'Mon', score: 84, target: 90 },
    { day: 'Tue', score: 86, target: 90 },
    { day: 'Wed', score: 88, target: 90 },
    { day: 'Thu', score: 85, target: 90 },
    { day: 'Fri', score: 89, target: 90 },
    { day: 'Sat', score: 94, target: 90 },
    { day: 'Sun', score: counts.productivityScore || 92, target: 90 },
  ]

  const tasksCompletedGraph = data?.tasksCompletedGraph || [
    { day: 'Mon', completed: 6, added: 8 },
    { day: 'Tue', completed: 8, added: 9 },
    { day: 'Wed', completed: 5, added: 6 },
    { day: 'Thu', completed: 11, added: 12 },
    { day: 'Fri', completed: 7, added: 10 },
    { day: 'Sat', completed: 12, added: 10 },
    { day: 'Sun', completed: counts.completedTasks || 8, added: counts.totalTasks || 10 },
  ]

  const aiUsageGraph = data?.aiUsageGraph || [
    { day: 'Mon', requests: 18, tokens: 4800 },
    { day: 'Tue', requests: 24, tokens: 6200 },
    { day: 'Wed', requests: 32, tokens: 9100 },
    { day: 'Thu', requests: 21, tokens: 5500 },
    { day: 'Fri', requests: 45, tokens: 14000 },
    { day: 'Sat', requests: 38, tokens: 11000 },
    { day: 'Sun', requests: 52, tokens: 16500 },
  ]

  const weeklyActivity = data?.weeklyActivity || [
    { day: 'Mon', aiRequests: 18, tasksCompleted: 6 },
    { day: 'Tue', aiRequests: 24, tasksCompleted: 8 },
    { day: 'Wed', aiRequests: 32, tasksCompleted: 5 },
    { day: 'Thu', aiRequests: 21, tasksCompleted: 11 },
    { day: 'Fri', aiRequests: 45, tasksCompleted: 7 },
    { day: 'Sat', aiRequests: 38, tasksCompleted: 12 },
    { day: 'Sun', aiRequests: 52, tasksCompleted: counts.completedTasks || 8 },
  ]

  const categoriesAllocation = data?.categoriesAllocation || [
    { name: '💼 Work', value: 42, color: '#00d4ff' },
    { name: '🤖 AI Development', value: 28, color: '#a855f7' },
    { name: '🌟 Personal Goals', value: 18, color: '#10b981' },
    { name: '⬟ Projects Space', value: 12, color: '#f59e0b' }
  ]

  return (
    <div className="an-root">
      {/* ── Page Header ── */}
      <div className="an-page-header fade-in">
        <div>
          <h1 className="an-page-title">SaaS Analytics</h1>
          <p className="an-page-sub">Monitor model synchronization rates, workflow indexes, and AI usage metrics.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button 
            className="an-sync-badge"
            style={{ 
              background: 'rgba(255,255,255,0.04)', 
              border: '1px solid rgba(0, 212, 255, 0.15)', 
              color: '#00d4ff',
              cursor: 'pointer',
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
              fontWeight: 500
            }} 
            onClick={() => window.print()}
          >
            🖨️ Export PDF Report
          </button>
          <div className="an-sync-badge">
            <span className="an-sync-dot" />
            <span>Telemetries synced: {syncTime}</span>
          </div>
        </div>
      </div>

      {/* ── 2. Top Stats Cards Grid ── */}
      <div className="an-stats-grid fade-in">
        <div className="an-stat-card" style={{ '--card-accent': '#00d4ff' }}>
          <div className="an-stat-header">
            <h3 className="an-stat-title">Workflow Score</h3>
            <span className="an-stat-icon">📈</span>
          </div>
          <div className="an-stat-value" style={{ color: '#00d4ff' }}>{counts.productivityScore}%</div>
          <div className="an-stat-trend up">▲ +4.2% this week</div>
        </div>

        <div className="an-stat-card" style={{ '--card-accent': '#a855f7' }}>
          <div className="an-stat-header">
            <h3 className="an-stat-title">Completed Tasks</h3>
            <span className="an-stat-icon">✦</span>
          </div>
          <div className="an-stat-value" style={{ color: '#a855f7' }}>{counts.completedTasks}</div>
          <div className="an-stat-trend up">▲ +12.5% vs average</div>
        </div>

        <div className="an-stat-card" style={{ '--card-accent': '#10b981' }}>
          <div className="an-stat-header">
            <h3 className="an-stat-title">AI Sync Queries</h3>
            <span className="an-stat-icon">🤖</span>
          </div>
          <div className="an-stat-value" style={{ color: '#10b981' }}>230</div>
          <div className="an-stat-trend up">▲ +35.2% query rates</div>
        </div>

        <div className="an-stat-card" style={{ '--card-accent': '#f59e0b' }}>
          <div className="an-stat-header">
            <h3 className="an-stat-title">Saved Notes</h3>
            <span className="an-stat-icon">◈</span>
          </div>
          <div className="an-stat-value" style={{ color: '#f59e0b' }}>{counts.totalNotes}</div>
          <div className="an-stat-trend up">▲ +3 memos today</div>
        </div>
      </div>

      {/* ── 3. Chart Analytics Layout Grid ── */}
      <div className="an-charts-grid fade-in">
        {/* Area Chart: Productivity Trends */}
        <div className="an-chart-card">
          <div className="an-chart-header">
            <div>
              <h4 className="an-chart-title">Productivity Score History</h4>
              <span className="an-chart-subtitle">Calculated daily efficiency indexes</span>
            </div>
          </div>
          <div className="an-chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={productivityGraph} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="scoreColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#00d4ff" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis dataKey="day" stroke={axisColor} fontSize={11} tickLine={false} />
                <YAxis domain={[60, 100]} stroke={axisColor} fontSize={11} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" name="Efficiency Rating" dataKey="score" stroke="#00d4ff" strokeWidth={2} fillOpacity={1} fill="url(#scoreColor)" />
                <Line type="monotone" name="Goal target" dataKey="target" stroke="rgba(255, 255, 255, 0.2)" strokeDasharray="5 5" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Circular Progress & Category Breakdown */}
        <div className="an-chart-card">
          <div className="an-chart-header">
            <div>
              <h4 className="an-chart-title">Tasks Distribution</h4>
              <span className="an-chart-subtitle">Workspace categories allocation</span>
            </div>
          </div>
          <div className="an-circular-widget">
            <div className="an-circular-svg">
              <svg width="160" height="160">
                <circle className="an-circular-circle an-circular-bg" cx="80" cy="80" r={radius} />
                <circle
                  className="an-circular-circle an-circular-fill"
                  cx="80"
                  cy="80"
                  r={radius}
                  stroke="#a855f7"
                  strokeWidth="12"
                  strokeDasharray={circumference}
                  strokeDashoffset={offset}
                  style={{ filter: 'drop-shadow(0 0 8px rgba(168,85,247,0.5))' }}
                />
              </svg>
              <div className="an-circular-text-box">
                <span className="an-circular-value">{counts.productivityScore}%</span>
                <span className="an-circular-lbl">Done ratio</span>
              </div>
            </div>
            <div className="an-breakdown-list">
              {categoriesAllocation.map((item, idx) => (
                <div key={idx} className="an-breakdown-item">
                  <div className="an-breakdown-left">
                     <span className="an-breakdown-dot" style={{ background: item.color, boxShadow: `0 0 6px ${item.color}` }} />
                    <span>{item.name}</span>
                  </div>
                  <span className="an-breakdown-val">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Dual Bar Chart: Tasks completed vs AI Requests */}
        <div className="an-chart-card an-chart-card-full">
          <div className="an-chart-header">
            <div>
              <h4 className="an-chart-title">Weekly Activity Comparison</h4>
              <span className="an-chart-subtitle">Tasks completed compared to assistant requests processed</span>
            </div>
          </div>
          <div className="an-chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyActivity} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis dataKey="day" stroke={axisColor} fontSize={11} tickLine={false} />
                <YAxis stroke={axisColor} fontSize={11} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconSize={8} iconType="circle" wrapperStyle={{ paddingTop: '10px', fontSize: '0.8rem' }} />
                <Bar name="AI requests completed" dataKey="aiRequests" fill="#a855f7" radius={[4, 4, 0, 0]} />
                <Bar name="Tasks checked off" dataKey="tasksCompleted" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Area Line Chart: AI Token Rates */}
        <div className="an-chart-card an-chart-card-full">
          <div className="an-chart-header">
            <div>
              <h4 className="an-chart-title">Assistant Token Allocation & API Rates</h4>
              <span className="an-chart-subtitle">Assistant requests volumes and token processing values</span>
            </div>
          </div>
          <div className="an-chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={aiUsageGraph} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="tokenColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis dataKey="day" stroke={axisColor} fontSize={11} tickLine={false} />
                <YAxis stroke={axisColor} fontSize={11} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" name="Tokens Processed" dataKey="tokens" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#tokenColor)" />
                <Line type="monotone" name="API Calls" dataKey="requests" stroke="#00d4ff" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}
