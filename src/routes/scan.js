// routes/scan.js
// Routes pour la gestion du scan

const express = require('express');
const router = express.Router();
const ScanController = require('../../controllers/ScanController');

// GET /api/scan/status
router.get('/status', ScanController.getStatus);

// POST /api/scan/start
router.post('/start', ScanController.start);

// GET /api/scan/paths
router.get('/paths', ScanController.getPaths);

// POST /api/scan/paths/add
router.post('/paths/add', ScanController.addPath);

// POST /api/scan/paths/remove
router.post('/paths/remove', ScanController.removePath);

// GET /api/scan/browse
router.get('/browse', ScanController.browse);

module.exports = router;
