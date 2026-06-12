import { ShieldAlert, ArrowLeft, KeyRound } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { Card } from '../ui/Card'
import { usePortal } from '../../context/PortalContext'
import type { AccessDeniedProps } from '../../types'

export function AccessDenied({ title }: AccessDeniedProps) {
  const { setIsSettingsOpen } = usePortal()

  return (
    <div className="access-denied-container">
      <Card variant="glass" className="access-denied-card flex-col flex-center gap-5 text-center">
        <div className="app-icon-container bg-error-light access-denied-icon-wrap">
          <ShieldAlert size={32} className="text-error" />
        </div>
        
        <div className="flex-col gap-2">
          <h2 className="text-2xl font-bold m-0">Access Restricted</h2>
          <p className="text-sm text-muted m-0">
            The <strong>{title}</strong> workspace requires an <strong>Advanced User</strong> access level. Your current profile configuration does not have permission to view or interact with this feature.
          </p>
        </div>

        <div className="flex-row gap-3 flex-center w-full mt-2">
          <Link to="/" className="btn btn-secondary flex-center gap-2 rounded-full flex-1">
            <ArrowLeft size={16} />
            <span>Go Home</span>
          </Link>
          <button className="btn btn-primary flex-center gap-2 rounded-full flex-1" onClick={() => setIsSettingsOpen(true)}>
            <KeyRound size={16} />
            <span>Upgrade Access</span>
          </button>
        </div>
      </Card>
    </div>
  )
}
