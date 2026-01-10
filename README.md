# 🎵 Music Server

Serveur de musique façon MediaMonkey avec architecture MVC.

## Fonctionnalités

- 📚 **Bibliothèque musicale** : Scan automatique et organisation
- 🎤 **Navigation** : Par artistes, albums, genres
- 🎧 **Lecteur audio** : Streaming avec contrôles complets
- 📋 **Playlists** : Création et gestion
- 🔍 **Recherche** : Globale et avancée
- 📊 **Statistiques** : Pistes les plus écoutées, ajouts récents
- 🏷️ **Métadonnées** : Lecture automatique des tags ID3

## Architecture MVC

```
music_server/
├── config/           # Configuration (DB, chemins, formats)
├── models/           # Modèles de données (Artist, Album, Track, Playlist)
├── controllers/      # Logique métier (ArtistController, etc.)
├── src/
│   ├── routes/       # Définition des routes API
│   ├── server.js     # Point d'entrée serveur
│   └── scanner.js    # Scanner de bibliothèque
├── public/           # Interface web (HTML, CSS, JS)
└── package.json
```

## Installation

```bash
cd music_server
npm install
```

## Configuration

Éditez `config/config.js` pour définir vos répertoires musicaux :

```javascript
musicPaths: [
    '/home/jpvw/Musique',
    '/mnt/music',
    // Ajouter d'autres chemins ici
]
```

## Utilisation

### 1. Scanner la bibliothèque

```bash
npm run scan
```

### 2. Démarrer le serveur

```bash
npm start
```

Accès : http://localhost:3001

### Mode développement

```bash
npm run dev  # Avec rechargement automatique
```

## API REST

### Artistes
- `GET /api/artists` - Liste des artistes
- `GET /api/artists/:id` - Détails d'un artiste
- `POST /api/artists` - Créer un artiste
- `PUT /api/artists/:id` - Modifier un artiste

### Albums
- `GET /api/albums` - Liste des albums
- `GET /api/albums/:id` - Détails d'un album
- `POST /api/albums` - Créer un album
- `PUT /api/albums/:id` - Modifier un album

### Pistes
- `GET /api/tracks` - Liste des pistes (paginée)
- `GET /api/tracks/:id` - Détails d'une piste
- `GET /api/tracks/stats/top` - Pistes les plus écoutées
- `GET /api/tracks/stats/recent` - Ajouts récents

### Playlists
- `GET /api/playlists` - Liste des playlists
- `GET /api/playlists/:id` - Détails d'une playlist
- `POST /api/playlists` - Créer une playlist
- `PUT /api/playlists/:id` - Modifier une playlist
- `DELETE /api/playlists/:id` - Supprimer une playlist
- `POST /api/playlists/:id/tracks` - Ajouter une piste
- `DELETE /api/playlists/:id/tracks/:trackId` - Retirer une piste

### Recherche
- `GET /api/search?q=query` - Recherche globale

### Streaming
- `GET /stream/:trackId` - Stream audio (supporte range requests)

## Base de données

MySQL avec 6 tables :
- `artists` - Artistes
- `albums` - Albums
- `tracks` - Pistes musicales
- `playlists` - Playlists
- `playlist_tracks` - Liaison playlists/pistes
- `play_history` - Historique d'écoute

## Formats supportés

MP3, FLAC, M4A, OGG, WAV, WMA, AAC

## Technologies

- **Backend** : Node.js, Express
- **Base de données** : MySQL
- **Métadonnées** : music-metadata
- **Frontend** : HTML5, CSS3, JavaScript vanilla
- **Audio** : HTML5 Audio API

## Développement futur

- [ ] Gestion des pochettes d'albums
- [ ] Égaliseur intégré
- [ ] Mode aléatoire et répétition
- [ ] Export/import playlists (M3U, PLS)
- [ ] Lyrics synchronisés
- [ ] Authentification multi-utilisateurs
- [ ] API mobile
