// controllers/SearchController.js
// Contrôleur pour la recherche

const Artist = require('../models/Artist');
const Album = require('../models/Album');
const Track = require('../models/Track');

class SearchController {
  /**
   * GET /api/search?q=query
   * Recherche globale
   */
  static async search(req, res) {
    try {
      const query = req.query.q;
      
      if (!query || query.length < 2) {
        return res.json({ artists: [], albums: [], tracks: [] });
      }
      
      const [artists, albums, tracks] = await Promise.all([
        Artist.search(query),
        Album.search(query),
        Track.search(query)
      ]);
      
      res.json({ artists, albums, tracks });
    } catch (err) {
      console.error('Erreur recherche:', err);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
}

module.exports = SearchController;
