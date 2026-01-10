// models/Track.js
// Modèle pour la table tracks

const db = require('../config/database');

class Track {
  /**
   * Récupère toutes les pistes avec pagination
   * @param {number} page
   * @param {number} limit
   * @returns {Promise<Object>}
   */
  static async getAll(page = 1, limit = 50) {
    const offset = (page - 1) * limit;
    
    const [tracks] = await db.pool.query(`
      SELECT t.*, ar.name as artist_name, al.title as album_title
      FROM tracks t
      LEFT JOIN artists ar ON t.artist_id = ar.id
      LEFT JOIN albums al ON t.album_id = al.id
      ORDER BY t.title
      LIMIT ? OFFSET ?
    `, [limit, offset]);
    
    const [count] = await db.pool.query('SELECT COUNT(*) as total FROM tracks');
    
    return {
      tracks,
      total: count[0].total,
      page,
      pages: Math.ceil(count[0].total / limit)
    };
  }

  /**
   * Recherche des pistes par mot-clé
   * @param {string} query
   * @returns {Promise<Object>}
   */
  static async search(query) {
    const searchTerm = `%${query.toLowerCase()}%`;
    
    const [tracks] = await db.pool.query(`
      SELECT t.*, ar.name as artist_name, al.title as album_title
      FROM tracks t
      LEFT JOIN artists ar ON t.artist_id = ar.id
      LEFT JOIN albums al ON t.album_id = al.id
      WHERE LOWER(t.title) LIKE ? 
         OR LOWER(ar.name) LIKE ? 
         OR LOWER(al.title) LIKE ?
      ORDER BY t.title
      LIMIT 500
    `, [searchTerm, searchTerm, searchTerm]);
    
    return {
      tracks,
      total: tracks.length
    };
  }

  /**
   * Récupère une piste par son ID
   * @param {number} id
   * @returns {Promise<Object|null>}
   */
  static async getById(id) {
    const [rows] = await db.pool.query(`
      SELECT t.*, ar.name as artist_name, al.title as album_title
      FROM tracks t
      LEFT JOIN artists ar ON t.artist_id = ar.id
      LEFT JOIN albums al ON t.album_id = al.id
      WHERE t.id = ?
    `, [id]);
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Récupère une piste par chemin de fichier
   * @param {string} filePath
   * @returns {Promise<Object|null>}
   */
  static async getByFilePath(filePath) {
    const [rows] = await db.pool.query(
      'SELECT * FROM tracks WHERE file_path = ?',
      [filePath]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Crée une nouvelle piste
   * @param {Object} data
   * @returns {Promise<number>} ID de la piste créée
   */
  static async create(data) {
    const [result] = await db.pool.query(
      `INSERT INTO tracks 
      (title, artist_id, album_id, file_path, duration, track_number,
       disc_number, bitrate, sample_rate, format, file_size)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.title, data.artist_id, data.album_id, data.file_path,
        data.duration, data.track_number, data.disc_number || 1,
        data.bitrate, data.sample_rate, data.format, data.file_size
      ]
    );
    return result.insertId;
  }

  /**
   * Met à jour une piste
   * @param {string} filePath
   * @param {Object} data
   * @returns {Promise<boolean>}
   */
  static async updateByFilePath(filePath, data) {
    const [result] = await db.pool.query(
      `UPDATE tracks SET 
        title = ?, artist_id = ?, album_id = ?, duration = ?,
        track_number = ?, disc_number = ?, bitrate = ?, sample_rate = ?,
        format = ?, file_size = ?
      WHERE file_path = ?`,
      [
        data.title, data.artist_id, data.album_id, data.duration,
        data.track_number, data.disc_number, data.bitrate, data.sample_rate,
        data.format, data.file_size, filePath
      ]
    );
    return result.affectedRows > 0;
  }

  /**
   * Incrémente le compteur de lecture
   * @param {number} trackId
   * @returns {Promise<void>}
   */
  static async incrementPlayCount(trackId) {
    await db.pool.query(
      'UPDATE tracks SET play_count = play_count + 1, last_played = NOW() WHERE id = ?',
      [trackId]
    );
    await db.pool.query(
      'INSERT INTO play_history (track_id) VALUES (?)',
      [trackId]
    );
  }

  /**
   * Pistes les plus écoutées
   * @param {number} limit
   * @returns {Promise<Array>}
   */
  static async getTopPlayed(limit = 20) {
    const [rows] = await db.pool.query(`
      SELECT t.*, ar.name as artist_name, al.title as album_title
      FROM tracks t
      LEFT JOIN artists ar ON t.artist_id = ar.id
      LEFT JOIN albums al ON t.album_id = al.id
      WHERE t.play_count > 0
      ORDER BY t.play_count DESC, t.last_played DESC
      LIMIT ?
    `, [limit]);
    return rows;
  }

  /**
   * Pistes récemment ajoutées
   * @param {number} limit
   * @returns {Promise<Array>}
   */
  static async getRecent(limit = 20) {
    const [rows] = await db.pool.query(`
      SELECT t.*, ar.name as artist_name, al.title as album_title
      FROM tracks t
      LEFT JOIN artists ar ON t.artist_id = ar.id
      LEFT JOIN albums al ON t.album_id = al.id
      ORDER BY t.created_at DESC
      LIMIT ?
    `, [limit]);
    return rows;
  }

  /**
   * Recherche de pistes
   * @param {string} query
   * @returns {Promise<Array>}
   */
  static async search(query) {
    const [rows] = await db.pool.query(`
      SELECT t.*, ar.name as artist_name, al.title as album_title
      FROM tracks t
      LEFT JOIN artists ar ON t.artist_id = ar.id
      LEFT JOIN albums al ON t.album_id = al.id
      WHERE t.title LIKE ? OR ar.name LIKE ?
      LIMIT 50
    `, [`%${query}%`, `%${query}%`]);
    return rows;
  }
}

module.exports = Track;
