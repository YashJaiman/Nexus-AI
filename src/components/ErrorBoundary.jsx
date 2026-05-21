import React from 'react'
import './ErrorBoundary.css'

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('[Boundary Capture] React exception caught:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
    window.location.href = '/dashboard'
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="err-boundary-root">
          <div className="err-boundary-card glass fade-in">
            <div className="err-boundary-logo">⚠️</div>
            <h2 className="err-boundary-title">Neural Node Collapse</h2>
            <p className="err-boundary-msg">
              A runtime exception has severed the active neural interface thread.
            </p>
            <div className="err-boundary-stack">
              <code>{this.state.error?.toString() || 'Unknown runtime collapse'}</code>
            </div>
            <button className="err-boundary-btn" onClick={this.handleReset}>
              Re-Establish Neural Link
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
