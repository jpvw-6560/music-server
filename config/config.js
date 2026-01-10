module.exports = {
    // Serveur
    port: 3001,
    
    // Répertoires de musique à scanner
    musicPaths: [
        '/home/jpvw/Musique',
        // Ajouter d'autres chemins ici
    ],
    
    // Formats audio supportés
    supportedFormats: ['.mp3', '.flac', '.m4a', '.ogg', '.wav', '.wma', '.aac'],
    
    // Options de scan
    scanOptions: {
        recursive: true,
        followSymlinks: false,
        scanInterval: 3600000 // Rescan automatique toutes les heures (en ms)
    }
};
