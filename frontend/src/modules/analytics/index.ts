import type { IEmbedBuilder, LookerEmbedEventMap } from '@looker/embed-sdk'
import { ANALYTICS_PROVIDER } from '../../config/constants'
import { trackGa4Event } from './providers/ga4'
import { trackSegmentEvent } from './providers/segment'
import { trackSnowplowEvent } from './providers/snowplow'
import { trackPosthogServerEvent } from './providers/posthogServer'

// Looker Embed SDK events supported by @looker/embed-sdk
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

/**
 * Routes a Looker JavaScript event to the configured analytics provider.
 */
export function dispatchLookerEvent(
  eventName: string,
  payload: Record<string, any> = {},
  provider: string = ANALYTICS_PROVIDER
): void {
  switch (provider) {
    case 'segment':
      trackSegmentEvent(eventName, payload)
      break
    case 'snowplow':
      trackSnowplowEvent(eventName, payload)
      break
    case 'posthog_server':
      void trackPosthogServerEvent(eventName, payload)
      break
    case 'ga4':
    default:
      trackGa4Event(eventName, payload)
      break
  }
}

/**
 * Registers Looker Embed SDK event listeners on the builder and forwards
 * each event to the configured analytics provider.
 */
export function attachLookerAnalytics(
  builder: IEmbedBuilder,
  provider: string = ANALYTICS_PROVIDER
): IEmbedBuilder {
  for (const eventName of LOOKER_EMBED_EVENTS) {
    builder.on(eventName, (event?: any) => {
      dispatchLookerEvent(String(eventName), event ?? {}, provider)
      return undefined
    })
  }

  return builder
}
