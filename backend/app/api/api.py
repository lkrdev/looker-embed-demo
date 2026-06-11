from fastapi import APIRouter
from app.api.endpoints import auth, system

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/looker", tags=["looker-auth"])
api_router.include_router(system.router, tags=["system"])
