import * as React from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallbackTitle?: string
  onReset?: () => void
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary] Caught rendering error:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
    this.props.onReset?.()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="card flex-col items-center justify-center text-center gap-4 relative overflow-hidden p-6 w-full shadow-md backdrop-blur-md"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'var(--surface)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '16px',
            padding: '24px',
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.05), var(--surface))',
          }}
        >
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center shadow-inner"
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              color: 'var(--error)',
            }}
          >
            <AlertTriangle size={24} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxWidth: '440px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text)', margin: 0, fontFamily: 'var(--font-heading)' }}>
              {this.props.fallbackTitle || 'Section Display Error'}
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--secondary)', margin: 0 }}>
              An unexpected error occurred while rendering this component.
            </p>
          </div>

          {this.state.error && (
            <div
              style={{
                fontSize: '12px',
                fontFamily: 'monospace',
                color: 'var(--error)',
                backgroundColor: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                padding: '10px 14px',
                borderRadius: '8px',
                maxWidth: '100%',
                overflowX: 'auto',
                textAlign: 'left',
              }}
            >
              {this.state.error.message}
            </div>
          )}

          <button
            onClick={this.handleReset}
            className="btn hover-lift font-bold text-xs py-2 px-5 rounded-full transition-all"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              padding: '8px 20px',
              borderRadius: '20px',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--primary)',
              color: '#ffffff',
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={14} />
            <span>Try Again</span>
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
