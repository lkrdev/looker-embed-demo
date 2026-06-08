import * as React from 'react'

export interface PageHeaderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title: React.ReactNode
  subtitle?: React.ReactNode
  actions?: React.ReactNode
  border?: boolean
}

export const PageHeader = React.forwardRef<HTMLDivElement, PageHeaderProps>(
  ({ className = '', title, subtitle, actions, border = true, ...props }, ref) => {
    const computedClassName = `page-header ${border ? 'border-bottom' : ''} ${className}`.trim().replace(/\s+/g, ' ')

    return (
      <header
        ref={ref}
        className={computedClassName}
        {...props}
      >
        <div>
          <h1 className="page-title">{title}</h1>
          {subtitle && <p className="page-subtitle">{subtitle}</p>}
        </div>
        {actions && <div className="page-header-actions">{actions}</div>}
      </header>
    )
  }
)

PageHeader.displayName = 'PageHeader'
