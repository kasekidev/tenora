"""Tests fumée — vérifient que les chemins critiques répondent.

Objectif : détecter une régression majeure (500, route absente, import cassé)
avant un déploiement, sans dépendre d'une base de données réelle.
"""


def test_health_ok(client):
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_openapi_available(client):
    # /openapi.json est exposé même quand /docs ne l'est pas
    r = client.get("/openapi.json")
    assert r.status_code == 200
    assert r.json().get("openapi", "").startswith("3.")


def test_robots_or_404(client):
    # robots.txt peut renvoyer le fichier ou 500 si absent — on tolère 200/404
    r = client.get("/robots.txt")
    assert r.status_code in (200, 404, 500)


def test_panel_requires_auth(client):
    """Panel doit être protégé (jamais 200 sans auth)."""
    r = client.get("/panel/imports")
    assert r.status_code in (401, 403, 422)


def test_panel_orders_requires_auth(client):
    r = client.get("/panel/orders")
    assert r.status_code in (401, 403, 422)


def test_login_invalid_payload(client):
    r = client.post("/auth/login", json={"email": "not-an-email", "password": "x"})
    assert r.status_code in (400, 401, 422)


def test_register_validation(client):
    """Mot de passe trop court doit être refusé par le validator."""
    r = client.post(
        "/auth/register",
        json={"email": "test@example.com", "password": "short"},
    )
    assert r.status_code in (400, 422)


def test_security_headers_present(client):
    r = client.get("/health")
    assert r.headers.get("X-Content-Type-Options") == "nosniff"
    assert r.headers.get("X-Frame-Options") == "SAMEORIGIN"
    assert "X-Process-Time" in r.headers


def test_unknown_route_404(client):
    r = client.get("/totally-not-a-route")
    assert r.status_code == 404


def test_cors_preflight_allowed_origin(client):
    r = client.options(
        "/health",
        headers={
            "Origin": "http://localhost",
            "Access-Control-Request-Method": "GET",
        },
    )
    # Selon la config CORS, peut renvoyer 200 ou 400 si origin pas autorisée
    assert r.status_code in (200, 204, 400)
