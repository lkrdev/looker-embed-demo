import type { IEmbedBuilder } from '@looker/embed-sdk'
import { ANALYTICS_PROVIDER } from '../../config/constants'
import { attachGa4Analytics, trackGa4Event, LOOKER_EMBED_EVENTS } from './providers/ga4'
import { attachSegmentAnalytics, trackSegmentEvent } from './providers/segment'
import { attachSnowplowAnalytics, trackSnowplowEvent } from './providers/snowplow'
import { attachPosthogServerAnalytics, trackPosthogServerEvent } from './providers/posthogServer'

export { LOOKER_EMBED_EVENTS }

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
 * Attaches the configured analytics provider's Looker Embed SDK event listeners to the builder.
 */
export function attachLookerAnalytics(
  builder: IEmbedBuilder,
  provider: string = ANALYTICS_PROVIDER
): IEmbedBuilder {
  switch (provider) {
    case 'segment':
      return attachSegmentAnalytics(builder)
    case 'snowplow':
      return attachSnowplowAnalytics(builder)
    case 'posthog_server':
      return attachPosthogServerAnalytics(builder)
    case 'ga4':
    default:
      return attachGa4Analytics(builder)
  }
}
