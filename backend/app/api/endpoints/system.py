from app.services.version import get_version
from fastapi import APIRouter

router = APIRouter()


@router.get("/version")
def version():
    """Unauthenticated endpoint returning the active application release version."""
    return {"version": get_version()}
