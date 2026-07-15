import * as React from 'react'
import styles from './PageHeader.module.css'
import type { PageHeaderProps } from '../../../types'

export const PageHeader = React.forwardRef<HTMLDivElement, PageHeaderProps>(
  ({ className = '', title, subtitle, actions, border = true, ...props }, ref) => {
    const computedClassName = `${styles.pageHeader} ${border ? styles.borderBottom : ''} ${className}`.trim().replace(/\s+/g, ' ')

    return (
      <header
        ref={ref}
        className={computedClassName}
        {...props}
      >
        <div>
          <h1 className={styles.title}>{title}</h1>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </div>
        {actions && <div className={styles.actions}>{actions}</div>}
      </header>
    )
  }
)

PageHeader.displayName = 'PageHeader'
