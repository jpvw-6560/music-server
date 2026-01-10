// controllers/PlaylistController.js
// Contrôleur pour la gestion des playlists

const Playlist = require('../models/Playlist');

class PlaylistController {
  /**
   * GET /api/playlists
   * Liste toutes les playlists
   */
  static async getAll(req, res) {
    try {
      const playlists = await Playlist.getAll();
      res.json(playlists);
    } catch (err) {
      console.error('Erreur récupération playlists:', err);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }

  /**
   * GET /api/playlists/:id
   * Détails d'une playlist
   */
  static async getById(req, res) {
    try {
      const playlist = await Playlist.getById(req.params.id);
      
      if (!playlist) {
        return res.status(404).json({ error: 'Playlist non trouvée' });
      }
      
      const tracks = await Playlist.getTracks(req.params.id);
      
      res.json({ playlist, tracks });
    } catch (err) {
      console.error('Erreur récupération playlist:', err);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }

  /**
   * POST /api/playlists
   * Crée une nouvelle playlist
   */
  static async create(req, res) {
    try {
      const { name, description } = req.body;
      
      if (!name) {
        return res.status(400).json({ error: 'Le nom est requis' });
      }
      
      const playlistId = await Playlist.create({ name, description });
      
      res.status(201).json({ id: playlistId, name, description });
    } catch (err) {
      console.error('Erreur création playlist:', err);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }

  /**
   * PUT /api/playlists/:id
   * Met à jour une playlist
   */
  static async update(req, res) {
    try {
      const updated = await Playlist.update(req.params.id, req.body);
      
      if (!updated) {
        return res.status(404).json({ error: 'Playlist non trouvée' });
      }
      
      res.json({ success: true });
    } catch (err) {
      console.error('Erreur mise à jour playlist:', err);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }

  /**
   * DELETE /api/playlists/:id
   * Supprime une playlist
   */
  static async delete(req, res) {
    try {
      const deleted = await Playlist.delete(req.params.id);
      
      if (!deleted) {
        return res.status(404).json({ error: 'Playlist non trouvée' });
      }
      
      res.json({ success: true });
    } catch (err) {
      console.error('Erreur suppression playlist:', err);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }

  /**
   * POST /api/playlists/:id/tracks
   * Ajoute une piste à une playlist
   */
  static async addTrack(req, res) {
    try {
      const { track_id } = req.body;
      
      if (!track_id) {
        return res.status(400).json({ error: 'track_id requis' });
      }
      
      const position = await Playlist.addTrack(req.params.id, track_id);
      
      res.json({ success: true, position });
    } catch (err) {
      console.error('Erreur ajout piste playlist:', err);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }

  /**
   * DELETE /api/playlists/:id/tracks/:trackId
   * Supprime une piste d'une playlist
   */
  static async removeTrack(req, res) {
    try {
      const removed = await Playlist.removeTrack(req.params.id, req.params.trackId);
      
      if (!removed) {
        return res.status(404).json({ error: 'Piste non trouvée dans la playlist' });
      }
      
      res.json({ success: true });
    } catch (err) {
      console.error('Erreur suppression piste playlist:', err);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
}

module.exports = PlaylistController;
