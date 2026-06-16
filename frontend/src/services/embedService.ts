import { API_BASE_URL } from '../config/constants'
import { ROLE_ID_MAPPINGS, LANGUAGE_LOCALE_MAPPINGS } from '../config/constants'
import type { EmbedType } from '../types'
import { lookerBrowserSdk, CustomEmbedSession } from './LookerBrowserSDK'

export function configureCookielessSDK(
  sdk: any,
  lookerHost: string,
  getActive: () => boolean = () => true
) {
  sdk.initCookieless(
    lookerHost,
    // acquireSession callback
    async () => {
      if (!getActive()) throw new Error('Embed SDK connection aborted')
      const response = await fetch(
        `${API_BASE_URL}/api/looker/acquire-embed-session`,
        {
          method: 'POST',
          credentials: 'include', // Crucial to pass HttpOnly configuration/identity cookies
        }
      )
      if (!response.ok)
        throw new Error('Failed to acquire cookieless embed session')
      if (!getActive()) throw new Error('Embed SDK connection aborted')
      return response.json()
    },
    // generateTokens callback
    async (tokens: any) => {
      if (!getActive()) throw new Error('Embed SDK connection aborted')
      const response = await fetch(
        `${API_BASE_URL}/api/looker/generate-embed-tokens`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(tokens),
          credentials: 'include', // Crucial to pass HttpOnly tokens cookies
        }
      )
      if (!response.ok)
        throw new Error('Failed to refresh cookieless embed tokens')
      if (!getActive()) throw new Error('Embed SDK connection aborted')
      return response.json()
    }
  )
}

export async function syncLookerSession(
  role: EmbedType,
  lang: string,
  brand: string,
  onSuccess?: () => void
) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/looker/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        role_id: ROLE_ID_MAPPINGS[role] || 'viewer',
        locale: LANGUAGE_LOCALE_MAPPINGS[lang] || 'en',
        brand: brand,
      }),
    })
    if (!response.ok) {
      throw new Error('Failed to update Looker session config')
    }
    const data = await response.json()
    console.log('Successfully synchronized Looker session config', data)
    if (lookerBrowserSdk.authSession instanceof CustomEmbedSession) {
      lookerBrowserSdk.authSession.clearToken()
    }

    // Proactively acquire a fresh Cookieless Embed session to ensure Looker purges old token and instantly sets new brand
    console.log('Proactively acquiring fresh cookieless embed session for new user attributes...')
    const acquireRes = await fetch(
      `${API_BASE_URL}/api/looker/acquire-embed-session`,
      {
        method: 'POST',
        credentials: 'include',
      }
    )
    if (!acquireRes.ok) {
      throw new Error('Failed to acquire fresh cookieless embed session')
    }
    const acquireData = await acquireRes.json()
    console.log('Successfully acquired fresh cookieless embed session', acquireData)

    if (onSuccess) onSuccess()
  } catch (err) {
    console.error('Error synchronizing Looker session config:', err)
  }
}

