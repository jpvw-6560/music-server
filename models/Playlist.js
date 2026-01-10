// models/Playlist.js
// Modèle pour la table playlists

const db = require('../config/database');

class Playlist {
  /**
   * Récupère toutes les playlists
   * @returns {Promise<Array>}
   */
  static async getAll() {
    const [rows] = await db.pool.query(`
      SELECT p.*, COUNT(pt.id) as track_count
      FROM playlists p
      LEFT JOIN playlist_tracks pt ON p.id = pt.playlist_id
      GROUP BY p.id
      ORDER BY p.name
    `);
    return rows;
  }

  /**
   * Récupère une playlist par son ID
   * @param {number} id
   * @returns {Promise<Object|null>}
   */
  static async getById(id) {
    const [rows] = await db.pool.query(
      'SELECT * FROM playlists WHERE id = ?',
      [id]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Crée une nouvelle playlist
   * @param {Object} data
   * @returns {Promise<number>} ID de la playlist créée
   */
  static async create(data) {
    const [result] = await db.pool.query(
      'INSERT INTO playlists (name, description) VALUES (?, ?)',
      [data.name, data.description || null]
    );
    return result.insertId;
  }

  /**
   * Met à jour une playlist
   * @param {number} id
   * @param {Object} data
   * @returns {Promise<boolean>}
   */
  static async update(id, data) {
    const [result] = await db.pool.query(
      'UPDATE playlists SET name = COALESCE(?, name), description = COALESCE(?, description) WHERE id = ?',
      [data.name, data.description, id]
    );
    return result.affectedRows > 0;
  }

  /**
   * Supprime une playlist
   * @param {number} id
   * @returns {Promise<boolean>}
   */
  static async delete(id) {
    const [result] = await db.pool.query('DELETE FROM playlists WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  /**
   * Récupère les pistes d'une playlist
   * @param {number} playlistId
   * @returns {Promise<Array>}
   */
  static async getTracks(playlistId) {
    const [rows] = await db.pool.query(`
      SELECT t.*, ar.name as artist_name, al.title as album_title,
             pt.position, pt.added_at
      FROM playlist_tracks pt
      JOIN tracks t ON pt.track_id = t.id
      LEFT JOIN artists ar ON t.artist_id = ar.id
      LEFT JOIN albums al ON t.album_id = al.id
      WHERE pt.playlist_id = ?
      ORDER BY pt.position
    `, [playlistId]);
    return rows;
  }

  /**
   * Ajoute une piste à une playlist
   * @param {number} playlistId
   * @param {number} trackId
   * @returns {Promise<number>} Position de la piste
   */
  static async addTrack(playlistId, trackId) {
    const [maxPos] = await db.pool.query(
      'SELECT COALESCE(MAX(position), 0) as max_pos FROM playlist_tracks WHERE playlist_id = ?',
      [playlistId]
    );
    
    const position = maxPos[0].max_pos + 1;
    
    await db.pool.query(
      'INSERT INTO playlist_tracks (playlist_id, track_id, position) VALUES (?, ?, ?)',
      [playlistId, trackId, position]
    );
    
    return position;
  }

  /**
   * Supprime une piste d'une playlist
   * @param {number} playlistId
   * @param {number} trackId
   * @returns {Promise<boolean>}
   */
  static async removeTrack(playlistId, trackId) {
    const [result] = await db.pool.query(
      'DELETE FROM playlist_tracks WHERE playlist_id = ? AND track_id = ?',
      [playlistId, trackId]
    );
    return result.affectedRows > 0;
  }
}

module.exports = Playlist;
