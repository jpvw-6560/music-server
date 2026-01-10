// controllers/ScanController.js
// Contrôleur pour le scan de la bibliothèque

const MusicScanner = require('../src/scanner');
const config = require('../config/config');
const fs = require('fs').promises;
const path = require('path');

const SETTINGS_FILE = path.join(__dirname, '../config/settings.json');

// Charger les paramètres sauvegardés
async function loadSettings() {
    try {
        const data = await fs.readFile(SETTINGS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        // Fichier n'existe pas, retourner les valeurs par défaut
        return { musicPaths: config.musicPaths };
    }
}

// Sauvegarder les paramètres
async function saveSettings(settings) {
    try {
        await fs.writeFile(SETTINGS_FILE, JSON.stringify(settings, null, 2));
    } catch (error) {
        console.error('Erreur sauvegarde settings:', error);
        throw error;
    }
}

// Variable pour stocker l'état du scan
let scanStatus = {
    isScanning: false,
    progress: 0,
    scannedFiles: 0,
    errors: 0,
    currentPath: '',
    startTime: null
};

class ScanController {
    /**
     * GET /api/scan/status
     * Récupère l'état du scan en cours
     */
    static getStatus(req, res) {
        res.json(scanStatus);
    }

    /**
     * POST /api/scan/start
     * Démarre un scan de la bibliothèque
     */
    static async start(req, res) {
        if (scanStatus.isScanning) {
            return res.status(409).json({ error: 'Un scan est déjà en cours' });
        }

        try {
            // Charger les chemins depuis les settings
            const settings = await loadSettings();
            const paths = settings.musicPaths || [];
            
            if (paths.length === 0) {
                return res.status(400).json({ 
                    error: 'Aucun chemin configuré. Ajoutez au moins un répertoire à scanner.' 
                });
            }

            // Initialiser l'état
            scanStatus = {
                isScanning: true,
                progress: 0,
                scannedFiles: 0,
                errors: 0,
                currentPath: '',
                startTime: Date.now()
            };

            res.json({ message: 'Scan démarré', status: scanStatus, paths });

            // Lancer le scan en arrière-plan
            const scanner = new MusicScanner();
            
            // Hook pour mettre à jour le statut
            scanner.onProgress = (data) => {
                scanStatus.scannedFiles = data.scannedFiles;
                scanStatus.errors = data.errors;
                scanStatus.currentPath = data.currentPath || '';
                scanStatus.progress = data.progress || 0;
            };

            await scanner.scanAll(paths);
            
            scanStatus.isScanning = false;
            scanStatus.progress = 100;
            const duration = ((Date.now() - scanStatus.startTime) / 1000).toFixed(2);
            console.log(`✅ Scan terminé: ${scanStatus.scannedFiles} fichiers en ${duration}s`);
        } catch (error) {
            console.error('❌ Erreur scan:', error);
            scanStatus.isScanning = false;
            scanStatus.error = error.message;
        }
    }

    /**
     * GET /api/scan/paths
     * Récupère les chemins configurés pour le scan
     */
    static async getPaths(req, res) {
        try {
            const settings = await loadSettings();
            res.json({
                paths: settings.musicPaths || [],
                formats: config.supportedFormats
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    
    /**
     * POST /api/scan/paths/add
     * Ajoute un nouveau chemin à scanner
     */
    static async addPath(req, res) {
        try {
            const { path: newPath } = req.body;
            if (!newPath) {
                return res.status(400).json({ error: 'Chemin requis' });
            }
            
            const settings = await loadSettings();
            if (!settings.musicPaths) settings.musicPaths = [];
            
            // Vérifier si le chemin existe déjà
            if (settings.musicPaths.includes(newPath)) {
                return res.status(400).json({ error: 'Ce chemin existe déjà' });
            }
            
            settings.musicPaths.push(newPath);
            await saveSettings(settings);
            
            res.json({ success: true, paths: settings.musicPaths });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    
    /**
     * POST /api/scan/paths/remove
     * Supprime un chemin de la liste
     */
    static async removePath(req, res) {
        try {
            const { path: removePath } = req.body;
            if (!removePath) {
                return res.status(400).json({ error: 'Chemin requis' });
            }
            
            const settings = await loadSettings();
            settings.musicPaths = (settings.musicPaths || []).filter(p => p !== removePath);
            await saveSettings(settings);
            
            res.json({ success: true, paths: settings.musicPaths });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    
    /**
     * GET /api/scan/browse
     * Liste les répertoires pour la navigation
     */
    static async browse(req, res) {
        try {
            const { path: browsePath } = req.query;
            const targetPath = browsePath || require('os').homedir();
            
            // Lire le contenu du répertoire
            const items = await fs.readdir(targetPath, { withFileTypes: true });
            
            // Filtrer pour ne garder que les dossiers
            const directories = items
                .filter(item => item.isDirectory() && !item.name.startsWith('.'))
                .map(item => ({
                    name: item.name,
                    path: path.join(targetPath, item.name)
                }))
                .sort((a, b) => a.name.localeCompare(b.name));
            
            // Calculer le chemin parent
            const parentPath = path.dirname(targetPath);
            
            res.json({
                currentPath: targetPath,
                parentPath: parentPath !== targetPath ? parentPath : null,
                directories
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = ScanController;
