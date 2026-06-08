import * as React from 'react'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'hoverable' | 'glass'
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className = '', variant = 'default', children, ...props }, ref) => {
    const variantClasses = {
      default: '',
      hoverable: 'hover-lift',
      glass: 'card-glass',
    }

    const computedClassName = `card ${variantClasses[variant]} ${className}`.trim().replace(/\s+/g, ' ')

    return (
      <div
        ref={ref}
        className={computedClassName}
        {...props}
      >
        {children}
      </div>
    )
  }
)

Card.displayName = 'Card'
