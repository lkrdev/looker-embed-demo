import logging
import uvicorn
from fastapi import FastAPI
from app.core.config import settings
from app.api.api import api_router
from app.middleware import ensure_external_user_id_middleware
from app.services.assets import register_assets_handlers

# Setup logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Validate environment variables eagerly upon startup
settings.validate()

app = FastAPI(
    title="Looker Embed Demo Backend",
    docs_url="/api/docs",
    openapi_url="/api/openapi.json",
    redoc_url="/api/redoc",
)

# Register middleware
app.middleware("http")(ensure_external_user_id_middleware)

# Include router
app.include_router(api_router, prefix="/api")

# Serve static files and frontend bundle
register_assets_handlers(app)

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8009, reload=True)
