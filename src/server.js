const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDatabase } = require('../config/database');
const config = require('../config/config');

// Import des routes
const artistsRoutes = require('./routes/artists');
const albumsRoutes = require('./routes/albums');
const tracksRoutes = require('./routes/tracks');
const playlistsRoutes = require('./routes/playlists');
const searchRoutes = require('./routes/search');
const scanRoutes = require('./routes/scan');
const settingsRoutes = require('./routes/settings');
const StreamController = require('../controllers/StreamController');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Désactiver le cache pour les fichiers statiques
app.use(express.static(path.join(__dirname, '../public'), {
    etag: false,
    maxAge: 0,
    setHeaders: (res) => {
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
        res.set('Pragma', 'no-cache');
        res.set('Expires', '0');
    }
}));

// Routes API
app.use('/api/artists', artistsRoutes);
app.use('/api/albums', albumsRoutes);
app.use('/api/tracks', tracksRoutes);
app.use('/api/playlists', playlistsRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/scan', scanRoutes);
app.use('/api/settings', settingsRoutes);

// Route pour le streaming audio
app.get('/stream/:trackId', StreamController.stream);

// Démarrage du serveur
async function startServer() {
    try {
        await initDatabase();
        console.log('✅ Base de données prête');
        
        app.listen(config.port, '0.0.0.0', () => {
            console.log(`🎵 Music Server démarré sur http://localhost:${config.port}`);
            console.log(`📊 Interface: http://localhost:${config.port}/index.html`);
            console.log(`🌐 Accessible sur le réseau à http://[VOTRE_IP]:${config.port}`);
        });
    } catch (error) {
        console.error('❌ Erreur démarrage serveur:', error);
        process.exit(1);
    }
}

startServer();
