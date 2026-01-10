// models/Artist.js
// Modèle pour la table artists

const db = require('../config/database');

class Artist {
  /**
   * Récupère tous les artistes avec statistiques
   * @returns {Promise<Array>}
   */
  static async getAll() {
    const [rows] = await db.pool.query(`
      SELECT a.*, 
        COUNT(DISTINCT al.id) as album_count,
        COUNT(DISTINCT t.id) as track_count
      FROM artists a
      LEFT JOIN albums al ON a.id = al.artist_id
      LEFT JOIN tracks t ON a.id = t.artist_id
      GROUP BY a.id
      ORDER BY a.sort_name
    `);
    return rows;
  }

  /**
   * Récupère un artiste par son ID
   * @param {number} id
   * @returns {Promise<Object|null>}
   */
  static async getById(id) {
    const [rows] = await db.pool.query(
      'SELECT * FROM artists WHERE id = ?',
      [id]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Récupère un artiste par son nom
   * @param {string} name
   * @returns {Promise<Object|null>}
   */
  static async getByName(name) {
    const [rows] = await db.pool.query(
      'SELECT * FROM artists WHERE name = ?',
      [name]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Crée un nouvel artiste
   * @param {Object} data
   * @returns {Promise<number>} ID de l'artiste créé
   */
  static async create(data) {
    const [result] = await db.pool.query(
      'INSERT INTO artists (name, sort_name, biography, image_path) VALUES (?, ?, ?, ?)',
      [data.name, data.sort_name || data.name, data.biography || null, data.image_path || null]
    );
    return result.insertId;
  }

  /**
   * Met à jour un artiste
   * @param {number} id
   * @param {Object} data
   * @returns {Promise<boolean>}
   */
  static async update(id, data) {
    const [result] = await db.pool.query(
      `UPDATE artists SET 
        name = COALESCE(?, name),
        sort_name = COALESCE(?, sort_name),
        biography = COALESCE(?, biography),
        image_path = COALESCE(?, image_path)
      WHERE id = ?`,
      [data.name, data.sort_name, data.biography, data.image_path, id]
    );
    return result.affectedRows > 0;
  }

  /**
   * Récupère les albums d'un artiste
   * @param {number} artistId
   * @returns {Promise<Array>}
   */
  static async getAlbums(artistId) {
    const [rows] = await db.pool.query(
      'SELECT * FROM albums WHERE artist_id = ? ORDER BY year DESC',
      [artistId]
    );
    return rows;
  }

  /**
   * Récupère les pistes d'un artiste
   * @param {number} artistId
   * @returns {Promise<Array>}
   */
  static async getTracks(artistId) {
    const [rows] = await db.pool.query(
      'SELECT * FROM tracks WHERE artist_id = ? ORDER BY title',
      [artistId]
    );
    return rows;
  }

  /**
   * Recherche des artistes
   * @param {string} query
   * @returns {Promise<Array>}
   */
  static async search(query) {
    const [rows] = await db.pool.query(
      'SELECT * FROM artists WHERE name LIKE ? LIMIT 20',
      [`%${query}%`]
    );
    return rows;
  }
}

module.exports = Artist;
