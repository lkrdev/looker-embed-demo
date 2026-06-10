import { ShieldAlert, ArrowLeft, KeyRound } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { Card } from './Card'
import { usePortal } from '../context/PortalContext'

interface AccessDeniedProps {
  title: string
}

export function AccessDenied({ title }: AccessDeniedProps) {
  const { setIsSettingsOpen } = usePortal()

  return (
    <div className="flex-center flex-col gap-6" style={{ minHeight: 'calc(100vh - 240px)', padding: 'var(--space-12) 0', width: '100%' }}>
      <Card variant="glass" className="flex-col flex-center gap-5 text-center" style={{ maxWidth: '480px', padding: 'var(--space-8)', borderRadius: 'var(--radius-2xl)', border: '1px solid var(--border)' }}>
        <div className="app-icon-container bg-error-light" style={{ width: '64px', height: '64px', borderRadius: 'var(--radius-full)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ShieldAlert size={32} className="text-error" />
        </div>
        
        <div className="flex-col gap-2">
          <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, margin: 0 }}>Access Restricted</h2>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', margin: 0 }}>
            The <strong>{title}</strong> workspace requires an <strong>Advanced User</strong> access level. Your current profile configuration does not have permission to view or interact with this feature.
          </p>
        </div>

        <div className="flex-row gap-3 flex-center" style={{ width: '100%', marginTop: 'var(--space-2)' }}>
          <Link to="/" className="btn btn-secondary flex-center gap-2" style={{ borderRadius: 'var(--radius-full)', flex: 1 }}>
            <ArrowLeft size={16} />
            <span>Go Home</span>
          </Link>
          <button className="btn btn-primary flex-center gap-2" style={{ borderRadius: 'var(--radius-full)', flex: 1 }} onClick={() => setIsSettingsOpen(true)}>
            <KeyRound size={16} />
            <span>Upgrade Access</span>
          </button>
        </div>
      </Card>
    </div>
  )
}
