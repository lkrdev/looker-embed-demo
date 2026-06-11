# State our assumptions explicitly as required by GEMINI.md:
# 1. We use Node version matching .nvmrc (24) for the frontend build.
# 2. We use Python version matching .python-version (3.13) for the backend build and runtime.
# 3. Following astral.sh UV recommendations, we execute a multi-stage build to minimize final image size and compile bytecode.

# Declare global ARGs for base image resolution
ARG NODE_VERSION=24
ARG PYTHON_VERSION=3.13

# --- Stage 1: Frontend Builder ---
FROM node:${NODE_VERSION}-slim AS frontend-builder

ENV CI=true \
    HOST=127.0.0.1 \
    NODE_OPTIONS="--dns-result-order=ipv4first"

RUN corepack enable pnpm && \
    pnpm config set ignore-scripts true

WORKDIR /app
COPY frontend/package.json frontend/pnpm-lock.yaml ./frontend/
WORKDIR /app/frontend

RUN pnpm install

COPY frontend/ ./
RUN NODE_TLS_REJECT_UNAUTHORIZED=0 pnpm run build

# --- Stage 2: Backend Builder ---
FROM python:${PYTHON_VERSION}-alpine AS backend-builder

COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv

ENV UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    UV_INDEX_URL=https://pypi.org/simple

WORKDIR /backend

# Copy only dependency files first to maximize build cache
COPY backend/pyproject.toml backend/uv.lock ./

RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --no-dev --no-install-project

# Copy the rest of the application and sync project package
COPY backend/ ./

RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --no-dev

# --- Stage 3: Final Runtime ---
FROM python:${PYTHON_VERSION}-alpine AS runtime

ARG VERSION=local

ENV VERSION=${VERSION} \
    PYTHONPATH=/backend \
    VIRTUAL_ENV=/backend/.venv \
    PATH="/backend/.venv/bin:$PATH"

# Create a non-root user for highly secure Cloud Run execution
RUN adduser -D -u 1000 appuser

WORKDIR /

COPY --from=frontend-builder /app/frontend/dist /frontend/dist
COPY --from=backend-builder /backend/.venv /backend/.venv
COPY backend /backend

# Ensure non-root appuser owns the application directories
RUN chown -R appuser:appuser /frontend /backend

# Switch to non-root user
USER appuser

ENV PORT=8080
EXPOSE 8080

CMD ["sh", "-c", "uvicorn backend.main:app --host 0.0.0.0 --port ${PORT:-8080}"]
