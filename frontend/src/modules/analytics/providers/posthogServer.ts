import { API_BASE_URL } from '../../../config/constants'

/**
 * Example: Forward Looker Embed SDK JavaScript events to a backend server-side PostHog endpoint.
 */
export async function trackPosthogServerEvent(
  eventName: string,
  payload: Record<string, any> = {}
): Promise<void> {
  console.debug('[Looker Analytics -> Server-side PostHog]', eventName, payload)

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
      console.error('[Looker Analytics] PostHog forward failed with status:', response.status)
    }
  } catch (err) {
    console.error('[Looker Analytics] PostHog forward failed:', err)
  }
}
