// controllers/AlbumController.js
// Contrôleur pour la gestion des albums

const Album = require('../models/Album');

class AlbumController {
  /**
   * GET /api/albums
   * Liste tous les albums
   */
  static async getAll(req, res) {
    try {
      const albums = await Album.getAll();
      res.json(albums);
    } catch (err) {
      console.error('Erreur récupération albums:', err);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }

  /**
   * GET /api/albums/:id
   * Détails d'un album
   */
  static async getById(req, res) {
    try {
      const album = await Album.getById(req.params.id);
      
      if (!album) {
        return res.status(404).json({ error: 'Album non trouvé' });
      }
      
      const tracks = await Album.getTracks(req.params.id);
      
      res.json({ album, tracks });
    } catch (err) {
      console.error('Erreur récupération album:', err);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }

  /**
   * POST /api/albums
   * Crée un nouvel album
   */
  static async create(req, res) {
    try {
      const { title, artist_id, year, genre, cover_path } = req.body;
      
      if (!title || !artist_id) {
        return res.status(400).json({ error: 'Titre et artiste requis' });
      }
      
      const albumId = await Album.create({
        title,
        artist_id,
        year,
        genre,
        cover_path
      });
      
      res.status(201).json({ id: albumId, title });
    } catch (err) {
      console.error('Erreur création album:', err);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }

  /**
   * PUT /api/albums/:id
   * Met à jour un album
   */
  static async update(req, res) {
    try {
      const updated = await Album.update(req.params.id, req.body);
      
      if (!updated) {
        return res.status(404).json({ error: 'Album non trouvé' });
      }
      
      res.json({ success: true });
    } catch (err) {
      console.error('Erreur mise à jour album:', err);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
}

module.exports = AlbumController;
