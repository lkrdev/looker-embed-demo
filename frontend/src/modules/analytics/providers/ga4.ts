declare global {
  interface Window {
    gtag?: (command: 'event', eventName: string, params?: Record<string, any>) => void
    dataLayer?: Record<string, any>[]
  }
}

/**
 * Example: Forward Looker Embed SDK JavaScript events to Google Analytics 4 (`gtag`) or GTM (`dataLayer`).
 */
export function trackGa4Event(eventName: string, payload: Record<string, any> = {}): void {
  const gaEventName = `looker_${eventName.replace(/:/g, '_')}`
  console.debug('[Looker Analytics -> GA4]', gaEventName, payload)

  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag('event', gaEventName, payload)
  } else if (typeof window !== 'undefined' && Array.isArray(window.dataLayer)) {
    window.dataLayer.push({ event: gaEventName, ...payload })
  }
}
