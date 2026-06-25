import { ShieldAlert, ArrowLeft, KeyRound } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { useLingui } from '@lingui/react'
import { Card } from '../ui/Card'
import { usePortal } from '../../context/PortalContext'
import type { AccessDeniedProps } from '../../types'
import { AccessDenied as AccessDeniedText } from '../../config/AccessDenied'

export function AccessDenied({ title }: AccessDeniedProps) {
  const { setIsSettingsOpen } = usePortal()
  const { i18n } = useLingui()

  return (
    <div className="access-denied-container">
      <Card variant="glass" className="access-denied-card flex-col flex-center gap-5 text-center">
        <div className="app-icon-container bg-error-light access-denied-icon-wrap">
          <ShieldAlert size={32} className="text-error" />
        </div>
        
        <div className="flex-col gap-2">
          <h2 className="text-2xl font-bold m-0">{i18n._(AccessDeniedText.TITLE)}</h2>
          <p className="text-sm text-muted m-0">
            {i18n._(AccessDeniedText.DESC_PREFIX)}<strong>{title}</strong>{i18n._(AccessDeniedText.DESC_MIDDLE)}<strong>{i18n._(AccessDeniedText.ADVANCED_USER)}</strong>{i18n._(AccessDeniedText.DESC_SUFFIX)}
          </p>
        </div>

        <div className="flex-row gap-3 flex-center w-full mt-2">
          <Link to="/" className="btn btn-secondary flex-center gap-2 rounded-full flex-1">
            <ArrowLeft size={16} />
            <span>{i18n._(AccessDeniedText.GO_HOME)}</span>
          </Link>
          <button className="btn btn-primary flex-center gap-2 rounded-full flex-1" onClick={() => setIsSettingsOpen(true)}>
            <KeyRound size={16} />
            <span>{i18n._(AccessDeniedText.UPGRADE_ACCESS)}</span>
          </button>
        </div>
      </Card>
    </div>
  )
}

