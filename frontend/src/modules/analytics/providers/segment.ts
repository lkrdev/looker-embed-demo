/**
 * Standalone Segment (`window.analytics.track`) Example
 * for `@looker/embed-sdk` JavaScript Events.
 *
 * Usage with the Looker Embed SDK Builder:
 * ```ts
 * import { getEmbedSDK, LookerEmbedExSDK } from '@looker/embed-sdk'
 * import { attachSegmentAnalytics } from './segment'
 *
 * const sdk = getEmbedSDK(new LookerEmbedExSDK())
 * const builder = sdk.createDashboardWithId('1')
 *
 * attachSegmentAnalytics(builder)
 *
 * const connection = await builder.appendTo('#embed-container').build().connect()
 * ```
 */
import type { IEmbedBuilder, LookerEmbedEventMap } from '@looker/embed-sdk'

declare global {
  interface Window {
    analytics?: {
      track: (eventName: string, properties?: Record<string, any>) => void
    }
  }
}

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

export function trackSegmentEvent(eventName: string, payload: Record<string, any> = {}): void {
  console.debug('[Looker Analytics -> Segment]', eventName, payload)

  if (typeof window !== 'undefined' && window.analytics && typeof window.analytics.track === 'function') {
    window.analytics.track(`Looker ${eventName}`, payload)
  }
}

export function attachSegmentAnalytics(builder: IEmbedBuilder): IEmbedBuilder {
  for (const eventName of LOOKER_EMBED_EVENTS) {
    builder.on(eventName, (event?: any) => {
      trackSegmentEvent(String(eventName), event ?? {})
      return undefined
    })
  }
  return builder
}
