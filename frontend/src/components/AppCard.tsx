import * as React from 'react'
import { Link } from '@tanstack/react-router'
import { Card } from './Card'

export interface AppCardProps {
  to: string
  title: React.ReactNode
  description?: React.ReactNode
  icon: React.ComponentType<{ size?: number; className?: string }>
  iconColor?: string
  iconBgColor?: string
  className?: string
}

export function AppCard({
  to,
  title,
  description,
  icon: Icon,
  iconColor = 'text-primary',
  iconBgColor = 'bg-primary-light',
  className = '',
}: AppCardProps) {
  return (
    <Link to={to} className="app-card-link">
      <Card variant="hoverable" className={`app-card ${className}`.trim().replace(/\s+/g, ' ')}>
        <div className={`app-icon-container ${iconBgColor}`.trim()}>
          <Icon size={24} className={iconColor} />
        </div>
        <h3 className="app-card-title">{title}</h3>
        {description && <p className="app-card-desc">{description}</p>}
      </Card>
    </Link>
  )
}
