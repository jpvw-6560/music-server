// src/routes/settings.js
const express = require('express');
const router = express.Router();
const SettingsController = require('../../controllers/SettingsController');

// Routes pour gérer les chemins de musique
router.get('/music-paths', SettingsController.getMusicPaths);
router.post('/music-paths', SettingsController.addMusicPath);
router.delete('/music-paths', SettingsController.removeMusicPath);
router.get('/directories', SettingsController.listDirectories);

module.exports = router;
