const fs = require('fs');
const path = require('path');

// Charger les chemins depuis settings.json si disponible
let customMusicPaths = ['/home/jpvw/Musique'];
try {
    const settingsPath = path.join(__dirname, 'settings.json');
    if (fs.existsSync(settingsPath)) {
        const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
        if (settings.musicPaths && Array.isArray(settings.musicPaths) && settings.musicPaths.length > 0) {
            customMusicPaths = settings.musicPaths;
        }
    }
} catch (error) {
    console.warn('⚠️  Impossible de charger settings.json, utilisation du chemin par défaut');
}

module.exports = {
    // Serveur
    port: process.env.PORT || 3001,
    
    // Répertoires de musique à scanner
    musicPaths: process.env.MUSIC_PATH ? 
        process.env.MUSIC_PATH.split(',') : 
        customMusicPaths,
    
    // Formats audio supportés
    supportedFormats: ['.mp3', '.flac', '.m4a', '.ogg', '.wav', '.wma', '.aac'],
    
    // Options de scan
    scanOptions: {
        recursive: true,
        followSymlinks: false,
        scanInterval: 3600000 // Rescan automatique toutes les heures (en ms)
    }
};
