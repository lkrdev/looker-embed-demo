from typing import Optional
from fastapi import Request, HTTPException
from app.models import LookerUser
from app.services.looker import LookerService

# Shared service instance
looker_service = LookerService()


def get_looker_service() -> LookerService:
    """Dependency provider for LookerService."""
    return looker_service


def get_current_looker_user(request: Request) -> Optional[LookerUser]:
    """Dependency provider returning the currently resolved LookerUser context."""
    return getattr(request.state, "looker_user", None)


def get_current_looker_user_id(request: Request) -> str:
    """Dependency provider returning the currently resolved Looker User ID, raising 404 if not found."""
    user_id = getattr(request.state, "looker_user_id", None)
    if not user_id:
        raise HTTPException(
            status_code=404,
            detail="Looker user ID not found. Please invoke /api/looker/login first.",
        )
    return user_id
