import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import {
  TrendingUp,
  BarChart3,
  Loader2,
  Mail,
  ArrowRight,
  ShieldCheck
} from 'lucide-react'
import { setAuthSession } from '../utils/auth'
import { LookerLogo } from '../components/layout/LookerLogo'

export const Route = createFileRoute('/login')({
  component: LoginPage,
})

function GoogleLogo() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
    </svg>
  )
}

function MicrosoftLogo() {
  return (
    <svg viewBox="0 0 21 21" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="1" width="9" height="9" fill="#f25022" />
      <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
      <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
      <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
    </svg>
  )
}

function LoginPage() {
  const [loadingProvider, setLoadingProvider] = useState<'google' | 'microsoft' | 'email' | null>(null)
  const [email, setEmail] = useState('')

  const handleLogin = (provider: 'google' | 'microsoft' | 'email') => {
    if (loadingProvider !== null) return

    setLoadingProvider(provider)

    // Ensure safe default email if nothing inputted
    const finalEmail = provider === 'email' && email.trim() ? email.trim() : `${provider}-executive@looker.ecomm`
    setAuthSession(provider, finalEmail)

    // Loading state for 2 seconds, then execute a fully clean page navigation to the root index route
    setTimeout(() => {
      window.location.href = '/'
    }, 2000)
  }

  return (
    <div className="login-page-container">
      {/* Left / Top Showcase Section */}
      <div className="login-showcase">
        <div className="login-showcase-header">
          <div className="login-showcase-logo">
            <LookerLogo className="text-primary" />
          </div>
          <span className="font-bold text-xl tracking-tight">Looker eCommerce</span>
        </div>

        <div className="login-showcase-content">
          <div className="login-badge">
            <div className="login-badge-dot" />
            <span>Live System Active</span>
          </div>
          <h1 className="login-showcase-title">Executive Intelligence Suite</h1>
          <p className="login-showcase-desc">
            Access enterprise real-time gross merchandise performance, multi-channel attribution analytics, and predictive ML fulfillment streams in a unified portal.
          </p>

          <div className="login-mock-graphics">
            <div className="login-mock-card">
              <div className="login-mock-metric">
                <span className="login-mock-metric-val">$1.24B</span>
                <span className="login-mock-metric-lbl">Total trackable GGM</span>
              </div>
              <div className="login-mock-chart">
                <div className="login-mock-bar" style={{ height: '35%' }} />
                <div className="login-mock-bar" style={{ height: '50%' }} />
                <div className="login-mock-bar" style={{ height: '80%' }} />
                <div className="login-mock-bar" style={{ height: '65%' }} />
                <div className="login-mock-bar" style={{ height: '90%', background: '#10b981' }} />
              </div>
            </div>

            <div className="flex-row gap-4">
              <div className="login-mock-card flex-1 flex-row flex-start gap-3">
                <TrendingUp size={20} color="#a142f4" />
                <div className="flex-col">
                  <span className="font-bold text-sm">99.9% Yield</span>
                  <span className="text-xs text-muted">Fulfillment uptime</span>
                </div>
              </div>

              <div className="login-mock-card flex-1 flex-row flex-start gap-3">
                <BarChart3 size={20} color="#0b57d0" />
                <div className="flex-col">
                  <span className="font-bold text-sm">Real-time</span>
                  <span className="text-xs text-muted">Query processing</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-row flex-between text-xs text-muted" style={{ zIndex: 1 }}>
          <span>
            © 2026{' '}
            <a
              href="https://github.com/lkrdev"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'inherit', textDecoration: 'underline' }}
            >
              lkr.dev
            </a>
          </span>
          <div className="flex-row gap-4">
            <span>Privacy</span>
            <span>Terms</span>
            <span>Security</span>
          </div>
        </div>
      </div>

      {/* Right / Main Fake Login Card Section */}
      <div className="login-form-section">
        <div className="login-card">
          <div className="login-card-header">
            <h2 className="login-card-title">Welcome Back</h2>
            <p className="login-card-subtitle">Sign in to your e-commerce analytics workspace</p>
          </div>

          {/* Fake Enterprise Providers */}
          <div className="login-provider-btns">
            <button
              type="button"
              className="btn-auth-provider"
              onClick={() => handleLogin('google')}
              disabled={loadingProvider !== null}
            >
              <span className="provider-icon">
                {loadingProvider === 'google' ? (
                  <Loader2 className="animate-spin text-primary" size={18} />
                ) : (
                  <GoogleLogo />
                )}
              </span>
              <span>Sign in with Google</span>
            </button>

            <button
              type="button"
              className="btn-auth-provider"
              onClick={() => handleLogin('microsoft')}
              disabled={loadingProvider !== null}
            >
              <span className="provider-icon">
                {loadingProvider === 'microsoft' ? (
                  <Loader2 className="animate-spin text-primary" size={18} />
                ) : (
                  <MicrosoftLogo />
                )}
              </span>
              <span>Sign in with Microsoft</span>
            </button>
          </div>

          <div className="login-divider">
            <span>Or continue with email</span>
          </div>

          {/* Fake Email Form */}
          <form
            className="login-email-form"
            onSubmit={(e) => {
              e.preventDefault()
              handleLogin('email')
            }}
          >
            <div className="login-input-group">
              <label htmlFor="email-input" className="login-input-label">Work Email</label>
              <div className="login-input-wrapper">
                <span className="input-icon">
                  <Mail size={16} />
                </span>
                <input
                  id="email-input"
                  type="email"
                  placeholder="executive@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="login-input"
                  disabled={loadingProvider !== null}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn-login-submit"
              disabled={loadingProvider !== null}
            >
              {loadingProvider === 'email' ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  <span>Authenticating Session...</span>
                </>
              ) : (
                <>
                  <span>Access Workspace</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div className="login-footer-hint flex-center flex-row gap-1">
            <ShieldCheck size={14} className="text-success" />
            <span>Secure 10-minute encrypted local storage session</span>
          </div>
        </div>
      </div>
    </div>
  )
}
