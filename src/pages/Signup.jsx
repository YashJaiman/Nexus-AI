import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Auth.css'

function Signup() {
  const [form, setForm] = useState({ fullName:'', email:'', password:'', confirmPassword:'' })
  const [showPw,  setShowPw]  = useState(false)
  const [showCPw, setShowCPw] = useState(false)
  const [agreed,  setAgreed]  = useState(false)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [pwError, setPwError] = useState('')

  const { signup } = useAuth()
  const navigate   = useNavigate()

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    setError('')
    if (name === 'confirmPassword' || name === 'password') setPwError('')
  }

  const getStrength = (pw) => {
    if (!pw) return 0
    let s = 0
    if (pw.length >= 8)          s++
    if (/[A-Z]/.test(pw))        s++
    if (/[0-9]/.test(pw))        s++
    if (/[^A-Za-z0-9]/.test(pw)) s++
    return s
  }

  const strength = getStrength(form.password)
  const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong']
  const strengthColors = ['', '#ef4444', '#f59e0b', '#06b6d4', '#10b981']

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setPwError('')

    if (form.password !== form.confirmPassword) {
      setPwError('Passwords do not match')
      return
    }
    if (!agreed) {
      setError('You must agree to the Terms of Service to continue.')
      return
    }

    setLoading(true)
    try {
      await signup({ fullName: form.fullName, email: form.email, password: form.password })
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err.message || 'Signup failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="ax-page ax-signup-page">
      <div className="ax-bg">
        <div className="ax-orb ax-orb-1" />
        <div className="ax-orb ax-orb-2" />
        <div className="ax-orb ax-orb-3" />
        <div className="ax-grid" />
      </div>

      {/* LEFT branding */}
      <div className="ax-brand">
        <div className="ax-brand-inner">
          <div className="ax-logo">
            <span className="ax-logo-icon">✨</span>
            <span className="ax-logo-text">Nexus AI</span>
          </div>
          <h1 className="ax-brand-title">
            Start Building<br />
            <span className="ax-gradient-text">Smarter Today</span>
          </h1>
          <p className="ax-brand-desc">
            Join over 50,000 professionals using Nexus AI to automate workflows,
            unlock insights, and scale faster than ever before.
          </p>
          <div className="ax-steps">
            {[
              { num:'01', title:'Create your account', desc:'Free 14-day trial, no credit card needed' },
              { num:'02', title:'Connect your tools',  desc:'Integrate with 200+ apps in minutes' },
              { num:'03', title:'Let AI do the work',  desc:'Sit back while Nexus optimises everything' },
            ].map(s => (
              <div key={s.num} className="ax-step">
                <div className="ax-step-num">{s.num}</div>
                <div>
                  <p className="ax-step-title">{s.title}</p>
                  <p className="ax-step-desc">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="ax-brand-stats">
            <div className="ax-bstat"><span className="ax-bstat-val">14</span><span className="ax-bstat-lbl">Day Free Trial</span></div>
            <div className="ax-bstat-divider" />
            <div className="ax-bstat"><span className="ax-bstat-val">200+</span><span className="ax-bstat-lbl">Integrations</span></div>
            <div className="ax-bstat-divider" />
            <div className="ax-bstat"><span className="ax-bstat-val">24/7</span><span className="ax-bstat-lbl">AI Support</span></div>
          </div>
        </div>
      </div>

      {/* RIGHT form */}
      <div className="ax-form-side ax-form-side-signup">
        <div className="ax-card ax-card-signup">

          <div className="ax-card-header">
            <div className="ax-card-eyebrow"><span className="ax-online-dot" /> Free Account · No card required</div>
            <h2 className="ax-card-title">Create your account</h2>
            <p className="ax-card-sub">Join thousands building with Nexus AI</p>
          </div>

          <div className="ax-socials">
            <button type="button" className="ax-social-btn"><span>🌐</span> Google</button>
            <button type="button" className="ax-social-btn"><span>◆</span> GitHub</button>
          </div>

          <div className="ax-divider"><span>or create with email</span></div>

          {/* Error banner */}
          {error && (
            <div className="ax-alert ax-alert-error">
              <span>⚠</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="ax-form" noValidate>

            {/* Full Name */}
            <div className="ax-field">
              <label htmlFor="su-name" className="ax-label">Full Name</label>
              <div className="ax-input-wrap">
                <span className="ax-input-icon">👤</span>
                <input id="su-name" type="text" name="fullName" className="ax-input"
                  placeholder="Alex Rivera" value={form.fullName}
                  onChange={handleChange} required autoComplete="name" disabled={loading} />
              </div>
            </div>

            {/* Email */}
            <div className="ax-field">
              <label htmlFor="su-email" className="ax-label">Work Email</label>
              <div className="ax-input-wrap">
                <span className="ax-input-icon">✉</span>
                <input id="su-email" type="email" name="email" className="ax-input"
                  placeholder="alex@company.com" value={form.email}
                  onChange={handleChange} required autoComplete="email" disabled={loading} />
              </div>
            </div>

            {/* Password */}
            <div className="ax-field">
              <label htmlFor="su-pw" className="ax-label">Password</label>
              <div className="ax-input-wrap">
                <span className="ax-input-icon">🔑</span>
                <input id="su-pw" type={showPw ? 'text' : 'password'} name="password" className="ax-input"
                  placeholder="Min. 6 characters" value={form.password}
                  onChange={handleChange} required autoComplete="new-password" disabled={loading} />
                <button type="button" className="ax-pw-toggle" onClick={() => setShowPw(p => !p)} tabIndex={-1}>
                  {showPw ? '🙈' : '👁'}
                </button>
              </div>
              {form.password && (
                <div className="ax-strength">
                  <div className="ax-strength-bars">
                    {[1,2,3,4].map(i => (
                      <div key={i} className="ax-strength-bar"
                        style={{ background: i <= strength ? strengthColors[strength] : 'rgba(255,255,255,0.08)' }}/>
                    ))}
                  </div>
                  <span className="ax-strength-label" style={{ color: strengthColors[strength] }}>
                    {strengthLabels[strength]}
                  </span>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="ax-field">
              <label htmlFor="su-cpw" className="ax-label">Confirm Password</label>
              <div className={`ax-input-wrap ${pwError ? 'ax-input-error' : ''}`}>
                <span className="ax-input-icon">🔒</span>
                <input id="su-cpw" type={showCPw ? 'text' : 'password'} name="confirmPassword" className="ax-input"
                  placeholder="Repeat your password" value={form.confirmPassword}
                  onChange={handleChange} required autoComplete="new-password" disabled={loading} />
                <button type="button" className="ax-pw-toggle" onClick={() => setShowCPw(p => !p)} tabIndex={-1}>
                  {showCPw ? '🙈' : '👁'}
                </button>
              </div>
              {pwError && <p className="ax-field-error">{pwError}</p>}
            </div>

            {/* Terms */}
            <label className="ax-checkbox-label ax-terms">
              <span className={`ax-checkbox ${agreed ? 'checked' : ''}`} onClick={() => setAgreed(p => !p)}>
                {agreed && '✓'}
              </span>
              <span>
                I agree to the{' '}
                <Link to="#" className="ax-forgot">Terms of Service</Link>{' '}and{' '}
                <Link to="#" className="ax-forgot">Privacy Policy</Link>
              </span>
            </label>

            {/* Submit */}
            <button type="submit" className={`ax-submit-btn ${loading ? 'loading' : ''}`}
              disabled={loading || !agreed}>
              {loading
                ? <><span className="ax-spinner" /> Creating account…</>
                : <><span>Create Free Account</span><span className="ax-btn-arrow">→</span></>
              }
            </button>
          </form>

          <p className="ax-redirect">
            Already have an account?{' '}
            <Link to="/login" className="ax-redirect-link">Sign in →</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Signup
