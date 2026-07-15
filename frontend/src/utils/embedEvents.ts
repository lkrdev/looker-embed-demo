import type { ILookerConnection } from '@looker/embed-sdk'

const appliedOptionsDashboards = new Set<string>()

/**
 * Listens for dashboard events (e.g. dashboard:loaded or dashboard:run:complete)
 * and dynamically updates dashboard element vis_config options via the JS Embed SDK
 * to ensure Highcharts dataLabels use high-contrast text coloring in Dark/Light modes.
 */
export function applyContrastDataLabels(this: ILookerConnection, event: any) {
  const dashId = String(event?.dashboard?.id || '')
  if (dashId && appliedOptionsDashboards.has(dashId)) {
    return
  }

  if (event?.dashboard?.options?.elements) {
    const elements = event.dashboard.options.elements
    const updatedElements: Record<string, any> = {}
    let modified = false

    Object.keys(elements).forEach((elementId) => {
      const el = elements[elementId]
      if (el) {
        modified = true
        updatedElements[elementId] = {
          ...el,
          vis_config: {
            ...(el.vis_config || {}),
            series: [
              {
                dataLabels: {
                  style: {
                    color: 'contrast',
                  },
                },
              },
              {
                dataLabels: {
                  style: {
                    color: 'contrast',
                  },
                },
              },
            ],
          },
        }
      }
    })

    if (modified) {
      if (dashId) appliedOptionsDashboards.add(dashId)
      console.log(
        '[Embed Events] Setting high-contrast dataLabels via JS embed event dashboard:options:set for dashboard:',
        dashId
      )
      try {
        this.asDashboardConnection().setOptions({
          elements: updatedElements,
        })
      } catch (err) {
        console.error('[Embed Events] Failed to set dashboard options via JS Embed SDK:', err)
      }
    }
  }
}
