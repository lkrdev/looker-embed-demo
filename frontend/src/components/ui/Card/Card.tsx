import * as React from 'react'
import styles from './Card.module.css'
import type { CardProps } from '../../../types'

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className = '', variant = 'default', children, ...props }, ref) => {
    const variantClasses = {
      default: '',
      hoverable: styles.hoverable || '',
      glass: styles.glass || '',
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
