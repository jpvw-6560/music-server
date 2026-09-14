#!/bin/bash
# Script de montage du partage NFS depuis nipogi-srv (sur jpvw-dev)
# Monte le disque Seagate au même emplacement que sur le serveur

SERVER_IP="192.168.129.50"
REMOTE_PATH="/media/jpvw/Seagate_1T"
MOUNT_POINT="/media/jpvw/Seagate_1T"
OLD_MOUNT="/mnt/music-server"

echo "🔗 Configuration du partage NFS depuis nipogi-srv..."
echo "   Serveur: $SERVER_IP"
echo "   Disque distant: $REMOTE_PATH"
echo "   Montage local: $MOUNT_POINT"
echo ""

# Démonter l'ancien emplacement si existant
if mountpoint -q "$OLD_MOUNT" 2>/dev/null; then
    echo "🔄 Démontage de l'ancien emplacement $OLD_MOUNT..."
    sudo umount "$OLD_MOUNT"
fi

# Créer le point de montage si nécessaire
if [ ! -d "$MOUNT_POINT" ]; then
    echo "📁 Création du point de montage $MOUNT_POINT"
    sudo mkdir -p "$MOUNT_POINT"
fi

# Démonter si déjà monté
if mountpoint -q "$MOUNT_POINT"; then
    echo "🔄 Démontage du partage existant..."
    sudo umount "$MOUNT_POINT"
fi

# Monter le partage NFS
echo "⬆️  Montage de $SERVER_IP:$REMOTE_PATH sur $MOUNT_POINT"
sudo mount "$SERVER_IP:$REMOTE_PATH" "$MOUNT_POINT"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Disque monté avec succès!"
    echo ""
    echo "📂 Contenu du disque:"
    ls -lh "$MOUNT_POINT" | head -n 10
    echo ""
    echo "💡 Le disque complet est accessible sur: $MOUNT_POINT"
    echo ""
    echo "📝 Pour montage automatique au démarrage, ajoutez dans /etc/fstab :"
    echo "   $SERVER_IP:$REMOTE_PATH $MOUNT_POINT nfs defaults,_netdev 0 0"
else
    echo ""
    echo "❌ Erreur lors du montage"
    exit 1
fi
