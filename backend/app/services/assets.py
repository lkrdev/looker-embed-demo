import pathlib

from app.core.config import settings
from app.services.vite_env import generate_env_js_content
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import FileResponse, HTMLResponse, Response
from fastapi.staticfiles import StaticFiles


class CacheControlledStaticFiles(StaticFiles):
    def is_cache_control_enabled(self) -> bool:
        return True

    def file_response(self, *args, **kwargs) -> Response:
        resp = super().file_response(*args, **kwargs)
        resp.headers["Cache-Control"] = "public, max-age=31536000, immutable"
        return resp


def register_assets_handlers(app: FastAPI):

    build_dir = pathlib.Path(settings.DIST_DIR).resolve()

    if (build_dir / "assets").exists():
        app.mount(
            "/assets",
            CacheControlledStaticFiles(directory=build_dir / "assets"),
        )

    @app.get("/env.js", include_in_schema=False)
    async def serve_env_js():
        content = generate_env_js_content()
        return Response(
            content,
            media_type="application/javascript",
            headers={"Cache-Control": "no-cache"},
        )

    @app.get("/{path:path}", include_in_schema=False)
    async def handle_catch_all(request: Request, path: str):
        if path.startswith("api"):
            raise HTTPException(status_code=404, detail="API route not found")

        if path and path != "/":
            for base_dir in (build_dir, build_dir.parent / "public"):
                disk_path = base_dir / path
                if disk_path.exists():
                    if disk_path.is_file():
                        return FileResponse(disk_path)
                    elif (disk_path / "index.html").exists():
                        return HTMLResponse(
                            (disk_path / "index.html").read_bytes(),
                            headers={"Cache-Control": "no-cache"},
                        )

        for index_html in (build_dir / "index.html", build_dir.parent / "index.html"):
            if index_html.exists():
                return HTMLResponse(
                    index_html.read_bytes(),
                    headers={"Cache-Control": "no-cache"},
                )
        raise HTTPException(status_code=404, detail="Frontend index.html not found.")
