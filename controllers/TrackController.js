// controllers/TrackController.js
// Contrôleur pour la gestion des pistes

const Track = require('../models/Track');

class TrackController {
  /**
   * GET /api/tracks
   * Liste toutes les pistes avec pagination
   */
  static async getAll(req, res) {
    try {
      const search = req.query.search;
      
      // Si recherche, utiliser la méthode search
      if (search && search.trim()) {
        const result = await Track.search(search.trim());
        return res.json(result);
      }
      
      // Sinon, pagination normale
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 50;
      
      const result = await Track.getAll(page, limit);
      res.json(result);
    } catch (err) {
      console.error('Erreur récupération pistes:', err);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }

  /**
   * GET /api/tracks/:id
   * Détails d'une piste
   */
  static async getById(req, res) {
    try {
      const track = await Track.getById(req.params.id);
      
      if (!track) {
        return res.status(404).json({ error: 'Piste non trouvée' });
      }
      
      res.json(track);
    } catch (err) {
      console.error('Erreur récupération piste:', err);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }

  /**
   * GET /api/tracks/stats/top
   * Pistes les plus écoutées
   */
  static async getTopPlayed(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 20;
      const tracks = await Track.getTopPlayed(limit);
      res.json(tracks);
    } catch (err) {
      console.error('Erreur récupération top:', err);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }

  /**
   * GET /api/tracks/stats/recent
   * Pistes récemment ajoutées
   */
  static async getRecent(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 20;
      const tracks = await Track.getRecent(limit);
      res.json(tracks);
    } catch (err) {
      console.error('Erreur récupération récents:', err);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
}

module.exports = TrackController;
