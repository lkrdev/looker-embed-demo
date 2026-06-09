from fastapi import FastAPI, HTTPException, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, List, Any
import looker_sdk

from config import SIMPLE_USER, ADVANCED_USER, TARGET_URL, LOOKER_INSTANCE_URL

app = FastAPI(
    title="Looker Embed Demo",
    description="A FastAPI backend to generate Looker SSO Embed URLs with Simple or Advanced permissions using static configurations.",
    version="1.1.0"
)

# Configure CORS so the frontend can interact with these endpoints.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For production, restrict this to the frontend origin (e.g., http://localhost:3000)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

