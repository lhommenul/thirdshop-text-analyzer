#!/bin/bash

# Script d'arrêt de la stack d'observabilité ThirdShop

set -e

echo "🛑 Arrêt de la stack d'observabilité ThirdShop..."
echo ""

# Arrêter les conteneurs
docker compose down

echo ""
echo "✅ Stack arrêtée avec succès !"
echo ""
echo "💡 Pour supprimer également les données :"
echo "   docker compose down -v"
echo ""
