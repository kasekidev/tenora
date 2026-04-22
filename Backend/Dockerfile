# syntax=docker/dockerfile:1.6
FROM python:3.12-slim

# --- Env de base ---
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PORT=8000

WORKDIR /app

# --- Dépendances système ---
RUN apt-get update && apt-get install -y --no-install-recommends \
        build-essential \
        libpq-dev \
        libmagic1 \
        curl \
    && rm -rf /var/lib/apt/lists/*

# --- Dépendances Python (cachées tant que requirements.txt ne change pas) ---
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# --- Code applicatif ---
COPY app ./app
COPY migrations ./migrations
COPY alembic.ini .

# --- Dossiers runtime ---
RUN mkdir -p uploads logs static

# --- User non-root ---
RUN useradd -m -u 1000 tenora && chown -R tenora:tenora /app
USER tenora

EXPOSE 8000

# --- Healthcheck local (Railway utilise le sien en plus) ---
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
    CMD curl -fsS "http://127.0.0.1:${PORT:-8000}/health" || exit 1

# --- Démarrage ---
# set -e : on stoppe net si migrations échouent (pas de boucle silencieuse)
# echos  : on voit clairement où ça meurt dans les logs Railway
# exec   : uvicorn devient PID 1, reçoit SIGTERM proprement
CMD ["sh", "-c", "set -e; echo '>>> [tenora] Running Alembic migrations...'; alembic upgrade head; echo '>>> [tenora] Migrations OK, starting uvicorn on port '${PORT:-8000}; exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} --proxy-headers --forwarded-allow-ips='*'"]
