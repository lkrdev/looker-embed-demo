import { Link } from '@tanstack/react-router'
import { Lock } from 'lucide-react'
import { Card } from './Card'
import { usePortal } from '../../context/PortalContext'
import { isRouteGated } from '../../config/constants'
import type { AppCardProps } from '../../types'

export function AppCard({
  to,
  title,
  description,
  icon: Icon,
  iconColor = 'text-primary',
  iconBgColor = 'bg-primary-light',
  className = '',
}: AppCardProps) {
  const { selectedType, openUpgradeModal } = usePortal()
  const isGated = isRouteGated(to, selectedType)

  const handleClick = (e: React.MouseEvent) => {
    if (isGated) {
      e.preventDefault()
      openUpgradeModal(to)
    }
  }

  return (
    <Link to={to} className={`app-card-link ${isGated ? 'is-gated-link' : ''}`} onClick={handleClick}>
      <Card variant="hoverable" className={`app-card ${className} ${isGated ? 'app-card-gated' : ''}`.trim().replace(/\s+/g, ' ')}>
        <div className="flex-between flex-row w-full items-start">
          <div className={`app-icon-container ${iconBgColor}`.trim()}>
            <Icon size={24} className={iconColor} />
          </div>
          {isGated && (
            <div className="app-card-lock-badge" title="Locked feature - Click to upgrade">
              <Lock size={15} />
            </div>
          )}
        </div>
        <h3 className="app-card-title">{title}</h3>
        {description && <p className="app-card-desc">{description}</p>}
      </Card>
    </Link>
  )
}

