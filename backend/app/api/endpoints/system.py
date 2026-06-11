from fastapi import APIRouter

router = APIRouter()


@router.get("/hello/{name}")
def hello(name: str):
    """Simple healthcheck/welcome endpoint."""
    return {"message": f"Hello, {name}!"}
