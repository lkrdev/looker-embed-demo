import * as React from 'react'

export interface HeroBannerProps extends Omit<React.HTMLAttributes<HTMLElement>, 'title'> {
  title: React.ReactNode
  subtitle?: React.ReactNode
  badgeText?: string
  badgeIcon?: React.ComponentType<{ size?: number; className?: string }>
  actions?: React.ReactNode
  decoration?: React.ReactNode
}

export const HeroBanner = React.forwardRef<HTMLElement, HeroBannerProps>(
  (
    {
      className = '',
      title,
      subtitle,
      badgeText,
      badgeIcon: BadgeIcon,
      actions,
      decoration,
      ...props
    },
    ref
  ) => {
    const computedClassName = `hero-banner ${className}`.trim().replace(/\s+/g, ' ')

    return (
      <section
        ref={ref}
        className={computedClassName}
        {...props}
      >
        <div className="hero-content">
          {badgeText && (
            <div className="hero-badge">
              {BadgeIcon && <BadgeIcon size={14} className="text-primary animate-pulse" />}
              <span>{badgeText}</span>
            </div>
          )}
          <h1 className="hero-title">{title}</h1>
          {subtitle && <p className="hero-subtitle">{subtitle}</p>}
          {actions && <div className="hero-actions">{actions}</div>}
        </div>
        {decoration && <div className="hero-decoration">{decoration}</div>}
      </section>
    )
  }
)

HeroBanner.displayName = 'HeroBanner'
