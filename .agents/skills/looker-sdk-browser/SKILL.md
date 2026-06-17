---
name: looker-sdk-browser
description: Standards, architecture, and implementation for Just-in-Time access token refresh and initializing the official Looker Browser SDK with CustomEmbedSession.
---

# Implementing the Official Looker Browser SDK with Just-in-Time Access Token Refresh

When developing custom applications with Looker embedding (Signed Embed or Cookieless Embed), you should use the official Looker TypeScript/JavaScript SDK (`@looker/sdk` and `@looker/sdk-rtl`) in the browser to interact with Looker APIs directly (Content Access / CA API).

Because browser applications are public clients and API access tokens eventually expire, you must configure a secure, performant **Just-in-Time backend refresh proxy** rather than relying on resource-intensive background polling or exposing admin secrets.

---

## 1. Core Architectural Highlights

- **Safety Buffer**: A 10-second safety margin (`lagTime = 10000`) prevents latency discrepancies between the browser client and the Looker API server from causing authorization rejections.
- **Just-in-Time Delivery**: Refreshes are driven immediately and on-demand by API interceptors only when an API call is actively made.
- **Async Promise Lock**: An asynchronous Promise lock (`refreshPromise`) ensures that when multiple parallel API requests are launched concurrently and the active access token is expired, only a single backend token acquisition request is initiated.

---

## 2. Front-end Just-in-Time Interceptor (`EmbedSessionManager`)

Your frontend service must inspect the token expiration before any outgoing API request and proactively acquire a fresh token via your backend proxy endpoint:

```ts
import { API_BASE_URL } from '../config/constants'

export interface TokenResponse {
  access_token: string
  expires_in?: number // seconds
  expires_on?: number // epoch seconds
}

export class EmbedSessionManager {
  private accessToken: string | null = null
  private expiresAt: number = 0 // epoch milliseconds
  private lagTime = 10000 // 10s safety buffer in milliseconds
  private refreshPromise: Promise<string> | null = null

  /**
   * Retrieves a valid access token, initiating an async refresh with a Promise lock if necessary.
   */
  public async getValidToken(): Promise<string> {
    if (this.refreshPromise) return this.refreshPromise

    const now = Date.now()
    if (!this.accessToken || now >= this.expiresAt - this.lagTime) {
      this.refreshPromise = this.performRefresh()
      try {
        return await this.refreshPromise
      } finally {
        this.refreshPromise = null // release async lock
      }
    }
    return this.accessToken
  }

  /**
   * Evaluates the active authentication state synchronously.
   */
  public isAuthenticated(): boolean {
    return !!this.accessToken && Date.now() < this.expiresAt - this.lagTime
  }

  private async performRefresh(): Promise<string> {
    const response = await fetch(`${API_BASE_URL}/api/looker/access-token`, {
      method: 'POST',
      credentials: 'include', // Crucial to pass secure session cookies
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error('Looker access token refresh request failed')
    }

    const data = await response.json()
    // Handle both flat and nested token response structures gracefully
    const tokenObj: TokenResponse = typeof data.access_token === 'string' ? data : data.access_token

    if (tokenObj && tokenObj.access_token) {
      this.accessToken = tokenObj.access_token
      const expires_in = tokenObj.expires_in || 3600
      this.expiresAt = Date.now() + expires_in * 1000
      return this.accessToken
    }

    throw new Error('Invalid Looker API access token payload structure')
  }
}
```

---

## 3. Initializing Official SDK Context (`CustomEmbedSession`)

To plug your `EmbedSessionManager` into Looker's fully typed SDK, extend the base `AuthSession` from `@looker/sdk-rtl` and pass your custom session context to `functionalSdk40`:

```ts
import {
  AuthSession,
  BrowserTransport,
  DefaultSettings,
} from '@looker/sdk-rtl'
import type { IRequestProps, IApiSettings, ITransport } from '@looker/sdk-rtl'
import { functionalSdk40 } from '@looker/sdk'
import type { ILooker40SDK } from '@looker/sdk'
import { LOOKER_INSTANCE_URL } from '../config/constants'

export class CustomEmbedSession extends AuthSession {
  private manager = new EmbedSessionManager()

  constructor(settings: IApiSettings, transport: ITransport) {
    super(settings, transport)
  }

  /**
   * Intercepts outgoing API requests to attach the valid CORS mode and authorized Bearer token.
   */
  async authenticate(props: IRequestProps): Promise<IRequestProps> {
    const token = await this.manager.getValidToken()
    return {
      ...props,
      mode: 'cors', // Explicitly enables correct browser CORS mode
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

// Statically resolve the base URL
const baseUrl = LOOKER_INSTANCE_URL
  ? LOOKER_INSTANCE_URL.replace(/\/$/, '')
  : window.location.origin

const sdkSettings = {
  ...DefaultSettings(),
  base_url: baseUrl,
}

const customTransport = new BrowserTransport(sdkSettings)

// Export the underlying functional Looker API 4.0 SDK instance
export const lookerBrowserSdk: ILooker40SDK = functionalSdk40(
  new CustomEmbedSession(sdkSettings, customTransport)
)
```

---

## 4. Backend Proxy API (`/api/looker/access-token`)

On your backend (e.g., FastAPI or Express), secure the route with authentication middleware that retrieves the logged-in user context. Map their identity via Looker's `user_for_credential` (or cookieless user lookup) and generate a scoped access token via `login_user`:

```python
@router.post("/access-token")
def get_looker_access_token(
    request: Request,
    looker_user_id: str = Depends(get_current_looker_user_id),
    looker_svc: LookerService = Depends(get_looker_service),
):
    """
    Retrieves an API access token for an authenticated embed user and caches it.
    """
    try:
        access_token_obj = looker_svc.login_user(looker_user_id)
        return {
            "message": "API token acquired successfully",
            "access_token": {
                "access_token": access_token_obj.access_token,
                "expires_in": access_token_obj.expires_in,
            },
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to acquire API token")
```

---

## 5. CORS & Security Clearance (Critical Configuration)

As validated by the Looker SDK's foundational security mechanisms (`BrowserSession.ts`), access tokens generated on behalf of embedded users carry full entitlement to execute direct browser API calls via CORS.

**Mandatory Step**: You **must** add your frontend client application URL (including exact protocol and port) to the **Embedded Domain Allowlist** under **Looker Admin > Settings > Embed**. Without this allowlist entry, web browsers will unilaterally block preflight (`OPTIONS`) cross-origin calls regardless of whether the Bearer authentication header is valid.
