declare global {
  interface Window {
    snowplow?: (command: string, payload: Record<string, any>) => void
  }
}

/**
 * Example: Forward Looker Embed SDK JavaScript events to Snowplow (`window.snowplow`).
 */
export function trackSnowplowEvent(eventName: string, payload: Record<string, any> = {}): void {
  console.debug('[Looker Analytics -> Snowplow]', eventName, payload)

  if (typeof window !== 'undefined' && typeof window.snowplow === 'function') {
    window.snowplow('trackSelfDescribingEvent', {
      event: {
        schema: 'iglu:com.looker/embed_event/jsonschema/1-0-0',
        data: {
          event_name: eventName,
          ...payload,
        },
      },
    })
  }
}
