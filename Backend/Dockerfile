# syntax=docker/dockerfile:1.6
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PORT=8000

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
        build-essential \
        libpq-dev \
        libmagic1 \
        curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app
COPY migrations ./migrations
COPY alembic.ini .

RUN mkdir -p uploads logs static

RUN useradd -m -u 1000 tenora && chown -R tenora:tenora /app
USER tenora

EXPOSE 8000

# PAS de HEALTHCHECK Docker — Railway gère le sien, on évite tout conflit de CMD
# Démarrage app
CMD ["sh", "-c", "set -e; echo '>>> [tenora] Running Alembic migrations...'; alembic upgrade head; echo '>>> [tenora] Migrations OK, starting uvicorn on port '${PORT:-8000}; exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} --proxy-headers --forwarded-allow-ips='*'"]
