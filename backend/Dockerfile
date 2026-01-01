# syntax=docker/dockerfile:1
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# System deps (kept minimal). Add build tools only if you have packages that need compilation.
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install Python deps first (better layer caching)
COPY requirements.txt .
RUN pip install --upgrade pip && pip install -r requirements.txt

# Copy app code
COPY . .

# Fly will route traffic to this port (commonly 8080)
EXPOSE 8080

# Adjust "app.main:app" to your actual import path
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080"]
