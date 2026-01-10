// routes/albums.js
// Routes pour la gestion des albums

const express = require('express');
const router = express.Router();
const AlbumController = require('../../controllers/AlbumController');

// GET /api/albums
router.get('/', AlbumController.getAll);

// GET /api/albums/:id
router.get('/:id', AlbumController.getById);

// POST /api/albums
router.post('/', AlbumController.create);

// PUT /api/albums/:id
router.put('/:id', AlbumController.update);

module.exports = router;
