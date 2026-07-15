import * as React from 'react'
import styles from './HeroBanner.module.css'
import type { HeroBannerProps } from '../../../types'

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
    const computedClassName = `${styles.heroBanner} ${className}`.trim().replace(/\s+/g, ' ')

    return (
      <section
        ref={ref}
        className={computedClassName}
        {...props}
      >
        <div className={styles.heroContent}>
          {badgeText && (
            <div className={styles.heroBadge}>
              {BadgeIcon && <BadgeIcon size={14} className="text-primary animate-pulse" />}
              <span>{badgeText}</span>
            </div>
          )}
          <h1 className={styles.heroTitle}>{title}</h1>
          {subtitle && <p className={styles.heroSubtitle}>{subtitle}</p>}
          {actions && <div className={styles.heroActions}>{actions}</div>}
        </div>
        {decoration && <div className={styles.heroDecoration}>{decoration}</div>}
      </section>
    )
  }
)

HeroBanner.displayName = 'HeroBanner'
