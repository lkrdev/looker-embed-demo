import * as React from 'react'

export interface EmbedPlaceholderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: React.ReactNode
}

export const EmbedPlaceholder = React.forwardRef<HTMLDivElement, EmbedPlaceholderProps>(
  ({ className = '', title = 'Add iFrame', ...props }, ref) => {
    const computedClassName = `iframe-placeholder ${className}`.trim().replace(/\s+/g, ' ')

    return (
      <div
        ref={ref}
        className={computedClassName}
        {...props}
      >
        <span>{title}</span>
      </div>
    )
  }
)

EmbedPlaceholder.displayName = 'EmbedPlaceholder'
