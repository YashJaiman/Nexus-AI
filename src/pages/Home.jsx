import { useState, useEffect, useCallback } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Zap,
  BrainCircuit,
  ShieldCheck,
  BarChart3,
  Globe2,
  PlugZap,
  Building2,
  Database,
  Cloud,
  Cpu,
  DatabaseZap,
  Users,
  Sparkles,
  ArrowRight
} from 'lucide-react'
import './Home.css'

const ICON_PROPS = { size: 40, className: 'nexus-icon' }

function Home() {
  const [scrollY, setScrollY] = useState(0)
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToSection = useCallback((id) => {
    const section = document.getElementById(id)
    if (!section) return
    section.scrollIntoView({ behavior: 'smooth', block: 'start' })
    window.history.replaceState(null, '', `/#${id}`)
  }, [])

  const handleSectionNavigation = (id) => {
    if (location.pathname !== '/') {
      navigate(`/#${id}`)
      return
    }
    scrollToSection(id)
  }

  useEffect(() => {
    const applyHashScroll = () => {
      const hash = window.location.hash.replace('#', '')
      if (!hash) return
      let tries = 0
      const scrollWhenReady = () => {
        if (document.getElementById(hash)) {
          scrollToSection(hash)
          return
        }
        tries += 1
        if (tries < 12) window.requestAnimationFrame(scrollWhenReady)
      }
      window.requestAnimationFrame(scrollWhenReady)
    }

    applyHashScroll()
    window.addEventListener('hashchange', applyHashScroll)
    return () => window.removeEventListener('hashchange', applyHashScroll)
  }, [scrollToSection])

  const features = [
    { icon: <Zap {...ICON_PROPS} />, title: 'Lightning Fast', description: 'Process millions of requests with sub-millisecond latency' },
    { icon: <BrainCircuit {...ICON_PROPS} />, title: 'AI Powered', description: 'Advanced machine learning algorithms for intelligent insights' },
    { icon: <ShieldCheck {...ICON_PROPS} />, title: 'Enterprise Security', description: 'Military-grade encryption and compliance standards' },
    { icon: <BarChart3 {...ICON_PROPS} />, title: 'Smart Analytics', description: 'Real-time dashboards with predictive intelligence' },
    { icon: <Globe2 {...ICON_PROPS} />, title: 'Global Scale', description: 'Deploy globally with automatic redundancy and failover' },
    { icon: <PlugZap {...ICON_PROPS} />, title: 'Easy Integration', description: 'Plug into your stack with our comprehensive API' }
  ]

  const stats = [
    { label: 'AI Models Trained', value: '10K+', icon: <BrainCircuit {...ICON_PROPS} /> },
    { label: 'Requests Processed', value: '100B+', icon: <DatabaseZap {...ICON_PROPS} /> },
    { label: 'Active Users', value: '50K+', icon: <Users {...ICON_PROPS} /> },
    { label: 'Uptime Guarantee', value: '99.99%', icon: <ShieldCheck {...ICON_PROPS} /> }
  ]

  const testimonials = [
    { company: 'TechCorp', logo: <Building2 {...ICON_PROPS} /> },
    { company: 'DataFlow', logo: <Database {...ICON_PROPS} /> },
    { company: 'CloudSync', logo: <Cloud {...ICON_PROPS} /> },
    { company: 'ByteForce', logo: <Cpu {...ICON_PROPS} /> }
  ]

  const pricingPlans = [
    { name: 'Starter', price: '$19', note: 'Per user/month', cta: 'Start Starter', to: '/signup' },
    { name: 'Pro', price: '$49', note: 'Per user/month', cta: 'Go Pro', to: '/signup' },
    { name: 'Scale', price: '$99', note: 'Per user/month', cta: 'Scale With Nexus', to: '/dashboard' }
  ]

  return (
    <div className="home-page">
      <div className="glow-orbs">
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
        <div className="orb orb-3"></div>
      </div>

      <nav className="navbar">
        <div className="container flex" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="logo">
            <Sparkles size={32} className="logo-icon" />
            <span className="logo-text">Nexus AI</span>
          </div>
          <ul className="nav-links">
            <li><button className="nav-link-btn" type="button" onClick={() => handleSectionNavigation('features')}>Features</button></li>
            <li><button className="nav-link-btn" type="button" onClick={() => handleSectionNavigation('pricing')}>Pricing</button></li>
            <li><Link to="/login" className="nav-login">Login</Link></li>
            <li><Link to="/signup" className="nav-signup">Get Started</Link></li>
          </ul>
        </div>
      </nav>

      <section className="hero-section">
        <div className="hero-grid"></div>
        <div className="container">
          <div className="hero-content">
            <div className="badge fade-in"><Sparkles size={14} className="badge-icon" /><span>Introducing Nexus AI 2.0</span></div>
            <h1 className="hero-title slide-in-up">The Future of <span className="gradient-text">Intelligent Automation</span></h1>
            <p className="hero-subtitle slide-in-up" style={{ animationDelay: '150ms' }}>Harness the power of cutting-edge AI technology to automate complex workflows, gain deep insights, and scale your business exponentially.</p>
            <div className="hero-buttons slide-in-up" style={{ animationDelay: '300ms' }}>
              <Link to="/signup" className="btn btn-primary btn-lg"><span>Get Started Free</span><ArrowRight size={20} className="btn-arrow" /></Link>
              <Link to="/dashboard" className="btn btn-outline btn-lg"><span>Explore Dashboard</span></Link>
            </div>
            <p className="hero-cta-text">No credit card required. 14-day free trial.</p>
          </div>
        </div>
      </section>

      <section className="trusted-section"><div className="container"><p className="trusted-label">Trusted by leading organizations</p><div className="testimonials-grid">{testimonials.map((item, idx) => (<div key={idx} className="testimonial-card slide-in-left" style={{ animationDelay: `${idx * 100}ms` }}><span className="testimonial-logo">{item.logo}</span><p className="testimonial-company">{item.company}</p></div>))}</div></div></section>

      <section className="features-section" id="features"><div className="container"><div className="section-header fade-in"><h2>Powerful Features</h2><p>Everything you need to build, deploy, and scale AI applications</p></div><div className="features-grid">{features.map((feature, idx) => (<div key={idx} className="feature-card glass-primary fade-in" style={{ animationDelay: `${idx * 80}ms` }}><div className="feature-icon">{feature.icon}</div><h3>{feature.title}</h3><p>{feature.description}</p><div className="feature-glow"></div></div>))}</div></div></section>

       <section className="showcase-section"><div className="container"><div className="showcase-content"><div className="showcase-text slide-in-left"><h2>AI-Powered Productivity Unleashed</h2><p>Our advanced AI algorithms work 24/7 to optimize your workflows, automate repetitive tasks, and deliver actionable insights.</p><ul className="showcase-list"><li><span className="checkmark">✓</span> Real-time data processing</li><li><span className="checkmark">✓</span> Predictive analytics engine</li><li><span className="checkmark">✓</span> Automated decision making</li><li><span className="checkmark">✓</span> Custom ML model training</li></ul><Link to="/dashboard" className="btn btn-primary btn-md" style={{ marginTop: '2rem' }}>View Live Demo</Link></div><div className="showcase-visual slide-in-right"><div className="code-block glass-primary"><div className="code-header"><span className="code-dot"></span><span className="code-dot"></span><span className="code-dot"></span></div><pre className="code-text">{`const ai = new NexusAI()
const result = await ai.analyze(data)

✓ Processing complete
✓ Accuracy: 99.87%
✓ Time: 145ms`}</pre></div></div></div></div></section>

      <section className="stats-section"><div className="container"><div className="section-header fade-in"><h2>Proven Track Record</h2><p>Powering the world's most advanced AI applications</p></div><div className="stats-grid">{stats.map((stat, idx) => (<div key={idx} className="stat-card glass-primary fade-in" style={{ animationDelay: `${idx * 100}ms` }}><div className="stat-icon">{stat.icon}</div><div className="stat-content"><div className="stat-value">{stat.value}</div><p className="stat-label">{stat.label}</p></div></div>))}</div></div></section>

      <section className="final-cta"><div className="container"><div className="cta-content fade-in"><h2>Ready to Transform Your Business?</h2><p>Join thousands of companies using Nexus AI to unlock their potential</p><div className="cta-buttons"><Link to="/signup" className="btn btn-primary btn-lg">Start Your Free Trial</Link><Link to="/login" className="btn btn-outline btn-lg">Sign In</Link></div></div></div></section>

      <section className="pricing-section" id="pricing"><div className="container"><div className="section-header fade-in"><h2>Transparent Pricing</h2><p>Choose a plan that matches your team velocity.</p></div><div className="pricing-grid">{pricingPlans.map((plan, idx) => (<article key={plan.name} className="pricing-card glass-primary fade-in" style={{ animationDelay: `${idx * 90}ms` }}><h3>{plan.name}</h3><p className="pricing-price">{plan.price}</p><p className="pricing-note">{plan.note}</p><Link to={plan.to} className="btn btn-outline btn-md pricing-cta">{plan.cta}</Link></article>))}</div></div></section>

      <footer className="footer"><div className="container"><div className="footer-content"><div className="footer-section"><h4>Nexus AI</h4><p>The future of intelligent automation</p></div><div className="footer-section"><h5>Product</h5><ul><li><button className="footer-link-btn" type="button" onClick={() => handleSectionNavigation('features')}>Features</button></li><li><button className="footer-link-btn" type="button" onClick={() => handleSectionNavigation('pricing')}>Pricing</button></li><li><Link to="/dashboard">Dashboard</Link></li></ul></div><div className="footer-section"><h5>Company</h5><ul><li><Link to="/about">About</Link></li><li><Link to="/blog">Blog</Link></li><li><Link to="/careers">Careers</Link></li></ul></div><div className="footer-section"><h5>Legal</h5><ul><li><Link to="/privacy">Privacy</Link></li><li><Link to="/terms">Terms</Link></li><li><Link to="/security">Security</Link></li></ul></div></div><div className="footer-bottom"><p>&copy; 2024 Nexus AI. All rights reserved.</p><div className="footer-meta"><span className="footer-badge">v2.0.0</span><span className="footer-online"><span className="footer-online-dot" />AI Online</span><span className="footer-built">Built with Nexus Intelligence</span></div></div></div></footer>
    </div>
  )
}

export default Home
