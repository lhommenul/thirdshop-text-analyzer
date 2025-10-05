#!/bin/bash
# Script de démarrage de l'API ThirdShop Text Analyzer

set -e

echo "🚀 Starting ThirdShop Text Analyzer API..."

# Créer le dossier de logs s'il n'existe pas
mkdir -p ./observability/logs

# Variables d'environnement par défaut
export PORT=${PORT:-8080}
export HOST=${HOST:-0.0.0.0}
export ENABLE_TRACING=${ENABLE_TRACING:-false}

# Démarrer l'API
echo "📍 Starting API on http://${HOST}:${PORT}"
echo "📊 Metrics: http://${HOST}:${PORT}/metrics"
echo "💚 Health: http://${HOST}:${PORT}/health"
echo "📝 Analyze: http://${HOST}:${PORT}/analyze"
echo ""

deno run -A src/api/server.ts
