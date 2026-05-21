import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Auth.css'

function Login() {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [showPw,   setShowPw]   = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  const { login }  = useAuth()
  const navigate   = useNavigate()
  const location   = useLocation()

  // Redirect back to the page the user originally tried to visit
  const from = location.state?.from?.pathname || '/dashboard'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login({ email, password })
      navigate(from, { replace: true })
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="ax-page">
      {/* ── Animated background ── */}
      <div className="ax-bg">
        <div className="ax-orb ax-orb-1" />
        <div className="ax-orb ax-orb-2" />
        <div className="ax-orb ax-orb-3" />
        <div className="ax-grid" />
      </div>

      {/* ══════ LEFT — Branding ══════ */}
      <div className="ax-brand">
        <div className="ax-brand-inner">
          <div className="ax-logo">
            <span className="ax-logo-icon">✨</span>
            <span className="ax-logo-text">Nexus AI</span>
          </div>
          <h1 className="ax-brand-title">
            The Future of<br />
            <span className="ax-gradient-text">Intelligent Work</span>
          </h1>
          <p className="ax-brand-desc">
            Supercharge your productivity with AI-powered automation, real-time analytics,
            and intelligent decision-making — all in one platform.
          </p>
          <div className="ax-pills">
            {['⚡ Lightning Fast','🔒 Enterprise Secure','🤖 AI-Powered','🌐 Global Scale'].map(p => (
              <span key={p} className="ax-pill">{p}</span>
            ))}
          </div>
          <div className="ax-brand-stats">
            <div className="ax-bstat"><span className="ax-bstat-val">50K+</span><span className="ax-bstat-lbl">Active Users</span></div>
            <div className="ax-bstat-divider" />
            <div className="ax-bstat"><span className="ax-bstat-val">99.99%</span><span className="ax-bstat-lbl">Uptime SLA</span></div>
            <div className="ax-bstat-divider" />
            <div className="ax-bstat"><span className="ax-bstat-val">100B+</span><span className="ax-bstat-lbl">API Requests</span></div>
          </div>
        </div>
      </div>

      {/* ══════ RIGHT — Form ══════ */}
      <div className="ax-form-side">
        <div className="ax-card">

          {/* Header */}
          <div className="ax-card-header">
            <div className="ax-card-eyebrow">
              <span className="ax-online-dot" /> Secure Authentication
            </div>
            <h2 className="ax-card-title">Welcome back</h2>
            <p className="ax-card-sub">Sign in to your Nexus AI account</p>
          </div>

          {/* Social */}
          <div className="ax-socials">
            <button type="button" className="ax-social-btn"><span>🌐</span> Google</button>
            <button type="button" className="ax-social-btn"><span>◆</span> GitHub</button>
          </div>

          <div className="ax-divider"><span>or sign in with email</span></div>

          {/* Error banner */}
          {error && (
            <div className="ax-alert ax-alert-error">
              <span>⚠</span> {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="ax-form" noValidate>

            {/* Email */}
            <div className="ax-field">
              <label htmlFor="ax-email" className="ax-label">Email Address</label>
              <div className="ax-input-wrap">
                <span className="ax-input-icon">✉</span>
                <input
                  id="ax-email"
                  type="email"
                  className="ax-input"
                  placeholder="you@company.com"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError('') }}
                  required
                  autoComplete="email"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password */}
            <div className="ax-field">
              <label htmlFor="ax-password" className="ax-label">Password</label>
              <div className="ax-input-wrap">
                <span className="ax-input-icon">🔑</span>
                <input
                  id="ax-password"
                  type={showPw ? 'text' : 'password'}
                  className="ax-input"
                  placeholder="••••••••••"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError('') }}
                  required
                  autoComplete="current-password"
                  disabled={loading}
                />
                <button type="button" className="ax-pw-toggle" onClick={() => setShowPw(p => !p)} tabIndex={-1}>
                  {showPw ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            {/* Remember + Forgot */}
            <div className="ax-form-footer">
              <label className="ax-checkbox-label">
                <span className={`ax-checkbox ${remember ? 'checked' : ''}`} onClick={() => setRemember(p => !p)}>
                  {remember && '✓'}
                </span>
                <span>Remember me</span>
              </label>
              <Link to="#" className="ax-forgot">Forgot password?</Link>
            </div>

            {/* Submit */}
            <button type="submit" className={`ax-submit-btn ${loading ? 'loading' : ''}`} disabled={loading}>
              {loading
                ? <><span className="ax-spinner" /> Signing in…</>
                : <><span>Sign In to Nexus AI</span><span className="ax-btn-arrow">→</span></>
              }
            </button>
          </form>

          <p className="ax-redirect">
            Don't have an account?{' '}
            <Link to="/signup" className="ax-redirect-link">Create one free →</Link>
          </p>

          <p className="ax-legal">
            By signing in you agree to our{' '}
            <Link to="#">Terms</Link> and <Link to="#">Privacy Policy</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login
