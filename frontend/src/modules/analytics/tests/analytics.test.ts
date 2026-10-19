// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { attachLookerAnalytics, dispatchLookerEvent, LOOKER_EMBED_EVENTS } from '../index'

describe('Looker JS Events Analytics Module', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    delete window.gtag
    delete window.dataLayer
    delete window.analytics
    delete window.snowplow
  })

  it('attaches all Looker Embed SDK events and dispatches to the active provider', () => {
    const handlers: Record<string, (e: any) => void> = {}
    const builder = {
      on: vi.fn((name: string, fn: (e: any) => void) => {
        handlers[name] = fn
        return builder
      }),
    } as any

    window.gtag = vi.fn()
    attachLookerAnalytics(builder, 'ga4')

    expect(Object.keys(handlers)).toEqual(LOOKER_EMBED_EVENTS)

    handlers['dashboard:run:complete']({ status: 'complete' })
    expect(window.gtag).toHaveBeenCalledWith('event', 'looker_dashboard_run_complete', {
      status: 'complete',
    })
  })

  it('forwards events to Segment (window.analytics.track)', () => {
    const track = vi.fn()
    window.analytics = { track }

    dispatchLookerEvent('dashboard:filters:changed', { Brand: 'Columbia' }, 'segment')
    expect(track).toHaveBeenCalledWith('Looker dashboard:filters:changed', { Brand: 'Columbia' })
  })

  it('forwards events to Snowplow (window.snowplow)', () => {
    window.snowplow = vi.fn()

    dispatchLookerEvent('explore:run:start', { model: 'embed_demo' }, 'snowplow')
    expect(window.snowplow).toHaveBeenCalledWith('trackSelfDescribingEvent', {
      event: {
        schema: 'iglu:com.looker/embed_event/jsonschema/1-0-0',
        data: { event_name: 'explore:run:start', model: 'embed_demo' },
      },
    })
  })

  it('forwards events to Server-side PostHog backend endpoint', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}'))

    dispatchLookerEvent('page:changed', { page: { type: 'dashboards' } }, 'posthog_server')
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/api/modules/analytics/events'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          event: 'page:changed',
          properties: { page: { type: 'dashboards' } },
        }),
      })
    )
  })
})
