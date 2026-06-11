from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_docs_endpoint():
    response = client.get("/api/docs")
    assert response.status_code == 200


def test_robots_txt_endpoint():
    response = client.get("/robots.txt")
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/plain")
    assert response.text == "User-agent: *\nDisallow: /\n"


def test_env_js_endpoint():
    response = client.get("/env.js")
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("application/javascript")
    assert "window.vite =" in response.text
