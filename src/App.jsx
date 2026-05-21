import React, { Suspense, lazy } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import { NotificationProvider } from './context/NotificationContext'
import { ThemeProvider } from './context/ThemeContext'
import { ProtectedRoute, PublicOnlyRoute } from './components/ProtectedRoute'
import ErrorBoundary from './components/ErrorBoundary'
import OfflineBanner from './components/OfflineBanner'

// Route-level lazy loading for performance
const Home = lazy(() => import('./pages/Home'))
const Login = lazy(() => import('./pages/Login'))
const Signup = lazy(() => import('./pages/Signup'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const InfoPage = lazy(() => import('./pages/InfoPage'))

function TopLevelLoading() {
  return (
    <div className="nx-loading-screen">
      <div className="nx-loading-container">
        <div className="nx-loading-orb" />
        <div className="nx-loading-ring" />
        <div className="nx-loading-logo">✨</div>
        <p className="nx-loading-text">Calibrating Nexus Link...</p>
        <span className="nx-loading-bar">
          <span className="nx-loading-progress" />
        </span>
      </div>
    </div>
  )
}

function AppContent() {
  const { checkingAuth } = useAuth()

  if (checkingAuth) {
    return <TopLevelLoading />
  }

  return (
    <Router>
      <Suspense fallback={<TopLevelLoading />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route
            path="/login"
            element={
              <PublicOnlyRoute>
                <Login />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/signup"
            element={
              <PublicOnlyRoute>
                <Signup />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route path="/about" element={<InfoPage title="About Nexus AI" subtitle="Building premium AI workspace systems for modern product teams." />} />
          <Route path="/blog" element={<InfoPage title="Nexus Blog" subtitle="Product updates, engineering insights, and AI workflow playbooks." />} />
          <Route path="/careers" element={<InfoPage title="Careers at Nexus AI" subtitle="Join the team shaping the future of intelligent productivity." />} />
          <Route path="/privacy" element={<InfoPage title="Privacy Policy" subtitle="How Nexus AI protects user data and platform activity records." />} />
          <Route path="/terms" element={<InfoPage title="Terms of Service" subtitle="Usage terms, account responsibilities, and service boundaries." />} />
          <Route path="/security" element={<InfoPage title="Security Overview" subtitle="Security posture, incident readiness, and platform hardening principles." />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </Router>
  )
}

function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          <NotificationProvider>
            <ThemeProvider>
              <OfflineBanner />
              <AppContent />
            </ThemeProvider>
          </NotificationProvider>
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  )
}

export default App
