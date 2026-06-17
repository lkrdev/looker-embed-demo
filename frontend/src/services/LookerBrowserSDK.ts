import { API_BASE_URL, LOOKER_INSTANCE_URL } from '../config/constants'
import {
  AuthSession,
  BrowserTransport,
  DefaultSettings,
} from '@looker/sdk-rtl'
import type { IRequestProps, IApiSettings, ITransport } from '@looker/sdk-rtl'
import { Looker40SDK } from '@looker/sdk/lib/4.0/methods'

interface TokenResponse {
  access_token: string
  expires_in?: number // seconds
  expires_on?: number // epoch seconds
}

/**
 * Encapsulates client-side access token management with Just-in-Time refresh
 * and an Async Promise Lock.
 */
export class EmbedSessionManager {
  private accessToken: string | null = null
  private expiresAt: number = 0 // epoch milliseconds
  private lagTime = 10000 // 10s safety buffer in ms
  private refreshPromise: Promise<string> | null = null

  public async getValidToken(): Promise<string> {
    if (this.refreshPromise) return this.refreshPromise

    const now = Date.now()
    if (!this.accessToken || now >= this.expiresAt - this.lagTime) {
      this.refreshPromise = this.performRefresh()
      try {
        return await this.refreshPromise
      } finally {
        this.refreshPromise = null
      }
    }
    return this.accessToken
  }

  public isAuthenticated(): boolean {
    return !!this.accessToken && Date.now() < this.expiresAt - this.lagTime
  }

  public clearToken(): void {
    this.accessToken = null
    this.expiresAt = 0
  }

  private async performRefresh(): Promise<string> {
    const response = await fetch(`${API_BASE_URL}/api/looker/access-token`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error('Looker Access Token refresh request failed')
    }

    const data = await response.json()
    const tokenObj: TokenResponse =
      typeof data.access_token === 'string' ? data : data.access_token

    if (tokenObj && tokenObj.access_token) {
      this.accessToken = tokenObj.access_token
      if (tokenObj.expires_on) {
        this.expiresAt = tokenObj.expires_on * 1000
      } else {
        const expires_in = tokenObj.expires_in || 3600
        this.expiresAt = Date.now() + expires_in * 1000
      }
      return this.accessToken
    }

    throw new Error('Invalid Looker API access token payload structure')
  }
}

/**
 * Custom Looker AuthSession for direct Browser SDK usage via CORS proxy tokens.
 */
export class CustomEmbedSession extends AuthSession {
  private manager = new EmbedSessionManager()

  constructor(settings: IApiSettings, transport: ITransport) {
    super(settings, transport)
  }

  public clearToken(): void {
    this.manager.clearToken()
  }

  async authenticate(props: IRequestProps): Promise<IRequestProps> {
    const token = await this.manager.getValidToken()
    return {
      ...props,
      mode: 'cors',
      headers: {
        ...props.headers,
        Authorization: `Bearer ${token}`,
      },
    }
  }

  isAuthenticated(): boolean {
    return this.manager.isAuthenticated()
  }

  async getToken(): Promise<string> {
    return this.manager.getValidToken()
  }
}

// Statically configure settings and export official functional SDK
const baseUrl = LOOKER_INSTANCE_URL
  ? LOOKER_INSTANCE_URL.replace(/\/$/, '')
  : window.location.origin

const sdkSettings = {
  ...DefaultSettings(),
  base_url: baseUrl,
}

const customTransport = new BrowserTransport(sdkSettings)

export const lookerBrowserSdk = new Looker40SDK(
  new CustomEmbedSession(sdkSettings, customTransport)
)

export const lookerBrowserSDK = lookerBrowserSdk
