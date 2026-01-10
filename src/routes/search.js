// routes/search.js
// Routes pour la recherche

const express = require('express');
const router = express.Router();
const SearchController = require('../../controllers/SearchController');

// GET /api/search?q=query
router.get('/', SearchController.search);

module.exports = router;
