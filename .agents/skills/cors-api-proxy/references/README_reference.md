# Looker CORS API Reference Application

This application demonstrates how to use the **Looker API via CORS** directly from the browser. It serves as a clean, framework-free reference for authenticating and making direct API calls to Looker without relying on browser cookies.

> [!NOTE]
> This example uses the Looker Cookieless Embedding API (`acquire_embed_cookieless_session`) purely as a mechanism to streamline user provisioning and obtain an API token on the backend. The primary focus of this reference is the frontend CORS interaction.

## Architecture

The application uses a simple decoupled architecture:

### 1. Backend (Node.js / Express)
The backend acts as a secure proxy to handle authentication with the Looker API and provision users. It keeps secrets safe on the server.

-   **Endpoints:**
    -   `POST /api/acquire-token`: Checks for user, provisions if needed via cookieless API, and returns a standard API token.

### 2. Frontend (HTML5 / Vanilla JS / CSS)
The frontend provides a UI to configure session parameters and uses the acquired `api_token` to make direct CORS requests to the Looker API.

-   **Features:**
    -   **CORS API Fetching:** Direct browser-to-Looker calls using `fetch` with the acquired token.
    -   **Config Panel:** Set User ID, Permissions, Models, and Query ID.
    -   **Dynamic Rendering:** Renders JSON data as tables/single values, and PNG images directly.
    -   **Premium UI:** Glassmorphism design system using modern CSS variables and Inter typography.

## Prerequisites

-   Looker Instance URL.
-   Looker API Client ID & Client Secret.
-   Node.js (v18+ recommended).
-   **Looker Embed Domain Allowlist:** The domain where this app is hosted (e.g., `http://localhost:3000`) must be added to your Looker instance's Embed Domain Allowlist (Admin > Embed) to allow CORS requests.

## Setup & Running

1.  **Navigate to the directory:**
    ```bash
    cd looker-cors-api-demo
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set Environment Variables:**
    Ensure the following variables are set in your environment (or create a `.env` file):
    ```env
    LOOKERSDK_BASE_URL=https://your-looker-instance.com
    LOOKERSDK_CLIENT_ID=your_client_id
    LOOKERSDK_CLIENT_SECRET=your_client_secret
    ```

4.  **Start the server:**
    ```bash
    npm start
    ```

5.  **Access the UI:**
    Open `http://localhost:3000` in your browser.

## Key Flow Demonstrated

1.  **Acquire Token:** Client sends user config to `/api/acquire-token`. Server checks for user, provisions if needed via cookieless API, and returns a standard API token.
2.  **CORS Run Query:** Client uses `api_token` to call Looker API `/api/4.0/queries/{id}/run/json` directly.
3.  **Render:** Client processes data and updates UI.
