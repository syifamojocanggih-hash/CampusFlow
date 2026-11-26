FROM node:22-bookworm-slim

# Install utilitas sistem + zstd (dibutuhkan installer Ollama) + OpenSSL (Prisma)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    bash \
    zstd \
    openssl \
    procps \
    && rm -rf /var/lib/apt/lists/*

# Install Ollama CLI & Server
RUN curl -fsSL https://ollama.com/install.sh | sh

WORKDIR /app

# Salin kontrak bersama & manifest backend
COPY shared ./shared
COPY backend/package*.json ./backend/
COPY backend/tsconfig.json ./backend/
COPY backend/prisma ./backend/prisma

# Install dependencies & generate Prisma Client
RUN npm --prefix backend ci && npx --prefix backend prisma generate

# Salin source backend, Modelfile Gemma 3 4B, & startup script
COPY backend/src ./backend/src
COPY backend/ollama/Modelfile ./backend/ollama/Modelfile
COPY deploy/hf-start.sh ./deploy/hf-start.sh

# Build TypeScript backend -> backend/dist/backend/src/index.js
RUN npm --prefix backend run build \
    && sed -i 's/\r$//' /app/deploy/hf-start.sh \
    && chmod +x /app/deploy/hf-start.sh \
    && mkdir -p /app/.ollama/models \
    && chmod -R 777 /app /tmp

# Konfigurasi default untuk Hugging Face Spaces (wajib port 7860)
ENV NODE_ENV=production \
    PORT=7860 \
    HOST=0.0.0.0 \
    OLLAMA_HOST=127.0.0.1:11434 \
    OLLAMA_BASE_URL=http://127.0.0.1:11434 \
    OLLAMA_MODEL=campusflow-coach \
    OLLAMA_TIMEOUT_MS=180000 \
    OLLAMA_MODELS=/app/.ollama/models \
    OLLAMA_NUM_PARALLEL=1 \
    OLLAMA_MAX_LOADED_MODELS=1

EXPOSE 7860

CMD ["/app/deploy/hf-start.sh"]
