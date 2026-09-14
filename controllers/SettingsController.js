// controllers/SettingsController.js
const fs = require('fs');
const path = require('path');

const settingsPath = path.join(__dirname, '../config/settings.json');

class SettingsController {
    // Récupérer les chemins de musique configurés
    static getMusicPaths(req, res) {
        try {
            if (!fs.existsSync(settingsPath)) {
                return res.json({ musicPaths: [] });
            }
            
            const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
            res.json({ musicPaths: settings.musicPaths || [] });
        } catch (error) {
            console.error('Erreur lors de la lecture des paramètres:', error);
            res.status(500).json({ error: 'Erreur lors de la lecture des paramètres' });
        }
    }

    // Ajouter un nouveau chemin
    static addMusicPath(req, res) {
        try {
            const { path: newPath } = req.body;
            
            if (!newPath || typeof newPath !== 'string') {
                return res.status(400).json({ error: 'Chemin invalide' });
            }

            // Vérifier que le chemin existe
            if (!fs.existsSync(newPath)) {
                return res.status(400).json({ error: 'Le chemin n\'existe pas sur le serveur' });
            }

            let settings = { musicPaths: [] };
            if (fs.existsSync(settingsPath)) {
                settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
            }

            if (!settings.musicPaths) {
                settings.musicPaths = [];
            }

            // Vérifier que le chemin n'existe pas déjà
            if (settings.musicPaths.includes(newPath)) {
                return res.status(400).json({ error: 'Ce chemin existe déjà' });
            }

            settings.musicPaths.push(newPath);
            fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf8');

            res.json({ 
                success: true, 
                musicPaths: settings.musicPaths 
            });
        } catch (error) {
            console.error('Erreur lors de l\'ajout du chemin:', error);
            res.status(500).json({ error: 'Erreur lors de l\'ajout du chemin' });
        }
    }

    // Supprimer un chemin
    static removeMusicPath(req, res) {
        try {
            const { path: pathToRemove } = req.body;
            
            if (!pathToRemove || typeof pathToRemove !== 'string') {
                return res.status(400).json({ error: 'Chemin invalide' });
            }

            if (!fs.existsSync(settingsPath)) {
                return res.status(400).json({ error: 'Aucune configuration trouvée' });
            }

            const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
            
            if (!settings.musicPaths) {
                return res.status(400).json({ error: 'Aucun chemin configuré' });
            }

            const index = settings.musicPaths.indexOf(pathToRemove);
            if (index === -1) {
                return res.status(400).json({ error: 'Chemin non trouvé' });
            }

            settings.musicPaths.splice(index, 1);
            fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf8');

            res.json({ 
                success: true, 
                musicPaths: settings.musicPaths 
            });
        } catch (error) {
            console.error('Erreur lors de la suppression du chemin:', error);
            res.status(500).json({ error: 'Erreur lors de la suppression du chemin' });
        }
    }

    // Lister les sous-répertoires d'un chemin
    static listDirectories(req, res) {
        try {
            const { path: dirPath } = req.query;
            
            if (!dirPath) {
                return res.status(400).json({ error: 'Chemin requis' });
            }

            if (!fs.existsSync(dirPath)) {
                return res.status(400).json({ error: 'Le chemin n\'existe pas' });
            }

            const stat = fs.statSync(dirPath);
            if (!stat.isDirectory()) {
                return res.status(400).json({ error: 'Ce n\'est pas un répertoire' });
            }

            const items = fs.readdirSync(dirPath);
            const directories = items
                .filter(item => {
                    try {
                        const itemPath = path.join(dirPath, item);
                        return fs.statSync(itemPath).isDirectory();
                    } catch {
                        return false;
                    }
                })
                .map(dir => path.join(dirPath, dir))
                .sort();

            res.json({ directories });
        } catch (error) {
            console.error('Erreur lors de la liste des répertoires:', error);
            res.status(500).json({ error: 'Erreur lors de la lecture du répertoire' });
        }
    }
}

module.exports = SettingsController;
