---
name: cors-api-proxy
description: Architectural pattern for performing direct browser-to-Looker API calls via CORS by using an application backend to delegate scoped authentication tokens.
---

# Looker CORS API Proxy Pattern (General)

This skill describes the **Scoped API Token Proxy** pattern. This architectural pattern allows frontend applications to make direct, performant API calls to Looker from the browser while maintaining strict security by delegating authentication to a secure backend.

## 1. The Core Pattern

The pattern solves the "Browser Secret Problem": Browsers cannot safely hold API Client Secrets, but direct API access (CORS) requires an authentication token.

### Architectural Components

1.  **Application Frontend**: The client-side UI that requires data. It makes direct `fetch` or `XHR` calls to Looker's API endpoints.
2.  **Application Backend (The Proxy/Signer)**: A secure server-side component that holds Looker Admin credentials. It does not proxy data; it only proxies **Identity and Authentication**.
3.  **Looker API**: The source of data, configured to trust the Frontend's origin via CORS.

## 2. The Authentication Delegation Flow

Instead of the backend fetching data and passing it back, the backend provides the frontend with the "keys" to fetch the data itself.

1.  **Identity Verification**: The Frontend authenticates with the Application Backend using the app's standard auth mechanism (JWT, Session Cookie, etc.).
2.  **Token Exchange**: The Backend uses its Admin credentials to request a **user-scoped access token** from Looker.
    - **User Mapping**: The backend maps the application user to a Looker identity (creating or updating the user if necessary).
    - **Permission Scoping**: The backend ensures the requested token only has the specific permissions and model access required for that user's role.
3.  **Token Delivery**: The Backend sends the Looker `access_token` back to the Frontend.
4.  **Direct API Access**: The Frontend uses the `access_token` in an `Authorization: Bearer <token>` header to call Looker APIs directly.

## 3. Implementation Requirements

### Security & Looker Configuration

- **Embed Domain Allowlist**: Looker will reject any browser-side request unless the Frontend's origin (protocol, domain, and port) is explicitly added to the **Embedded Domain Allowlist** in **Admin > Embed**.
- **HTTPS**: Both the application and the Looker instance must use HTTPS to satisfy modern browser security policies for CORS and sensitive headers.

### Backend Responsibilities

- **Secret Management**: Admin Client IDs and Secrets must never leave the backend environment.
- **Session Lifecycle**: The backend should handle token expiration. When a token expires, the frontend should be able to request a fresh one from the backend.
- **Provisioning Strategy**: Use Looker's User API or Cookieless Embedding API to ensure the user exists and is correctly configured with `external_user_id` before attempting a login.

### Frontend Responsibilities

- **Token Storage**: Store the acquired token securely in memory (not in persistent storage if possible) and include it in all Looker API headers.
- **Handling 401s**: Implement logic to detect expired tokens and trigger the "Token Exchange" flow automatically.

## 4. Why Use This Pattern?

- **Performance**: Large payloads (JSON, CSV, Images) bypass the application server entirely, reducing latency and backend CPU/Memory usage.
- **Scale**: Looker handles the data delivery load; your backend only handles small authentication payloads.
- **Native Experience**: Developers can use standard Looker API documentation and SDKs directly in the browser without building a parallel API on their own server.

## 5. Troubleshooting Common Pitfalls

- **Preflight (OPTIONS) Failures**: Usually caused by the origin missing from the Embed Domain Allowlist or the Looker instance having restrictive CSP headers.
- **Token Scope Creep**: Ensure the backend isn't granting more permissions than the user needs; the token should be "least privilege."
- **Cookie Interference**: Ensure the frontend is making "credentialless" requests or that the Looker instance is not relying on legacy cookie-based authentication for these API calls.
