import * as React from 'react'
import { useRef, useEffect } from 'react'
import { usePortal } from '../../../context/PortalContext'
import type { EmbedPlaceholderProps } from '../../../types'
import styles from './EmbedPlaceholder.module.css'

export const EmbedPlaceholder = React.forwardRef<HTMLDivElement, EmbedPlaceholderProps>(
  ({ className = '', ...props }, forwardedRef) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const { setIframeAnchor } = usePortal()

    // Assign DOM node to both the local containerRef and the forwarded ref
    const setRefs = React.useCallback(
      (node: HTMLDivElement | null) => {
        (containerRef as any).current = node
        if (typeof forwardedRef === 'function') {
          forwardedRef(node)
        } else if (forwardedRef) {
          (forwardedRef as any).current = node
        }
      },
      [forwardedRef]
    )

    // Register this element as the active Looker iframe anchor
    useEffect(() => {
      if (containerRef.current) {
        setIframeAnchor(containerRef.current)
      }
      return () => {
        setIframeAnchor(null)
      }
    }, [setIframeAnchor])

    const computedClassName = `${styles.iframePlaceholder} iframe-placeholder ${className}`.trim().replace(/\s+/g, ' ')

    return (
      <div
        ref={setRefs}
        className={computedClassName}
        {...props}
      />
    )
  }
)

EmbedPlaceholder.displayName = 'EmbedPlaceholder'
