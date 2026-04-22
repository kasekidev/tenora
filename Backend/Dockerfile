# syntax=docker/dockerfile:1.6
FROM python:3.12-slim

# Configuration de l'environnement Python
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

# Installation des dépendances système
RUN apt-get update && apt-get install -y --no-install-recommends \
        build-essential \
        libpq-dev \
        libmagic1 \
        curl \
    && rm -rf /var/lib/apt/lists/*

# Installation des dépendances Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copie du code source et des fichiers nécessaires
COPY app ./app
COPY migrations ./migrations
COPY alembic.ini .
RUN mkdir -p uploads logs static

# Gestion des permissions (Sécurité)
RUN useradd -m -u 1000 tenora && chown -R tenora:tenora /app
USER tenora

# Le port est injecté dynamiquement par Railway
EXPOSE 8000

# Commande de démarrage simplifiée
CMD ["sh", "-c", "exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} --proxy-headers --forwarded-allow-ips='*'"]