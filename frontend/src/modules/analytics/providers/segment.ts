declare global {
  interface Window {
    analytics?: {
      track: (eventName: string, properties?: Record<string, any>) => void
    }
  }
}

/**
 * Example: Forward Looker Embed SDK JavaScript events to Segment (`window.analytics.track`).
 */
export function trackSegmentEvent(eventName: string, payload: Record<string, any> = {}): void {
  console.debug('[Looker Analytics -> Segment]', eventName, payload)

  if (typeof window !== 'undefined' && window.analytics && typeof window.analytics.track === 'function') {
    window.analytics.track(`Looker ${eventName}`, payload)
  }
}
