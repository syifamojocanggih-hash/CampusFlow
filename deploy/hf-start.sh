#!/usr/bin/env bash
set -euo pipefail

export OLLAMA_HOST="${OLLAMA_HOST:-127.0.0.1:11434}"
export OLLAMA_MODELS="${OLLAMA_MODELS:-/app/.ollama/models}"
MODEL_NAME="${OLLAMA_MODEL:-campusflow-coach}"
TMP_GGUF="/tmp/campusflow-model.gguf"
TMP_MODELFILE="/tmp/Modelfile.hf"

mkdir -p "$OLLAMA_MODELS"

echo "[CampusFlow Start] Menjalankan daemon Ollama di ${OLLAMA_HOST}..."
ollama serve > /tmp/ollama.log 2>&1 &

echo "[CampusFlow Start] Menunggu Ollama siap..."
for i in $(seq 1 30); do
  if curl -sf "http://${OLLAMA_HOST}/api/tags" > /dev/null 2>&1; then
    echo "[CampusFlow Start] Ollama siap."
    break
  fi
  sleep 1
done

if ! ollama list 2>/dev/null | grep -q "^${MODEL_NAME}"; then
  LOCAL_GGUF="/app/backend/ollama/gemma-3-4b-it.Q4_K_M.gguf"
  if [ -f "$LOCAL_GGUF" ]; then
    echo "[CampusFlow Start] Membuat model '${MODEL_NAME}' dari GGUF lokal..."
    ollama create "$MODEL_NAME" -f /app/backend/ollama/Modelfile
  elif [ -n "${MODEL_GGUF_URL:-}" ]; then
    echo "[CampusFlow Start] Mengunduh GGUF dari MODEL_GGUF_URL..."
    CURL_ARGS=(-fL --retry 3 --retry-delay 5 -o "$TMP_GGUF")
    if [ -n "${HF_TOKEN:-}" ]; then
      CURL_ARGS+=(-H "Authorization: Bearer ${HF_TOKEN}")
    fi
    curl "${CURL_ARGS[@]}" "$MODEL_GGUF_URL"

    sed "s|^FROM .*|FROM ${TMP_GGUF}|" /app/backend/ollama/Modelfile > "$TMP_MODELFILE"
    echo "[CampusFlow Start] Mendaftarkan model '${MODEL_NAME}' ke Ollama..."
    ollama create "$MODEL_NAME" -f "$TMP_MODELFILE"
    rm -f "$TMP_GGUF" "$TMP_MODELFILE"
    echo "[CampusFlow Start] Model '${MODEL_NAME}' siap digunakan!"
  else
    echo "[CampusFlow Start] PERINGATAN: MODEL_GGUF_URL belum diset. AI Coach akan memakai Clinical Fallback deterministik sampai MODEL_GGUF_URL diisi."
  fi
else
  echo "[CampusFlow Start] Model '${MODEL_NAME}' sudah tersedia di cache Ollama."
fi

if [ -n "${DATABASE_URL:-}" ] && [[ "${DATABASE_URL}" != *"localhost:3306"* ]]; then
  echo "[CampusFlow Start] Menjalankan migrasi Prisma MySQL..."
  npx --prefix /app/backend prisma migrate deploy || echo "[CampusFlow Start] Peringatan: prisma migrate deploy gagal, lanjut menyalakan API..."
fi

echo "[CampusFlow Start] Menjalankan CampusFlow Backend di port ${PORT:-7860}..."
exec node /app/backend/dist/backend/src/index.js
