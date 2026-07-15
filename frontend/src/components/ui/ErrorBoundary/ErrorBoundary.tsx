import * as React from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { useLingui } from '@lingui/react'
import { ErrorBoundary as ErrorBoundaryText } from '../../../config/ErrorBoundary'
import styles from './ErrorBoundary.module.css'

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
        <ErrorFallbackView
          fallbackTitle={this.props.fallbackTitle}
          error={this.state.error}
          onReset={this.handleReset}
        />
      )
    }

    return this.props.children
  }
}

function ErrorFallbackView({
  fallbackTitle,
  error,
  onReset,
}: {
  fallbackTitle?: string
  error: Error | null
  onReset: () => void
}) {
  const { i18n } = useLingui()
  return (
    <div className={styles.errorContainer}>
      <div className={styles.errorIconWrapper}>
        <AlertTriangle size={24} />
      </div>

      <div className={styles.errorTextContainer}>
        <h3 className={styles.errorTitle}>
          {fallbackTitle || i18n._(ErrorBoundaryText.DEFAULT_TITLE)}
        </h3>
        <p className={styles.errorDesc}>
          {i18n._(ErrorBoundaryText.DEFAULT_DESC)}
        </p>
      </div>

      {error && (
        <div className={styles.errorDetails}>
          {error.message}
        </div>
      )}

      <button
        onClick={onReset}
        className={styles.retryButton}
      >
        <RefreshCw size={14} />
        <span>{i18n._(ErrorBoundaryText.TRY_AGAIN)}</span>
      </button>
    </div>
  )
}
