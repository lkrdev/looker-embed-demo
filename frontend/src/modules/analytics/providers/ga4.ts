/**
 * Standalone Google Analytics 4 (`gtag`) / Google Tag Manager (`dataLayer`) Example
 * for `@looker/embed-sdk` JavaScript Events.
 *
 * Usage with the Looker Embed SDK Builder:
 * ```ts
 * import { getEmbedSDK, LookerEmbedExSDK } from '@looker/embed-sdk'
 * import { attachGa4Analytics } from './ga4'
 *
 * const sdk = getEmbedSDK(new LookerEmbedExSDK())
 * const builder = sdk.createDashboardWithId('1')
 *
 * attachGa4Analytics(builder)
 *
 * const connection = await builder.appendTo('#embed-container').build().connect()
 * ```
 */
import type { IEmbedBuilder, LookerEmbedEventMap } from '@looker/embed-sdk'

declare global {
  interface Window {
    gtag?: (command: 'event', eventName: string, params?: Record<string, any>) => void
    dataLayer?: Record<string, any>[]
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

export function trackGa4Event(eventName: string, payload: Record<string, any> = {}): void {
  const gaEventName = `looker_${eventName.replace(/:/g, '_')}`
  console.debug('[Looker Analytics -> GA4]', gaEventName, payload)

  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag('event', gaEventName, payload)
  } else if (typeof window !== 'undefined' && Array.isArray(window.dataLayer)) {
    window.dataLayer.push({ event: gaEventName, ...payload })
  }
}

export function attachGa4Analytics(builder: IEmbedBuilder): IEmbedBuilder {
  for (const eventName of LOOKER_EMBED_EVENTS) {
    builder.on(eventName, (event?: any) => {
      trackGa4Event(String(eventName), event ?? {})
      return undefined
    })
  }
  return builder
}
