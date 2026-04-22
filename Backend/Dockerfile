# syntax=docker/dockerfile:1.6
FROM python:3.12-slim [cite: 18]

# Configuration de l'environnement Python
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app [cite: 18]

# Installation des dépendances système
RUN apt-get update && apt-get install -y --no-install-recommends \
        build-essential \
        libpq-dev \
        libmagic1 \
        curl \
    && rm -rf /var/lib/apt/lists/* [cite: 18]

# Installation des dépendances Python
COPY requirements.txt . [cite: 18]
RUN pip install --no-cache-dir -r requirements.txt [cite: 19]

# Copie du code source et des fichiers nécessaires
COPY app ./app [cite: 19]
COPY migrations ./migrations [cite: 19]
COPY alembic.ini . [cite: 19]
RUN mkdir -p uploads logs static [cite: 20]

# Gestion des permissions (Sécurité)
RUN useradd -m -u 1000 tenora && chown -R tenora:tenora /app [cite: 18]
USER tenora

# Le port est injecté dynamiquement par Railway
EXPOSE 8000 [cite: 18]

# Commande de démarrage simplifiée
# On retire Alembic car il tourne déjà en Pre-deploy
CMD ["sh", "-c", "exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} --proxy-headers --forwarded-allow-ips='*'"] [cite: 20]