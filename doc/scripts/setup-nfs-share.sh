#!/bin/bash
# Script de configuration du partage NFS pour le disque Seagate

echo "🔧 Configuration du partage NFS"
echo ""

# Demander l'IP du pc-dev
read -p "Entrez l'IP de jpvw-dev (ou appuyez sur Entrée pour utiliser le réseau local 192.168.1.0/24): " PC_DEV_IP

if [ -z "$PC_DEV_IP" ]; then
    NFS_CLIENT="192.168.1.0/24"
    echo "→ Utilisation du réseau: $NFS_CLIENT"
else
    NFS_CLIENT="$PC_DEV_IP"
    echo "→ Configuration pour: $NFS_CLIENT"
fi

SHARE_PATH="/media/jpvw/Seagate_1T"
NFS_OPTIONS="rw,sync,no_subtree_check,no_root_squash"

echo ""
echo "📁 Chemin partagé: $SHARE_PATH"
echo "🔑 Options: $NFS_OPTIONS"
echo ""

# Vérifier que le chemin existe
if [ ! -d "$SHARE_PATH" ]; then
    echo "❌ Erreur: Le chemin $SHARE_PATH n'existe pas!"
    echo "   Vérifiez que le disque est bien branché et monté."
    exit 1
fi

# Vérifier si NFS est installé
if ! command -v exportfs &> /dev/null; then
    echo "📦 Installation de nfs-kernel-server..."
    sudo apt update
    sudo apt install -y nfs-kernel-server
fi

# Créer une sauvegarde de /etc/exports
sudo cp /etc/exports /etc/exports.backup.$(date +%Y%m%d_%H%M%S)
echo "💾 Sauvegarde créée: /etc/exports.backup"

# Ajouter la ligne dans /etc/exports si elle n'existe pas déjà
EXPORT_LINE="$SHARE_PATH $NFS_CLIENT($NFS_OPTIONS)"

if sudo grep -q "$SHARE_PATH" /etc/exports; then
    echo "⚠️  Une entrée existe déjà pour $SHARE_PATH"
    echo "   Vérifiez /etc/exports manuellement"
else
    echo "$EXPORT_LINE" | sudo tee -a /etc/exports > /dev/null
    echo "✅ Configuration ajoutée à /etc/exports"
fi

# Appliquer la configuration
echo ""
echo "🔄 Application de la configuration NFS..."
sudo exportfs -ra
sudo systemctl enable nfs-kernel-server
sudo systemctl restart nfs-kernel-server

# Vérifier le statut
echo ""
echo "📊 Statut du service NFS:"
sudo systemctl status nfs-kernel-server --no-pager -l | head -n 5

echo ""
echo "📋 Partages NFS actifs:"
sudo exportfs -v

echo ""
echo "✅ Configuration terminée!"
echo ""
echo "📝 Sur jpvw-dev, exécutez:"
echo "   sudo apt install nfs-common"
echo "   sudo mkdir -p /mnt/music-server"
echo "   sudo mount $(hostname -I | awk '{print $1}'):$SHARE_PATH /mnt/music-server"
echo ""
echo "💡 Pour montage automatique, ajoutez dans /etc/fstab de jpvw-dev:"
echo "   $(hostname -I | awk '{print $1}'):$SHARE_PATH /mnt/music-server nfs defaults,_netdev 0 0"
