const mysql = require('mysql2/promise');

// Pool principal (avec database)
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'Jpvw1953!',
    database: 'music_library',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Fonction d'initialisation de la base de données
async function initDatabase() {
    // Connexion sans database pour la création
    const initPool = mysql.createPool({
        host: 'localhost',
        user: 'root',
        password: 'Jpvw1953!',
        waitForConnections: true,
        connectionLimit: 1
    });
    
    const connection = await initPool.getConnection();
    
    try {
        // Création de la base si elle n'existe pas
        await connection.query(`CREATE DATABASE IF NOT EXISTS music_library`);
        await connection.query(`USE music_library`);
        
        // Table des artistes
        await connection.query(`
            CREATE TABLE IF NOT EXISTS artists (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                sort_name VARCHAR(255),
                biography TEXT,
                image_path VARCHAR(500),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY unique_artist (name)
            )
        `);
        
        // Table des albums
        await connection.query(`
            CREATE TABLE IF NOT EXISTS albums (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                artist_id INT,
                year INT,
                genre VARCHAR(100),
                cover_path VARCHAR(500),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (artist_id) REFERENCES artists(id) ON DELETE CASCADE,
                KEY idx_artist (artist_id),
                KEY idx_year (year)
            )
        `);
        
        // Table des pistes
        await connection.query(`
            CREATE TABLE IF NOT EXISTS tracks (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                artist_id INT,
                album_id INT,
                file_path VARCHAR(500) NOT NULL,
                duration INT,
                track_number INT,
                disc_number INT DEFAULT 1,
                bitrate INT,
                sample_rate INT,
                format VARCHAR(20),
                file_size BIGINT,
                play_count INT DEFAULT 0,
                last_played TIMESTAMP NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (artist_id) REFERENCES artists(id) ON DELETE SET NULL,
                FOREIGN KEY (album_id) REFERENCES albums(id) ON DELETE SET NULL,
                UNIQUE KEY unique_path (file_path(255)),
                KEY idx_title (title),
                KEY idx_artist (artist_id),
                KEY idx_album (album_id)
            )
        `);
        
        // Table des playlists
        await connection.query(`
            CREATE TABLE IF NOT EXISTS playlists (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);
        
        // Table de liaison playlist-tracks
        await connection.query(`
            CREATE TABLE IF NOT EXISTS playlist_tracks (
                id INT AUTO_INCREMENT PRIMARY KEY,
                playlist_id INT NOT NULL,
                track_id INT NOT NULL,
                position INT NOT NULL,
                added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE,
                FOREIGN KEY (track_id) REFERENCES tracks(id) ON DELETE CASCADE,
                KEY idx_playlist (playlist_id),
                KEY idx_track (track_id)
            )
        `);
        
        // Table des statistiques d'écoute
        await connection.query(`
            CREATE TABLE IF NOT EXISTS play_history (
                id INT AUTO_INCREMENT PRIMARY KEY,
                track_id INT NOT NULL,
                played_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (track_id) REFERENCES tracks(id) ON DELETE CASCADE,
                KEY idx_track (track_id),
                KEY idx_date (played_at)
            )
        `);
        
        console.log('✅ Base de données initialisée avec succès');
    } catch (error) {
        console.error('❌ Erreur initialisation base de données:', error);
        throw error;
    } finally {
        connection.release();        await initPool.end();    }
}

module.exports = { pool, initDatabase };
