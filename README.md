# Looker Embed Demo Portal

A full-stack application demonstrating how to embed Looker content (Dashboards, Explores, and Gemini-powered Conversational Analytics/Chat Assistants) securely within a custom portal using FastAPI and React.

---

## 📂 Repository Structure

The project is split into two main directories:

*   **[`/backend`](file:///usr/local/google/home/maluka/looker-embed-demo/backend)**: Python-based FastAPI backend that handles Looker API authentication, signed SSO embed URL generation, Looker session generation, and proxying Looker API calls.
*   **[`/frontend`](file:///usr/local/google/home/maluka/looker-embed-demo/frontend)**: A modern React single-page application (SPA) built with Vite, TanStack Router (for type-safe file-based routing), and vanilla CSS styling. It integrates the `@looker/embed-sdk` to interact with embedded Looker iframes.

---

## 🛠️ Prerequisites

Before you get started, make sure you have the following installed:

*   **Node.js** & **pnpm** (preferred frontend package manager)
*   **Python (>= 3.13)** & **uv** (fast Python package installer/manager)

---

## ⚙️ Configuration & Environment Variables

Authentication settings, target Looker instances, and default dashboard options are configured via environment variables.

1.  Copy the example environment configuration file to a new `.env` file in the root directory:
    ```bash
    cp .env.example .env
    ```

2.  Open `.env` and fill in the Looker details:
    *   `LOOKER_INSTANCE_URL`: The URL of your Looker instance (e.g., `https://yourcompany.looker.com`).
    *   `LOOKER_EMBED_DOMAIN`: The domain hosting the portal (typically `http://localhost:3000` for local dev).
    *   `LOOKERSDK_BASE_URL`: The API URL of your Looker instance (e.g., `https://yourcompany.looker.com:19999` or matching `LOOKER_INSTANCE_URL`).
    *   `LOOKERSDK_CLIENT_ID` / `LOOKERSDK_CLIENT_SECRET`: Looker API credentials (API 3.1 key).
    *   *(Optional)* `VITE_DASHBOARD_ID`, `VITE_THEME`, and `VITE_EXPLORE_PATH` to customize which content is embedded by default.

---

## 🚀 Getting Started (Local Development)

### The Fast Way (Unified Startup)

A convenience script `start.sh` is provided in the parent directory to check environment variables and launch both the frontend and backend servers concurrently.

1.  Make the script executable:
    ```bash
    chmod +x start.sh
    ```
2.  Start the application:
    ```bash
    ./start.sh
    ```

This starts:
*   The **FastAPI backend** on **[http://localhost:8000](http://localhost:8000)**
*   The **React/Vite frontend** on **[http://localhost:3000](http://localhost:3000)**

---

### Manual Startup (Optional)

If you prefer to run or debug the frontend and backend processes in separate terminals:

#### 1. Backend Setup (`/backend`)
```bash
cd backend
# Sync and install Python dependencies
uv sync
# Run the FastAPI server via uvicorn
uv run uvicorn main:app --host 0.0.0.0 --port 8000
```

#### 2. Frontend Setup (`/frontend`)
```bash
cd frontend
# Install Node dependencies
pnpm install
# Start the Vite dev server
pnpm dev
```
Once both are running, navigate to **[http://localhost:3000](http://localhost:3000)** to interact with the demo.
