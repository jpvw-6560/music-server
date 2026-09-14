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

    // Parser le nom de fichier pour extraire artiste, album et titre
    parseFileName(filePath) {
        const fileName = path.basename(filePath, path.extname(filePath));
        const dirName = path.basename(path.dirname(filePath));
        
        // Format attendu: "Artiste - Titre.mp3" dans un dossier "Album"
        const separatorIndex = fileName.indexOf(' - ');
        
        if (separatorIndex > 0) {
            const artist = fileName.substring(0, separatorIndex).trim();
            const title = fileName.substring(separatorIndex + 3).trim();
            
            // Le dossier parent devient l'album (sauf si c'est le dossier racine)
            const album = dirName && dirName !== 'Music JPVW' && dirName !== 'Musique' 
                ? dirName 
                : null;
            
            return { artist, title, album };
        }
        
        // Si pas de séparateur, utiliser le dossier comme artiste et le fichier comme titre
        return { 
            artist: dirName && dirName !== 'Music JPVW' && dirName !== 'Musique' ? dirName : null, 
            title: fileName,
            album: null 
        };
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
            // Extraction du nom de fichier
            const parsedName = this.parseFileName(filePath);
            
            // Extraction des métadonnées (pour durée, bitrate, etc.)
            const metadata = await parseFile(filePath);
            const stats = await fs.stat(filePath);
            
            const { common, format } = metadata;
            
            // Utiliser l'artiste du nom de fichier en priorité, sinon métadonnées
            const artistName = parsedName.artist || common.artist || 'Unknown Artist';
            let artist = await Artist.getByName(artistName);
            if (!artist) {
                const artistId = await Artist.create({ name: artistName });
                artist = { id: artistId };
            }
            
            // Utiliser l'album du nom de dossier en priorité, sinon métadonnées
            const albumTitle = parsedName.album || common.album || 'Unknown Album';
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
            // Utiliser le titre du nom de fichier en priorité
            const trackData = {
                title: parsedName.title || common.title || path.basename(filePath, path.extname(filePath)),
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
            // Vérifier que le chemin existe
            try {
                await fs.access(musicPath);
                console.log(`📁 Scan de: ${musicPath}`);
                await this.scanDirectory(musicPath);
            } catch (error) {
                console.warn(`⚠️  Chemin inexistant ou inaccessible: ${musicPath}`);
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
    
    // Scan avec chemins personnalisés
    async scanAll(paths) {
        console.log('🎵 Démarrage du scan de la bibliothèque musicale...');
        this.scannedFiles = 0;
        this.errors = 0;
        
        const startTime = Date.now();
        
        for (const musicPath of paths) {
            try {
                // Vérifier que le chemin existe
                await fs.access(musicPath);
                console.log(`📁 Scan de: ${musicPath}`);
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
