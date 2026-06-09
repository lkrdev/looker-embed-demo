#!/bin/bash

# Function to clean up background processes on exit
cleanup() {
    echo ""
    echo "Stopping backend and frontend servers..."
    # Kill the processes if their PIDs are set and running
    if [ -n "$BACKEND_PID" ]; then
        kill "$BACKEND_PID" 2>/dev/null
    fi
    if [ -n "$FRONTEND_PID" ]; then
        kill "$FRONTEND_PID" 2>/dev/null
    fi
    exit 0
}

# Trap SIGINT (Ctrl+C), SIGTERM, and EXIT
trap cleanup SIGINT SIGTERM EXIT

# Load environment variables from .env file if it exists
if [ -f .env ]; then
    echo "Loading environment variables from .env..."
    # Read .env file lines, ignoring comments, and export them
    export $(grep -v '^#' .env | xargs)
else
    echo "No .env file found. Reading from system environment..."
fi

# Validate required environment variables
MISSING_VARS=()
[ -z "$LOOKER_INSTANCE_URL" ] && MISSING_VARS+=("LOOKER_INSTANCE_URL")
[ -z "$LOOKER_EMBED_DOMAIN" ] && MISSING_VARS+=("LOOKER_EMBED_DOMAIN")
[ -z "$LOOKERSDK_CLIENT_ID" ] && MISSING_VARS+=("LOOKERSDK_CLIENT_ID")
[ -z "$LOOKERSDK_CLIENT_SECRET" ] && MISSING_VARS+=("LOOKERSDK_CLIENT_SECRET")
[ -z "$LOOKERSDK_BASE_URL" ] && MISSING_VARS+=("LOOKERSDK_BASE_URL")

if [ ${#MISSING_VARS[@]} -ne 0 ]; then
    echo "WARNING: The following required environment variables are not set:"
    for var in "${MISSING_VARS[@]}"; do
        echo "  - $var"
    done
    echo "Please set them in your environment or create a .env file based on .env.example."
    echo ""
fi

# Start Backend Server
echo "Starting backend server (FastAPI) on port 8000..."
cd backend
uv run uvicorn main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
cd ..

# Start Frontend Server
echo "Starting frontend server (Vite) on port 3000..."
cd frontend
pnpm dev &
FRONTEND_PID=$!
cd ..

# Wait for either process to terminate
wait -n
