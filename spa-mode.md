# SPA Mode Deployment and Hosting Configuration

To deploy the frontend in **SPA (Single-Page Application)** mode, SSR is turned off, and the application is built as a set of static assets with a main entry shell (`dist/client/_shell.html`).

---

## 1. Enabling SPA Mode
In `frontend/vite.config.ts`, configure the TanStack Start plugin options:

```typescript
import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'

export default defineConfig({
  plugins: [
    tanstackStart({
      spa: {
        enabled: true,
      },
    }),
  ],
})
```

---

## 2. Server/Host Rewrites & Routing Rules
Because routes (e.g. `/dashboard`, `/explore`) are handled on the client side, requesting a sub-path directly will return a `404` unless the hosting provider or server rewrites it back to the SPA shell.

When deploying to **Cloud Run**, a CDN, or a static file server:

### Priority 1: Serve Static Assets
Allow the server to serve assets located in the `assets/` and `public/` directories if they exist (e.g. `*.js`, `*.css`, `*.svg`).

### Priority 2: Backend API Proxy/Allow-list
Route traffic targeting the FastAPI backend (`/api/*`) directly to the backend service. Do **not** rewrite API endpoints to the SPA shell.

### Priority 3: Catch-All Rewrite to `_shell.html`
Any request that is not a static asset and does not match the `/api/*` prefix must be rewritten (redirected internally with a `200 OK` status) to `_shell.html` to boot the client application.

---

## 3. Reference Configurations

### Cloud Run Behind a Load Balancer / Nginx Routing Sidecar
If you run an Nginx container or proxy routing in front of your services, use the following routing rules:

```nginx
server {
    listen 80;

    # Static assets are served directly
    location /assets/ {
        root /usr/share/nginx/html;
        try_files $uri =404;
    }

    # Proxy API requests to backend service
    location /api/ {
        proxy_pass http://backend-service:8009;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Catch-all: Rewrite all route requests to SPA shell
    location / {
        root /usr/share/nginx/html;
        try_files $uri /_shell.html;
    }
}
```

### Firebase Hosting (`firebase.json`)
If you deploy to Firebase Hosting:

```json
{
  "hosting": {
    "public": "dist/client",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "/api/**",
        "function": "api" 
      },
      {
        "source": "**",
        "destination": "/_shell.html"
      }
    ]
  }
}
```

---

## 4. Environment Variables in Practice (Docker & Cloud Run)
Because there is no active server-side Node process rendering the HTML dynamically at request time, standard container environment variables (e.g. `gcloud run deploy --set-env-vars`) **cannot be read directly by client-side browser JavaScript** out of the box.

There are three common patterns to handle this in a Dockerized deployment:

---

### Option A: Build-Time Injection (Simple, separate image per env)
You compile the environment variables directly into the static JS files during the Docker build stage using Docker `--build-arg`s.

#### Example `Dockerfile` (Static Nginx Server)
```dockerfile
# Stage 1: Build static assets
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install
COPY . .

# Declare build arguments
ARG VITE_API_BASE_URL
ARG VITE_LOOKER_INSTANCE_URL
ARG VITE_CHAT_AGENT_ID

# Set as environment variables for Vite compiler
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_LOOKER_INSTANCE_URL=$VITE_LOOKER_INSTANCE_URL
ENV VITE_CHAT_AGENT_ID=$VITE_CHAT_AGENT_ID

RUN pnpm build

# Stage 2: Serve with Nginx
FROM nginx:alpine
COPY --from=builder /app/dist/client /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
```

#### Build Command
```bash
docker build \
  --build-arg VITE_API_BASE_URL="https://api.my-app.com" \
  --build-arg VITE_LOOKER_INSTANCE_URL="https://looker.my-domain.com" \
  -t gcr.io/my-project/my-frontend:latest .
```

---

### Option B: Startup Injection Script (Build once, run anywhere)
You build the Docker image once with placeholders (e.g. `__PLACEHOLDER_API_BASE_URL__`). When Cloud Run starts the container, an entrypoint shell script replaces those placeholders with the actual runtime environment variables before launching Nginx.

#### Example `Dockerfile`
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install
COPY . .
# Build using placeholder values
ENV VITE_API_BASE_URL=__PLACEHOLDER_API_BASE_URL__
ENV VITE_LOOKER_INSTANCE_URL=__PLACEHOLDER_LOOKER_INSTANCE_URL__
RUN pnpm build

FROM nginx:alpine
COPY --from=builder /app/dist/client /usr/share/nginx/html

# Create entrypoint startup script
RUN echo '#!/bin/sh' > /entrypoint.sh && \
    echo 'find /usr/share/nginx/html/assets/ -type f -exec sed -i "s|__PLACEHOLDER_API_BASE_URL__|$VITE_API_BASE_URL|g" {} +' >> /entrypoint.sh && \
    echo 'find /usr/share/nginx/html/assets/ -type f -exec sed -i "s|__PLACEHOLDER_LOOKER_INSTANCE_URL__|$VITE_LOOKER_INSTANCE_URL|g" {} +' >> /entrypoint.sh && \
    echo 'exec nginx -g "daemon off;"' >> /entrypoint.sh && \
    chmod +x /entrypoint.sh

EXPOSE 8080
ENTRYPOINT ["/entrypoint.sh"]
```

#### Cloud Run Deploy Command (Runtime override works!)
```bash
gcloud run deploy my-frontend \
  --image gcr.io/my-project/my-frontend:latest \
  --set-env-vars VITE_API_BASE_URL="https://api.prod.com",VITE_LOOKER_INSTANCE_URL="https://looker.prod.com"
```

---

### Option C: Backend API Configuration Endpoint (Most Elegant)
Instead of embedding environment variables in the frontend build, you create an endpoint in your FastAPI backend (e.g. `/api/config`) that returns these configurations. When the React app boots up, it fetches `/api/config` first before loading the Looker components.

#### Frontend Code (`src/config/constants.ts` / `PortalContext.tsx`)
```typescript
// Fetch config dynamically from backend instead of import.meta.env
const fetchConfig = async () => {
  const res = await fetch('/api/config')
  const config = await res.json()
  return config // { LOOKER_INSTANCE_URL: '...', CHAT_AGENT_ID: '...' }
}
```
*Note: This eliminates all build-time environment variable concerns from the frontend container.*
