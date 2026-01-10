// src/scanner.js
// Script de scan de la bibliothèque musicale

const fs = require('fs').promises;
const path = require('path');
const { parseFile } = require('music-metadata');
const { initDatabase } = require('../config/database');
const config = require('../config/config');
const Artist = require('../models/Artist');
const Album = require('../models/Album');
const Track = require('../models/Track');

class MusicScanner {
    constructor() {
        this.scannedFiles = 0;
        this.errors = 0;
        this.onProgress = null; // Callback pour mettre à jour le statut
    }

    // Scan récursif des répertoires
    async scanDirectory(dirPath) {
        try {
            const entries = await fs.readdir(dirPath, { withFileTypes: true });
            
            for (const entry of entries) {
                const fullPath = path.join(dirPath, entry.name);
                
                if (entry.isDirectory() && config.scanOptions.recursive) {
                    await this.scanDirectory(fullPath);
                } else if (entry.isFile()) {
                    const ext = path.extname(entry.name).toLowerCase();
                    if (config.supportedFormats.includes(ext)) {
                        await this.processAudioFile(fullPath);
                    }
                }
            }
        } catch (error) {
            console.error(`Erreur lecture répertoire ${dirPath}:`, error.message);
        }
    }

    // Traitement d'un fichier audio
    async processAudioFile(filePath) {
        try {
            // Extraction des métadonnées
            const metadata = await parseFile(filePath);
            const stats = await fs.stat(filePath);
            
            const { common, format } = metadata;
            
            // Récupération ou création de l'artiste
            const artistName = common.artist || 'Unknown Artist';
            let artist = await Artist.getByName(artistName);
            if (!artist) {
                const artistId = await Artist.create({ name: artistName });
                artist = { id: artistId };
            }
            
            // Récupération ou création de l'album
            const albumTitle = common.album || 'Unknown Album';
            let album = await Album.getByTitleAndArtist(albumTitle, artist.id);
            if (!album) {
                const albumId = await Album.create({
                    title: albumTitle,
                    artist_id: artist.id,
                    year: common.year,
                    genre: common.genre ? common.genre[0] : null
                });
                album = { id: albumId };
            }
            
            // Insertion ou mise à jour de la piste
            const trackData = {
                title: common.title || path.basename(filePath, path.extname(filePath)),
                artist_id: artist.id,
                album_id: album.id,
                file_path: filePath,
                duration: format.duration ? Math.round(format.duration) : null,
                track_number: common.track?.no || null,
                disc_number: common.disk?.no || 1,
                bitrate: format.bitrate || null,
                sample_rate: format.sampleRate || null,
                format: format.container || path.extname(filePath).slice(1),
                file_size: stats.size
            };
            
            const existing = await Track.getByFilePath(filePath);
            if (existing) {
                await Track.updateByFilePath(filePath, trackData);
            } else {
                await Track.create(trackData);
            }
            
            this.scannedFiles++;
            
            // Callback de progression
            if (this.onProgress) {
                this.onProgress({
                    scannedFiles: this.scannedFiles,
                    errors: this.errors,
                    currentPath: filePath
                });
            }
            
            if (this.scannedFiles % 100 === 0) {
                console.log(`📀 ${this.scannedFiles} fichiers scannés...`);
            }
            
        } catch (error) {
            this.errors++;
            console.error(`Erreur traitement ${filePath}:`, error.message);
        }
    }

    // Lancer le scan complet
    async scan() {
        console.log('🎵 Démarrage du scan de la bibliothèque musicale...');
        this.scannedFiles = 0;
        this.errors = 0;
        
        const startTime = Date.now();
        
        for (const musicPath of config.musicPaths) {
            console.log(`📁 Scan de: ${musicPath}`);
            await this.scanDirectory(musicPath);
        }
        
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(`\n✅ Scan terminé en ${duration}s`);
        console.log(`📀 ${this.scannedFiles} fichiers traités`);
        if (this.errors > 0) {
            console.log(`⚠️  ${this.errors} erreurs`);
        }
    }
    
    // Scan avec chemins personnalisés
    async scanAll(paths) {
        console.log('🎵 Démarrage du scan de la bibliothèque musicale...');
        this.scannedFiles = 0;
        this.errors = 0;
        
        const startTime = Date.now();
        
        for (const musicPath of paths) {
            console.log(`📁 Scan de: ${musicPath}`);
            try {
                await this.scanDirectory(musicPath);
            } catch (error) {
                console.error(`❌ Erreur scan ${musicPath}:`, error.message);
                this.errors++;
            }
        }
        
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(`\n✅ Scan terminé en ${duration}s`);
        console.log(`📀 ${this.scannedFiles} fichiers traités`);
        if (this.errors > 0) {
            console.log(`⚠️  ${this.errors} erreurs`);
        }
    }
}

// Script exécutable
if (require.main === module) {
    (async () => {
        try {
            await initDatabase();
            const scanner = new MusicScanner();
            await scanner.scan();
            process.exit(0);
        } catch (error) {
            console.error('❌ Erreur:', error);
            process.exit(1);
        }
    })();
}

module.exports = MusicScanner;
