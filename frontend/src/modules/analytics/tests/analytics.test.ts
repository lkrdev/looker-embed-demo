// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { attachLookerAnalytics, dispatchLookerEvent, LOOKER_EMBED_EVENTS } from '../index'

const win = window as any

describe('Looker JS Events Analytics Module', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    delete win.gtag
    delete win.dataLayer
    delete win.analytics
    delete win.snowplow
  })

  it('does not attach handlers when module is disabled', () => {
    const onMock = vi.fn().mockReturnThis()
    attachLookerAnalytics({ on: onMock } as any, false, 'ga4')
    expect(onMock).not.toHaveBeenCalled()
  })

  it('attaches all Looker Embed SDK events and dispatches to the active provider when enabled', () => {
    const handlers: Record<string, (e: any) => void> = {}
    const builder = {
      on: vi.fn((name: string, fn: (e: any) => void) => {
        handlers[name] = fn
        return builder
      }),
    } as any

    win.gtag = vi.fn()
    attachLookerAnalytics(builder, true, 'ga4')

    expect(Object.keys(handlers)).toEqual(LOOKER_EMBED_EVENTS)

    handlers['dashboard:run:complete']({ status: 'complete' })
    expect(win.gtag).toHaveBeenCalledWith('event', 'looker_dashboard_run_complete', {
      status: 'complete',
    })
  })

  it('forwards events to Segment (window.analytics.track)', () => {
    const track = vi.fn()
    win.analytics = { track }

    dispatchLookerEvent('dashboard:filters:changed', { Brand: 'Columbia' }, 'segment')
    expect(track).toHaveBeenCalledWith('Looker dashboard:filters:changed', { Brand: 'Columbia' })
  })

  it('forwards events to Snowplow (window.snowplow)', () => {
    win.snowplow = vi.fn()

    dispatchLookerEvent('explore:run:start', { model: 'embed_demo' }, 'snowplow')
    expect(win.snowplow).toHaveBeenCalledWith('trackSelfDescribingEvent', {
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
