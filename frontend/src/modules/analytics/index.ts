import type { IEmbedBuilder, LookerEmbedEventMap } from '@looker/embed-sdk'
import { API_BASE_URL, ENABLE_MODULE_ANALYTICS, ANALYTICS_PROVIDER } from '../../config/constants'

const PROVIDERS: Record<string, (event: string, payload: Record<string, any>) => void> = {
  ga4: (event, payload) => {
    const name = `looker_${event.replace(/:/g, '_')}`
    ;(window as any).gtag?.('event', name, payload) ?? (window as any).dataLayer?.push({ event: name, ...payload })
  },
  segment: (event, payload) => (window as any).analytics?.track?.(`Looker ${event}`, payload),
  snowplow: (event, payload) =>
    (window as any).snowplow?.('trackSelfDescribingEvent', {
      event: { schema: 'iglu:com.looker/embed_event/jsonschema/1-0-0', data: { event_name: event, ...payload } },
    }),
  posthog_server: (event, payload) => {
    void fetch(`${API_BASE_URL}/api/modules/analytics/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ event, properties: payload }),
    })
      .then((res) => {
        if (!res.ok) {
          console.error('[Looker Analytics] PostHog forward failed with status:', res.status)
        }
      })
      .catch((err) => console.error('[Looker Analytics] PostHog forward failed:', err))
  },
}

// ponytail: @looker/chatty requires explicit event names in builder.handlers (no '*' wildcard)
export const LOOKER_EMBED_EVENTS: (keyof LookerEmbedEventMap)[] = [
  'dashboard:run:start',
  'dashboard:run:complete',
  'dashboard:filters:changed',
  'dashboard:edit:start',
  'dashboard:edit:cancel',
  'dashboard:save:complete',
  'dashboard:delete:complete',
  'dashboard:tile:start',
  'dashboard:tile:complete',
  'dashboard:tile:download',
  'dashboard:tile:explore',
  'dashboard:tile:view',
  'dashboard:tile:merge',
  'drillmenu:click',
  'drillmodal:download',
  'drillmodal:explore',
  'explore:ready',
  'explore:run:start',
  'explore:run:complete',
  'explore:state:changed',
  'look:ready',
  'look:run:start',
  'look:run:complete',
  'look:edit:start',
  'look:edit:cancel',
  'look:save:complete',
  'look:delete:complete',
  'look:state:changed',
  'page:changed',
  'page:properties:changed',
  'env:client:dialog',
  'session:expired',
]

export function dispatchLookerEvent(
  eventName: string,
  payload: Record<string, any> = {},
  provider: string = ANALYTICS_PROVIDER
): void {
  console.debug(`[Looker Analytics -> ${provider}]`, eventName, payload)
  ;(PROVIDERS[provider] ?? PROVIDERS.ga4)(eventName, payload)
}

export function attachLookerAnalytics(
  builder: IEmbedBuilder,
  enabled: boolean = ENABLE_MODULE_ANALYTICS,
  provider: string = ANALYTICS_PROVIDER
): IEmbedBuilder {
  if (!enabled) return builder
  LOOKER_EMBED_EVENTS.forEach((name) =>
    builder.on(name, (e?: any) => {
      dispatchLookerEvent(String(name), e ?? {}, provider)
      return undefined
    })
  )
  return builder
}
