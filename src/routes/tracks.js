// routes/tracks.js
// Routes pour la gestion des pistes

const express = require('express');
const router = express.Router();
const TrackController = require('../../controllers/TrackController');

// GET /api/tracks/stats/top
router.get('/stats/top', TrackController.getTopPlayed);

// GET /api/tracks/stats/recent
router.get('/stats/recent', TrackController.getRecent);

// GET /api/tracks
router.get('/', TrackController.getAll);

// GET /api/tracks/:id
router.get('/:id', TrackController.getById);

// PUT /api/tracks/:id
router.put('/:id', TrackController.update);

module.exports = router;
