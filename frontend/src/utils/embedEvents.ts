import type { ILookerConnection } from '@looker/embed-sdk'

const appliedOptionsDashboards = new Set<string>()

/**
 * Listens for dashboard events (e.g. dashboard:loaded or dashboard:run:complete)
 * and dynamically updates dashboard element vis_config options via the JS Embed SDK
 * to set label_color and Highcharts series dataLabels to white (#FFFFFF) in Dark Mode
 * or black (#000000) in Light Mode.
 */
export function applyContrastDataLabels(this: ILookerConnection, event: any) {
  const isDark = typeof document !== 'undefined' && (
    document.documentElement.classList.contains('dark') ||
    localStorage.getItem('theme') === 'dark'
  )
  const labelColor = isDark ? '#FFFFFF' : '#000000'

  const dashId = String(event?.dashboard?.id || '')
  const cacheKey = `${dashId}_${isDark ? 'dark' : 'light'}`

  if (dashId && appliedOptionsDashboards.has(cacheKey)) {
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
            label_color: [labelColor],
            series: [
              {
                dataLabels: {
                  style: {
                    color: labelColor,
                  },
                },
              },
              {
                dataLabels: {
                  style: {
                    color: labelColor,
                  },
                },
              },
            ],
          },
        }
      }
    })

    if (modified) {
      if (dashId) appliedOptionsDashboards.add(cacheKey)
      console.log(
        `[Embed Events] Setting label_color to ${labelColor} via JS embed event dashboard:options:set for dashboard:`,
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
