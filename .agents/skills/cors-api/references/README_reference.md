# Looker CORS OAuth Simple React App

This project is a simple React application demonstrating how to authenticate against the Looker API using the [CORS OAuth flow](https://cloud.google.com/looker/docs/api-cors). It uses the Looker TypeScript SDK to handle the authentication process entirely on the client-side, without needing a backend server to proxy requests.

## Getting Started

Follow these steps to get the application running locally against your Looker instance.

### Prerequisites

*   Node.js and npm
*   A Looker instance

### 1. Clone and Install Dependencies

First, clone the repository and install the necessary npm packages.

```bash
git clone <repository-url>
cd looker-oauth-simple
npm install
```

### 2. Configure the Looker OAuth Application

Before you can authenticate, you must register this application with your Looker instance.

1.  **Register the App**: Follow the documentation to register an OAuth client application. You can use the Looker API Explorer for this.
    *   `client_guid`: You can use `looker-oauth-app` or any other unique string. This will be your `REACT_APP_LOOKER_CLIENT_ID`.
    *   `display_name`: A user-friendly name, e.g., "React CORS Demo".
    *   `description`: A brief description for the user consent screen.
2.  **Set the Redirect URI**: Set the `redirect_uri`. For this local development setup, it **must** be:
    ```
    https://localhost:3000/callback
    ```
    *Note: The OAuth flow requires HTTPS, so `http://` will not work.*
3.  **Enable CORS**: Ensure your React application's origin (`https://localhost:3000`) is added to your Looker instance's Embedded Domain Allowlist.

### 3. Configure Environment Variables

This project uses environment variables to store your Looker instance details.

1.  Copy the example environment file:
    ```bash
    cp .env.example .env
    ```
2.  Open the newly created `.env` file and fill in the values:
    *   `REACT_APP_LOOKER_BASE_URL`: The base URL of your Looker instance (e.g., `https://mycompany.looker.com`).
    *   `REACT_APP_LOOKER_API_URL`: The API URL of your Looker instance (e.g., `https://mycompany.looker.com:19999` or `https://mycompany.looker.com:443`).
    *   `REACT_APP_LOOKER_CLIENT_ID`: The `client_guid` you used when registering the OAuth application in the previous step.

### 4. Run the Application

Run the application in development mode. The `HTTPS=true` flag is required for the browser's cryptography APIs to function correctly.

```bash
HTTPS=true npm start
```

Your browser should open to `https://localhost:3000`. You can now test the login flow.

