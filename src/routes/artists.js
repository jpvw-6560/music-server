// routes/artists.js
// Routes pour la gestion des artistes

const express = require('express');
const router = express.Router();
const ArtistController = require('../../controllers/ArtistController');

// GET /api/artists
router.get('/', ArtistController.getAll);

// GET /api/artists/:id
router.get('/:id', ArtistController.getById);

// POST /api/artists
router.post('/', ArtistController.create);

// PUT /api/artists/:id
router.put('/:id', ArtistController.update);

module.exports = router;
