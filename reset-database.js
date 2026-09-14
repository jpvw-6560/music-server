#!/usr/bin/env node
/**
 * Script de réinitialisation complète de la base de données
 * Vide toutes les tables et relance un scan complet
 */

const { pool } = require('./config/database');
const MusicScanner = require('./src/scanner');

async function resetDatabase() {
    console.log('🔄 Réinitialisation de la base de données...\n');
    
    let connection;
    try {
        connection = await pool.getConnection();
        
        // Désactiver les contraintes de clés étrangères temporairement
        await connection.query('SET FOREIGN_KEY_CHECKS = 0');
        
        console.log('📋 Vidage des tables...');
        
        // Vider toutes les tables dans le bon ordre
        const tables = [
            'play_history',
            'playlist_tracks',
            'playlists',
            'tracks',
            'albums',
            'artists'
        ];
        
        for (const table of tables) {
            await connection.query(`TRUNCATE TABLE ${table}`);
            console.log(`   ✓ Table ${table} vidée`);
        }
        
        // Réactiver les contraintes
        await connection.query('SET FOREIGN_KEY_CHECKS = 1');
        
        console.log('\n✅ Base de données vidée avec succès!\n');
        
    } catch (error) {
        console.error('❌ Erreur lors de la réinitialisation:', error.message);
        process.exit(1);
    } finally {
        if (connection) connection.release();
    }
    
    // Lancer le scan
    console.log('🎵 Lancement du scan de la bibliothèque musicale...\n');
    try {
        const scanner = new MusicScanner();
        await scanner.scan();
        console.log('\n✅ Scan terminé avec succès!');
    } catch (error) {
        console.error('❌ Erreur lors du scan:', error.message);
    } finally {
        await pool.end();
        process.exit(0);
    }
}

// Demander confirmation avant d'exécuter
const readline = require('readline');
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.question('⚠️  Cette action va SUPPRIMER toutes les données de la base. Continuer? (oui/non): ', (answer) => {
    rl.close();
    if (answer.toLowerCase() === 'oui') {
        resetDatabase();
    } else {
        console.log('Opération annulée.');
        process.exit(0);
    }
});
