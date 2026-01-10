// controllers/ArtistController.js
// Contrôleur pour la gestion des artistes

const Artist = require('../models/Artist');

class ArtistController {
  /**
   * GET /api/artists
   * Liste tous les artistes
   */
  static async getAll(req, res) {
    try {
      const artists = await Artist.getAll();
      res.json(artists);
    } catch (err) {
      console.error('Erreur récupération artistes:', err);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }

  /**
   * GET /api/artists/:id
   * Détails d'un artiste
   */
  static async getById(req, res) {
    try {
      const artist = await Artist.getById(req.params.id);
      
      if (!artist) {
        return res.status(404).json({ error: 'Artiste non trouvé' });
      }
      
      const albums = await Artist.getAlbums(req.params.id);
      const tracks = await Artist.getTracks(req.params.id);
      
      res.json({ artist, albums, tracks });
    } catch (err) {
      console.error('Erreur récupération artiste:', err);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }

  /**
   * POST /api/artists
   * Crée un nouvel artiste
   */
  static async create(req, res) {
    try {
      const { name, sort_name, biography, image_path } = req.body;
      
      if (!name) {
        return res.status(400).json({ error: 'Le nom est requis' });
      }
      
      const artistId = await Artist.create({
        name,
        sort_name,
        biography,
        image_path
      });
      
      res.status(201).json({ id: artistId, name });
    } catch (err) {
      console.error('Erreur création artiste:', err);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }

  /**
   * PUT /api/artists/:id
   * Met à jour un artiste
   */
  static async update(req, res) {
    try {
      const updated = await Artist.update(req.params.id, req.body);
      
      if (!updated) {
        return res.status(404).json({ error: 'Artiste non trouvé' });
      }
      
      res.json({ success: true });
    } catch (err) {
      console.error('Erreur mise à jour artiste:', err);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
}

module.exports = ArtistController;
