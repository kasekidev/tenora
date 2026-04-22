"""Configuration pytest commune.

Définit les variables d'environnement minimales avant l'import de l'app
pour que `Settings` puisse être instancié sans .env complet.
"""
import os
import pytest

os.environ.setdefault("DEBUG", "true")
os.environ.setdefault("ENVIRONMENT", "test")
os.environ.setdefault("SECRET_KEY", "test_secret_key_for_ci_only_32_chars_min")
os.environ.setdefault("DATABASE_URL", "sqlite:///./test.db")
os.environ.setdefault("ALLOWED_ORIGINS", '["http://localhost"]')

from fastapi.testclient import TestClient  # noqa: E402
from app.main import app  # noqa: E402


@pytest.fixture(scope="session")
def client():
    with TestClient(app) as c:
        yield c
