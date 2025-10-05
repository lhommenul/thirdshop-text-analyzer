#!/bin/bash

# Script de démarrage de la stack d'observabilité ThirdShop

set -e

echo "🚀 Démarrage de la stack d'observabilité ThirdShop..."
echo ""

# Vérifier que Docker est installé
if ! command -v docker &> /dev/null; then
    echo "❌ Docker n'est pas installé. Veuillez installer Docker d'abord."
    exit 1
fi

# Vérifier que Docker Compose est installé
if ! command -v docker compose &> /dev/null; then
    echo "❌ Docker Compose n'est pas installé. Veuillez installer Docker Compose d'abord."
    exit 1
fi

# Vérifier que le port 3000 est libre
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "⚠️  Attention : Le port 3000 est déjà utilisé."
    echo "   Grafana ne pourra pas démarrer correctement."
    read -p "Voulez-vous continuer ? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Créer le dossier logs si nécessaire
mkdir -p logs

# Démarrer la stack
echo "📦 Lancement des conteneurs Docker..."
docker compose up -d

echo ""
echo "⏳ Attente du démarrage des services..."
sleep 5

# Vérifier l'état des services
echo ""
echo "🔍 Vérification de l'état des services..."
echo ""

check_service() {
    local service=$1
    local url=$2
    local name=$3
    
    if curl -s -o /dev/null -w "%{http_code}" "$url" | grep -qE "200|302"; then
        echo "✅ $name est opérationnel : $url"
    else
        echo "⚠️  $name est en cours de démarrage... : $url"
    fi
}

check_service "grafana" "http://localhost:3000" "Grafana"
check_service "prometheus" "http://localhost:9090" "Prometheus"
check_service "loki" "http://localhost:3100/ready" "Loki"
check_service "tempo" "http://localhost:3200/ready" "Tempo"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✨ Stack d'observabilité démarrée avec succès !"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 Accès aux services :"
echo "   • Grafana     : http://localhost:3000"
echo "   • Prometheus  : http://localhost:9090"
echo "   • Tempo       : http://localhost:3200"
echo "   • Loki        : http://localhost:3100"
echo ""
echo "📖 Documentation complète : ./README.md"
echo ""
echo "🛠️  Commandes utiles :"
echo "   • Voir les logs       : docker compose logs -f"
echo "   • Arrêter la stack    : docker compose down"
echo "   • Redémarrer          : docker compose restart"
echo ""
