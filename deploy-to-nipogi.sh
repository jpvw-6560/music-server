#!/bin/bash
# Script de déploiement vers nipogi-srv

set -e

REMOTE_HOST="192.168.129.50"
REMOTE_USER="jpvw"
REMOTE_PATH="/home/jpvw/docker-apps/music_server"

echo "🚀 Déploiement vers nipogi-srv..."

# 1. Synchroniser les fichiers
echo "📤 Synchronisation des fichiers..."
rsync -avz --exclude 'node_modules' --exclude '.git' \
    /home/jpvw/Documents/node_appli/music_server/ \
    ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PATH}/

# 2. Se connecter et reconstruire le conteneur Docker
echo "🐳 Reconstruction du conteneur Docker..."
ssh ${REMOTE_USER}@${REMOTE_HOST} << 'ENDSSH'
cd /home/jpvw/docker-apps/music_server

# Arrêter et supprimer l'ancien conteneur
echo "⏸️  Arrêt du conteneur..."
docker-compose down

# Reconstruire l'image
echo "🔨 Reconstruction de l'image..."
docker-compose build --no-cache

# Redémarrer le conteneur
echo "▶️  Démarrage du conteneur..."
docker-compose up -d

# Vérifier le statut
echo "✅ Statut du conteneur:"
docker-compose ps

ENDSSH

echo "✅ Déploiement terminé !"
echo "🌐 Accessible sur http://100.84.222.62:3011/"
