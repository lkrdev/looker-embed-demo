import pathlib

from app.core.config import settings
from app.services.vite_env import generate_env_js_content, update_env_js_on_startup
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import FileResponse, HTMLResponse, Response
from fastapi.staticfiles import StaticFiles


def register_assets_handlers(app: FastAPI):
    update_env_js_on_startup(settings.DIST_DIR)

    build_dir = pathlib.Path(settings.DIST_DIR).resolve()

    if (build_dir / "assets").exists():
        app.mount("/assets", StaticFiles(directory=build_dir / "assets"))

    @app.get("/env.js", include_in_schema=False)
    async def serve_env_js():
        content = generate_env_js_content()
        return Response(content, media_type="application/javascript")

    @app.get("/{path:path}", include_in_schema=False)
    async def handle_catch_all(request: Request, path: str):
        if path.startswith("api"):
            raise HTTPException(status_code=404, detail="API route not found")

        if path and path != "/":
            disk_path = build_dir / path
            if disk_path.exists():
                if disk_path.is_file():
                    return FileResponse(disk_path)
                elif (disk_path / "index.html").exists():
                    return HTMLResponse((disk_path / "index.html").read_bytes())

        index_html = build_dir / "index.html"
        if index_html.exists():
            return HTMLResponse(index_html.read_bytes())
        raise HTTPException(status_code=404, detail="Frontend index.html not found.")
