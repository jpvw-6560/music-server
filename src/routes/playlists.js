// routes/playlists.js
// Routes pour la gestion des playlists

const express = require('express');
const router = express.Router();
const PlaylistController = require('../../controllers/PlaylistController');

// GET /api/playlists
router.get('/', PlaylistController.getAll);

// GET /api/playlists/:id
router.get('/:id', PlaylistController.getById);

// POST /api/playlists
router.post('/', PlaylistController.create);

// PUT /api/playlists/:id
router.put('/:id', PlaylistController.update);

// DELETE /api/playlists/:id
router.delete('/:id', PlaylistController.delete);

// POST /api/playlists/:id/tracks
router.post('/:id/tracks', PlaylistController.addTrack);

// DELETE /api/playlists/:id/tracks/:trackId
router.delete('/:id/tracks/:trackId', PlaylistController.removeTrack);

module.exports = router;
