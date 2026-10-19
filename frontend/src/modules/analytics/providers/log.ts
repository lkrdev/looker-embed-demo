/**
 * Standalone Backend JSON Logger (`log`) Example (`POST /api/modules/analytics/events`)
 * for `@looker/embed-sdk` JavaScript Events.
 *
 * Sends Looker Embed SDK events to the backend API, which emits structured JSON
 * payloads to `stdout` for log collection (e.g., Cloud Run / Cloud Logging).
 *
 * Usage with the Looker Embed SDK Builder:
 * ```ts
 * import { getEmbedSDK, LookerEmbedExSDK } from '@looker/embed-sdk'
 * import { attachLogAnalytics } from './log'
 *
 * const sdk = getEmbedSDK(new LookerEmbedExSDK())
 * const builder = sdk.createDashboardWithId('1')
 *
 * attachLogAnalytics(builder)
 *
 * const connection = await builder.appendTo('#embed-container').build().connect()
 * ```
 */
import type { IEmbedBuilder, LookerEmbedEventMap } from '@looker/embed-sdk'
import { API_BASE_URL } from '../../../config/constants'

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

export async function trackLogEvent(
  eventName: string,
  payload: Record<string, any> = {}
): Promise<void> {
  console.debug('[Looker Analytics -> Backend JSON Log]', eventName, payload)

  try {
    const response = await fetch(`${API_BASE_URL}/api/modules/analytics/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        event: eventName,
        properties: payload,
      }),
    })

    if (!response.ok) {
      console.error('[Looker Analytics] Backend log forward failed with status:', response.status)
    }
  } catch (err) {
    console.error('[Looker Analytics] Backend log forward failed:', err)
  }
}

export function attachLogAnalytics(builder: IEmbedBuilder): IEmbedBuilder {
  for (const eventName of LOOKER_EMBED_EVENTS) {
    builder.on(eventName, (event?: any) => {
      void trackLogEvent(String(eventName), event ?? {})
      return undefined
    })
  }
  return builder
}
