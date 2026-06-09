---
name: cors-api
description: Architectural pattern for direct browser-to-Looker API calls via CORS using OAuth2 with PKCE for secure client-side authentication.
---

# Looker CORS API OAuth Pattern (Direct Browser Auth)

This skill describes the **Direct Browser OAuth** pattern for Looker. It allows frontend applications to authenticate users directly against a Looker instance and make secure API calls via CORS without requiring a custom backend proxy.

## 1. The Core Pattern

The pattern leverages Looker's built-in OAuth2 support with **PKCE (Proof Key for Code Exchange)** to safely perform the authentication flow entirely in the browser.

### Architectural Components
1.  **Browser Application**: The frontend app that performs the OAuth flow and makes direct `fetch` calls to the Looker API.
2.  **Looker Auth Server**: Handles user login, consent, and issues access tokens.
3.  **Looker API**: Serves data directly to the browser via CORS.

## 2. The OAuth2 + PKCE Flow

Because a browser application is a "public client" and cannot store secrets, PKCE is used to secure the authorization code exchange.

1.  **Code Challenge Generation**: The app generates a cryptographically random `code_verifier` and its SHA-256 hash, the `code_challenge`.
2.  **Redirect to Looker**: The app redirects the user to Looker's `/auth` endpoint with parameters:
    *   `client_id`: The registered Looker OAuth Client ID.
    *   `redirect_uri`: The app's callback URL.
    *   `code_challenge`: The hashed verifier.
    *   `scope`: Typically `cors_api`.
3.  **User Consent**: The user logs into Looker and approves the application's request for access.
4.  **Authorization Code**: Looker redirects back to the `redirect_uri` with an `authorization_code`.
5.  **Token Exchange**: The app sends the `authorization_code` and the original `code_verifier` to Looker's `/api/token` endpoint.
6.  **Direct API Access**: Looker validates the verifier and issues an `access_token`. The app uses this token in the `Authorization: Bearer` header for all subsequent API calls.

## 3. Implementation Requirements

### Looker Configuration (Critical)
-   **OAuth Application Registration**: The application must be registered in Looker (via API or Admin UI) to obtain a `client_id`.
-   **Redirect URI**: The `redirect_uri` used in the flow **must exactly match** one of the URIs registered in the Looker OAuth application settings.
-   **Embedded Domain Allowlist**: The origin of the application **must** be added to the **Embedded Domain Allowlist** (Admin > Embed) to allow CORS headers.

### Security Requirements
-   **HTTPS**: The application **must** be served over HTTPS. Looker will reject OAuth requests from non-secure origins (except `localhost` in some development contexts).
-   **PKCE Implementation**: Use a robust library or the Looker SDK to handle the `code_verifier` and `code_challenge` logic to avoid implementation errors.

## 4. Why Use This Pattern?

-   **Zero Backend**: No server-side code is needed to handle authentication or proxy requests.
-   **User-Centric Security**: The user authenticates directly with Looker; the application never sees the user's credentials.
-   **Full API Access**: The application acts on behalf of the logged-in user, inheriting their specific Looker permissions and data access.

## 5. Troubleshooting Common Pitfalls

-   **Invalid Client ID**: Ensure the `client_id` is correct and the application is properly registered in the specific Looker instance.
-   **Redirect URI Mismatch**: The most common error. Check for trailing slashes, protocol (http vs https), and exact path matching.
-   **Browser Crypto API**: PKCE relies on `window.crypto`. If the app is not on a "secure context" (HTTPS), these APIs may be unavailable.
-   **CORS Preflight (OPTIONS)**: Ensure the application origin is in the Looker **Embedded Domain Allowlist**.
