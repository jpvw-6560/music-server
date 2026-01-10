// models/Album.js
// Modèle pour la table albums

const db = require('../config/database');

class Album {
  /**
   * Récupère tous les albums avec statistiques
   * @returns {Promise<Array>}
   */
  static async getAll() {
    const [rows] = await db.pool.query(`
      SELECT al.*, ar.name as artist_name,
        COUNT(t.id) as track_count
      FROM albums al
      LEFT JOIN artists ar ON al.artist_id = ar.id
      LEFT JOIN tracks t ON al.id = t.album_id
      GROUP BY al.id
      ORDER BY al.title
    `);
    return rows;
  }

  /**
   * Récupère un album par son ID
   * @param {number} id
   * @returns {Promise<Object|null>}
   */
  static async getById(id) {
    const [rows] = await db.pool.query(`
      SELECT al.*, ar.name as artist_name
      FROM albums al
      LEFT JOIN artists ar ON al.artist_id = ar.id
      WHERE al.id = ?
    `, [id]);
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Récupère un album par titre et artiste
   * @param {string} title
   * @param {number} artistId
   * @returns {Promise<Object|null>}
   */
  static async getByTitleAndArtist(title, artistId) {
    const [rows] = await db.pool.query(
      'SELECT * FROM albums WHERE title = ? AND artist_id = ?',
      [title, artistId]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Crée un nouvel album
   * @param {Object} data
   * @returns {Promise<number>} ID de l'album créé
   */
  static async create(data) {
    const [result] = await db.pool.query(
      'INSERT INTO albums (title, artist_id, year, genre, cover_path) VALUES (?, ?, ?, ?, ?)',
      [data.title, data.artist_id, data.year || null, data.genre || null, data.cover_path || null]
    );
    return result.insertId;
  }

  /**
   * Met à jour un album
   * @param {number} id
   * @param {Object} data
   * @returns {Promise<boolean>}
   */
  static async update(id, data) {
    const [result] = await db.pool.query(
      `UPDATE albums SET 
        title = COALESCE(?, title),
        artist_id = COALESCE(?, artist_id),
        year = COALESCE(?, year),
        genre = COALESCE(?, genre),
        cover_path = COALESCE(?, cover_path)
      WHERE id = ?`,
      [data.title, data.artist_id, data.year, data.genre, data.cover_path, id]
    );
    return result.affectedRows > 0;
  }

  /**
   * Récupère les pistes d'un album
   * @param {number} albumId
   * @returns {Promise<Array>}
   */
  static async getTracks(albumId) {
    const [rows] = await db.pool.query(`
      SELECT t.*, ar.name as artist_name
      FROM tracks t
      LEFT JOIN artists ar ON t.artist_id = ar.id
      WHERE t.album_id = ?
      ORDER BY t.disc_number, t.track_number
    `, [albumId]);
    return rows;
  }

  /**
   * Recherche des albums
   * @param {string} query
   * @returns {Promise<Array>}
   */
  static async search(query) {
    const [rows] = await db.pool.query(`
      SELECT al.*, ar.name as artist_name
      FROM albums al
      LEFT JOIN artists ar ON al.artist_id = ar.id
      WHERE al.title LIKE ?
      LIMIT 20
    `, [`%${query}%`]);
    return rows;
  }
}

module.exports = Album;
