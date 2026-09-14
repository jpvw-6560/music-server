// Script pour mettre à jour les chemins des fichiers dans la base de données
const mysql = require('mysql2/promise');
require('dotenv').config();

async function updatePaths() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || '192.168.129.50',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || 'Jpvw1953!',
        database: process.env.DB_NAME || 'music_db',
        port: process.env.DB_PORT || 3306
    });

    try {
        console.log('🔄 Mise à jour des chemins dans la base de données...');
        
        // Mettre à jour les chemins dans la table tracks
        const [result] = await connection.execute(
            "UPDATE tracks SET file_path = REPLACE(file_path, '/media/jpvw/Seagate_1T/Music JPVW/', '/mnt/seagate/Music JPVW/') WHERE file_path LIKE '/media/jpvw/Seagate_1T/Music JPVW/%'"
        );
        
        console.log(`✅ ${result.affectedRows} pistes mises à jour`);
        
        // Vérifier quelques exemples
        const [tracks] = await connection.execute(
            "SELECT id, title, file_path FROM tracks LIMIT 5"
        );
        
        console.log('\n📀 Exemples de pistes:');
        tracks.forEach(track => {
            console.log(`  - ${track.title}: ${track.file_path}`);
        });
        
    } catch (error) {
        console.error('❌ Erreur:', error.message);
    } finally {
        await connection.end();
    }
}

updatePaths();
