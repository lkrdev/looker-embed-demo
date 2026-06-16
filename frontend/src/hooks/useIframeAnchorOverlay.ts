import * as React from 'react'

export function useIframeAnchorOverlay(
  iframeAnchor: HTMLDivElement | null,
  isVisible: boolean
) {
  const [style, setStyle] = React.useState<React.CSSProperties>({
    display: 'none',
  })

  React.useEffect(() => {
    if (!isVisible || !iframeAnchor) {
      setStyle({ display: 'none' })
      return
    }

    const updatePosition = () => {
      const parent = iframeAnchor.closest('.portal-pane')
      if (!parent) return

      const rect = iframeAnchor.getBoundingClientRect()
      const parentRect = parent.getBoundingClientRect()

      setStyle({
        position: 'absolute',
        top: `${rect.top - parentRect.top}px`,
        left: `${rect.left - parentRect.left}px`,
        width: `${rect.width}px`,
        height: `${rect.height}px`,
        display: 'flex',
        flexDirection: 'column',
        zIndex: 5,
        pointerEvents: 'auto',
      })
    }

    // Observe size changes of the anchor element
    const observer = new ResizeObserver(() => {
      updatePosition()
    })
    observer.observe(iframeAnchor)

    // Run layout calculations
    updatePosition()

    // Listen to resize and scroll events
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true) // Listen to nested scroll containers

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [iframeAnchor, isVisible])

  return style
}
