// public/app.js
// Application frontend du serveur de musique

const API_BASE = '/api';

// État global
const state = {
    currentView: 'library',
    currentTrack: null,
    queue: [], // File d'attente
    currentIndex: -1,
    isPlaying: false,
    repeat: false, // Mode répétition
    shuffle: false // Mode aléatoire
};

// Sauvegarder l'état dans localStorage
function savePlayerState() {
    const playerState = {
        currentTrack: state.currentTrack,
        queue: state.queue,
        currentIndex: state.currentIndex,
        isPlaying: state.isPlaying,
        repeat: state.repeat,
        shuffle: state.shuffle,
        currentTime: audioPlayer.currentTime,
        volume: audioPlayer.volume
    };
    localStorage.setItem('musicPlayerState', JSON.stringify(playerState));
}

// Restaurer l'état depuis localStorage
async function restorePlayerState() {
    const savedState = localStorage.getItem('musicPlayerState');
    if (savedState) {
        try {
            const playerState = JSON.parse(savedState);
            state.currentTrack = playerState.currentTrack;
            state.queue = playerState.queue || [];
            state.currentIndex = playerState.currentIndex || -1;
            state.repeat = playerState.repeat || false;
            state.shuffle = playerState.shuffle || false;
            
            // Restaurer le volume
            if (playerState.volume !== undefined) {
                audioPlayer.volume = playerState.volume;
                volumeBar.value = playerState.volume * 100;
            }
            
            // Restaurer la piste en cours
            if (state.currentTrack) {
                audioPlayer.src = `/stream/${state.currentTrack.id}`;
                
                // Attendre que les métadonnées soient chargées
                audioPlayer.addEventListener('loadedmetadata', () => {
                    if (playerState.currentTime) {
                        audioPlayer.currentTime = playerState.currentTime;
                    }
                }, { once: true });
                
                // Mettre à jour l'affichage
                document.getElementById('playerTitle').textContent = state.currentTrack.title;
                document.getElementById('playerArtist').textContent = state.currentTrack.artist_name || '-';
                
                // Ne pas démarrer automatiquement, juste charger
                state.isPlaying = false;
                btnPlay.textContent = '▶';
                
                console.log(`📀 Piste restaurée: ${state.currentTrack.title} à ${Math.floor(playerState.currentTime)}s`);
            }
        } catch (error) {
            console.error('Erreur restauration état:', error);
        }
    }
}

// Sauvegarder périodiquement la position
setInterval(() => {
    if (state.currentTrack && state.isPlaying) {
        savePlayerState();
    }
}, 5000); // Toutes les 5 secondes

// Éléments DOM
const audioPlayer = document.getElementById('audioPlayer');
const btnPlay = document.getElementById('btnPlay');
const btnPrev = document.getElementById('btnPrev');
const btnNext = document.getElementById('btnNext');
const progressBar = document.getElementById('progressBar');
const volumeBar = document.getElementById('volumeBar');
const searchInput = document.getElementById('searchInput');
const contentView = document.getElementById('content-view');

// Initialisation
document.addEventListener('DOMContentLoaded', async () => {
    initEventListeners();
    
    // Restaurer l'état du lecteur
    await restorePlayerState();
    
    loadView('library');
    audioPlayer.volume = volumeBar.value / 100;
    
    // Sauvegarder avant de fermer la page
    window.addEventListener('beforeunload', () => {
        savePlayerState();
    });
});

// Event listeners
function initEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
            e.target.classList.add('active');
            loadView(e.target.dataset.view);
        });
    });

    // Contrôles lecteur
    btnPlay.addEventListener('click', togglePlay);
    btnPrev.addEventListener('click', playPrevious);
    btnNext.addEventListener('click', playNext);
    
    // Progression
    audioPlayer.addEventListener('timeupdate', updateProgress);
    progressBar.addEventListener('input', seek);
    
    // Volume
    volumeBar.addEventListener('input', (e) => {
        audioPlayer.volume = e.target.value / 100;
    });
    
    // Recherche
    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => search(e.target.value), 300);
    });
    
    // Fin de lecture
    audioPlayer.addEventListener('ended', playNext);
}

// Chargement des vues
async function loadView(viewName) {
    state.currentView = viewName;
    
    switch(viewName) {
        case 'library':
            await loadLibrary();
            break;
        case 'artists':
            await loadArtists();
            break;
        case 'albums':
            await loadAlbums();
            break;
        case 'tracks':
            await loadTracks();
            break;
        case 'playlists':
            await loadPlaylists();
            break;
        case 'queue':
            await loadQueue();
            break;
        case 'stats':
            await loadStats();
            break;
        case 'scan':
            await loadScan();
            break;
    }
}

// Vue bibliothèque
async function loadLibrary() {
    const [topTracks, recentTracks] = await Promise.all([
        fetch(`${API_BASE}/tracks/stats/top?limit=10`).then(r => r.json()),
        fetch(`${API_BASE}/tracks/stats/recent?limit=10`).then(r => r.json())
    ]);
    
    contentView.innerHTML = `
        <div class="section">
            <h2 class="section-title">🔥 Top Écoutes</h2>
            <div class="track-list">
                ${topTracks.map((track, i) => renderTrackItem(track, i)).join('')}
            </div>
        </div>
        <div class="section">
            <h2 class="section-title">🆕 Ajoutés récemment</h2>
            <div class="track-list">
                ${recentTracks.map((track, i) => renderTrackItem(track, i)).join('')}
            </div>
        </div>
    `;
    
    attachTrackListeners();
}

// Vue artistes
async function loadArtists() {
    const artists = await fetch(`${API_BASE}/artists`).then(r => r.json());
    
    contentView.innerHTML = `
        <h2 class="section-title">🎤 Artistes (${artists.length})</h2>
        <div class="grid">
            ${artists.map(artist => `
                <div class="card" data-artist-id="${artist.id}">
                    <div class="card-cover">🎤</div>
                    <div class="card-title">${artist.name}</div>
                    <div class="card-subtitle">${artist.album_count} albums, ${artist.track_count} titres</div>
                </div>
            `).join('')}
        </div>
    `;
    
    document.querySelectorAll('[data-artist-id]').forEach(card => {
        card.addEventListener('click', () => loadArtistDetail(card.dataset.artistId));
    });
}

// Vue albums
async function loadAlbums() {
    const albums = await fetch(`${API_BASE}/albums`).then(r => r.json());
    
    contentView.innerHTML = `
        <h2 class="section-title">💿 Albums (${albums.length})</h2>
        <div class="grid">
            ${albums.map(album => `
                <div class="card" data-album-id="${album.id}">
                    <div class="card-cover">💿</div>
                    <div class="card-title">${album.title}</div>
                    <div class="card-subtitle">${album.artist_name} • ${album.year || '?'}</div>
                </div>
            `).join('')}
        </div>
    `;
    
    document.querySelectorAll('[data-album-id]').forEach(card => {
        card.addEventListener('click', () => loadAlbumDetail(card.dataset.albumId));
    });
}

// Vue pistes (avec pagination)
let currentTracksPage = 1;
const tracksPerPage = 100;

async function loadTracks(page = 1, searchQuery = '') {
    currentTracksPage = page;
    const url = searchQuery 
        ? `${API_BASE}/tracks?search=${encodeURIComponent(searchQuery)}` 
        : `${API_BASE}/tracks?page=${page}&limit=${tracksPerPage}`;
    
    const data = await fetch(url).then(r => r.json());
    
    // Gérer les deux formats possibles de réponse
    const tracks = Array.isArray(data) ? data : (data.tracks || []);
    const total = Array.isArray(data) ? data.length : (data.total || 0);
    
    const totalPages = searchQuery ? 1 : Math.ceil(total / tracksPerPage);
    const displayedCount = tracks.length;
    
    contentView.innerHTML = `
        <h2 class="section-title">🎵 Toutes les pistes ${searchQuery ? '(Recherche)' : `(${total})`}</h2>
        <div style="margin-bottom: 16px;">
            <input type="text" 
                   id="trackSearch" 
                   placeholder="🔍 Rechercher par titre, artiste ou album..." 
                   value="${searchQuery}"
                   style="width: 100%; padding: 12px; background: #282828; border: 1px solid #404040; 
                          border-radius: 4px; color: #fff; font-size: 14px; margin-bottom: 12px;">
            ${searchQuery ? `
                <div style="margin-bottom: 12px;">
                    <span style="color: #1db954; font-weight: bold;">${displayedCount} résultat${displayedCount > 1 ? 's' : ''}</span>
                    <button class="btn" onclick="loadTracks(1, '')" style="margin-left: 12px; background: #404040;">✕ Effacer</button>
                </div>
            ` : ''}
        </div>
        ${!searchQuery ? `
            <div style="margin-bottom: 16px; display: flex; gap: 8px; align-items: center;">
                <button class="btn" onclick="loadTracks(${Math.max(1, page - 1)}, '')" ${page === 1 ? 'disabled' : ''}>◀ Précédent</button>
                <span style="color: #888;">Page ${page} sur ${totalPages}</span>
                <button class="btn" onclick="loadTracks(${Math.min(totalPages, page + 1)}, '')" ${page === totalPages ? 'disabled' : ''}>Suivant ▶</button>
            </div>
        ` : ''}
        <div class="track-list">
            ${tracks.map((track, i) => renderTrackItem(track, searchQuery ? i : (page - 1) * tracksPerPage + i)).join('')}
        </div>
        ${!searchQuery ? `
            <div style="margin-top: 16px; display: flex; gap: 8px; align-items: center;">
                <button class="btn" onclick="loadTracks(${Math.max(1, page - 1)}, '')" ${page === 1 ? 'disabled' : ''}>◀ Précédent</button>
                <span style="color: #888;">Page ${page} sur ${totalPages}</span>
                <button class="btn" onclick="loadTracks(${Math.min(totalPages, page + 1)}, '')" ${page === totalPages ? 'disabled' : ''}>Suivant ▶</button>
            </div>
        ` : ''}
    `;
    
    // Attacher l'événement de recherche
    const searchInput = document.getElementById('trackSearch');
    if (searchInput) {
        // Restaurer la position du curseur si une recherche était en cours
        const cursorPos = searchInput.value.length;
        searchInput.setSelectionRange(cursorPos, cursorPos);
        searchInput.focus();
        
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            const inputValue = e.target.value;
            const cursorPosition = e.target.selectionStart;
            
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                // Sauvegarder la position du curseur dans une variable globale
                window.lastCursorPosition = cursorPosition;
                loadTracks(1, inputValue);
            }, 300); // Délai de 300ms après la dernière frappe
        });
        
        // Restaurer la position du curseur après le chargement
        if (window.lastCursorPosition !== undefined) {
            setTimeout(() => {
                searchInput.setSelectionRange(window.lastCursorPosition, window.lastCursorPosition);
                searchInput.focus();
            }, 10);
        }
    }
    
    attachTrackListeners();
}

// Vue playlists
async function loadPlaylists() {
    const playlists = await fetch(`${API_BASE}/playlists`).then(r => r.json());
    
    contentView.innerHTML = `
        <h2 class="section-title">📋 Playlists</h2>
        <button class="btn" onclick="createPlaylist()">➕ Créer playlist</button>
        <div class="grid">
            ${playlists.map(playlist => `
                <div class="card" data-playlist-id="${playlist.id}">
                    <div class="card-cover">📋</div>
                    <div class="card-title">${playlist.name}</div>
                    <div class="card-subtitle">${playlist.track_count} titres</div>
                </div>
            `).join('')}
        </div>
    `;
    
    document.querySelectorAll('[data-playlist-id]').forEach(card => {
        card.addEventListener('click', () => loadPlaylistDetail(card.dataset.playlistId));
    });
}

// Vue détail d'une playlist
async function loadPlaylistDetail(playlistId) {
    const data = await fetch(`${API_BASE}/playlists/${playlistId}`).then(r => r.json());
    const playlist = data.playlist || data;
    const tracks = data.tracks || [];
    
    contentView.innerHTML = `
        <div style="margin-bottom: 20px;">
            <button class="btn" onclick="loadPlaylists()" style="background: #404040;">← Retour</button>
        </div>
        <h2 class="section-title">📋 ${playlist.name}</h2>
        ${playlist.description ? `<p style="color: #888; margin: -10px 0 20px 0;">${playlist.description}</p>` : ''}
        <div style="margin-bottom: 20px;">
            <span style="color: #888;">${tracks.length} titres</span>
            ${tracks.length > 0 ? `
                <button class="btn" onclick="playPlaylist(${playlistId})" style="margin-left: 10px;">▶️ Tout jouer</button>
                <button class="btn" onclick="addPlaylistToQueue(${playlistId})" style="margin-left: 10px; background: #404040;">➕ Ajouter à la file</button>
            ` : ''}
        </div>
        ${tracks.length === 0 ? '<p>Cette playlist est vide. Faites un clic droit sur une piste pour l\'ajouter.</p>' : `
            <div class="track-list">
                ${tracks.map((track, i) => `
                    <div class="track-item" 
                         data-track-id="${track.id}"
                         ondblclick="playTrackFromPlaylist(${playlistId}, ${i})"
                         oncontextmenu="showPlaylistTrackContextMenu(event, ${playlistId}, ${track.id}); return false;">
                        <div class="track-number">${i + 1}</div>
                        <div class="track-title">${track.title}</div>
                        <div class="track-artist">${track.artist_name}</div>
                        <div class="track-album">${track.album_title}</div>
                        <div class="track-duration">${track.duration ? formatTime(track.duration) : '-'}</div>
                    </div>
                `).join('')}
            </div>
        `}
    `;
}

// Jouer toute une playlist
async function playPlaylist(playlistId) {
    const data = await fetch(`${API_BASE}/playlists/${playlistId}`).then(r => r.json());
    const tracks = data.tracks || [];
    if (tracks.length > 0) {
        state.queue = tracks;
        state.currentIndex = 0;
        playFromQueue(0);
    }
}

// Ajouter une playlist à la file
async function addPlaylistToQueue(playlistId) {
    const data = await fetch(`${API_BASE}/playlists/${playlistId}`).then(r => r.json());
    const tracks = data.tracks || [];
    if (tracks.length > 0) {
        state.queue.push(...tracks);
        showNotification(`✅ ${tracks.length} pistes ajoutées à la file`);
    }
}

// Jouer une piste depuis une playlist
async function playTrackFromPlaylist(playlistId, index) {
    const data = await fetch(`${API_BASE}/playlists/${playlistId}`).then(r => r.json());
    const tracks = data.tracks || [];
    if (tracks.length > 0) {
        state.queue = tracks;
        state.currentIndex = index;
        playFromQueue(index);
    }
}

// Menu contextuel pour piste dans une playlist
function showPlaylistTrackContextMenu(event, playlistId, trackId) {
    event.preventDefault();
    
    // Supprimer un menu existant
    const existing = document.getElementById('contextMenu');
    if (existing) existing.remove();
    
    // Créer le menu contextuel
    const menu = document.createElement('div');
    menu.id = 'contextMenu';
    menu.style.cssText = `
        position: fixed;
        top: ${event.clientY}px;
        left: ${event.clientX}px;
        background: #282828;
        border: 1px solid #404040;
        border-radius: 4px;
        padding: 8px 0;
        z-index: 10000;
        min-width: 200px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.5);
    `;
    
    const options = [
        { label: '➕ Ajouter à la file', action: () => addToQueue(trackId) },
        { label: '▶️ Jouer maintenant', action: () => { state.queue = []; addToQueue(trackId); } },
        { label: '🗑️ Retirer de la playlist', action: () => removeFromPlaylist(playlistId, trackId) },
    ];
    
    options.forEach(opt => {
        const item = document.createElement('div');
        item.textContent = opt.label;
        item.style.cssText = `
            padding: 10px 16px;
            cursor: pointer;
            color: #fff;
            font-size: 14px;
        `;
        item.addEventListener('mouseenter', () => item.style.background = '#404040');
        item.addEventListener('mouseleave', () => item.style.background = 'transparent');
        item.addEventListener('click', () => {
            opt.action();
            menu.remove();
        });
        menu.appendChild(item);
    });
    
    document.body.appendChild(menu);
    
    // Fermer au clic ailleurs
    const closeMenu = (e) => {
        if (!menu.contains(e.target)) {
            menu.remove();
            document.removeEventListener('click', closeMenu);
        }
    };
    setTimeout(() => document.addEventListener('click', closeMenu), 100);
}

// Retirer une piste d'une playlist
async function removeFromPlaylist(playlistId, trackId) {
    if (!confirm('Retirer cette piste de la playlist ?')) return;
    
    try {
        const response = await fetch(`${API_BASE}/playlists/${playlistId}/tracks/${trackId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showNotification('✅ Piste retirée');
            loadPlaylistDetail(playlistId); // Rafraîchir la vue
        } else {
            alert('Erreur lors du retrait');
        }
    } catch (error) {
        alert('Erreur: ' + error.message);
    }
}

// Vue file d'attente
async function loadQueue() {
    contentView.innerHTML = `
        <h2 class="section-title">🎼 File d'attente (${state.queue.length} titres)</h2>
        ${state.queue.length === 0 ? '<p>La file d\'attente est vide</p>' : `
            <button class="btn" onclick="clearQueue()">🗑️ Vider</button>
            <div class="track-list">
                ${state.queue.map((track, i) => `
                    <div class="track-item ${i === state.currentIndex ? 'playing' : ''}" data-queue-index="${i}">
                        <div class="track-number">${i + 1}</div>
                        <div class="track-title">${track.title}</div>
                        <div class="track-artist">${track.artist_name || '-'}</div>
                        <div class="track-album">${track.album_title || '-'}</div>
                        <div class="track-duration">${track.duration ? formatTime(track.duration) : '-'}</div>
                        <button class="btn-icon" onclick="removeFromQueue(${i})">❌</button>
                    </div>
                `).join('')}
            </div>
        `}
    `;
    
    // Click sur une piste de la queue
    document.querySelectorAll('[data-queue-index]').forEach(item => {
        item.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-icon')) return;
            const index = parseInt(item.dataset.queueIndex);
            playFromQueue(index);
        });
    });
}

// Vue scan
async function loadScan() {
    const [status, paths] = await Promise.all([
        fetch(`${API_BASE}/scan/status`).then(r => r.json()),
        fetch(`${API_BASE}/scan/paths`).then(r => r.json())
    ]);
    
    contentView.innerHTML = `
        <h2 class="section-title">🔍 Scanner la bibliothèque</h2>
        
        <div class="section">
            <h3>Chemins configurés</h3>
            <div id="pathsList" style="margin-bottom: 16px;">
                ${paths.paths.length === 0 ? '<p style="color: #888;">Aucun chemin configuré</p>' : ''}
                ${paths.paths.map(p => `
                    <div style="display: flex; align-items: center; gap: 12px; padding: 8px; background: rgba(255,255,255,0.05); border-radius: 4px; margin-bottom: 8px;">
                        <span style="flex: 1;">📁 ${p}</span>
                        <button class="btn-icon" onclick="removeScanPath('${p.replace(/'/g, "\\'")}')">❌</button>
                    </div>
                `).join('')}
            </div>
            <div style="display: flex; gap: 8px;">
                <input type="text" id="newPathInput" placeholder="/chemin/vers/musique" style="flex: 1; padding: 8px; background: rgba(255,255,255,0.1); border: 1px solid #404040; border-radius: 4px; color: #fff;">
                <button class="btn" onclick="openFolderBrowser()">📁 Parcourir</button>
                <button class="btn" onclick="addScanPath()">➕ Ajouter</button>
            </div>
            <p style="color: #888; font-size: 13px; margin-top: 8px;">Formats supportés: ${paths.formats.join(', ')}</p>
        </div>
        
        <div class="section">
            <h3>État du scan</h3>
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-value">${status.scannedFiles}</div>
                    <div class="stat-label">Fichiers scannés</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${status.errors}</div>
                    <div class="stat-label">Erreurs</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${status.isScanning ? '🔄 En cours' : (status.scannedFiles > 0 ? '✅ Terminé' : '⏸️ Aucun scan')}</div>
                    <div class="stat-label">Statut</div>
                </div>
            </div>
            
            ${status.isScanning ? `
                <p>📂 En cours: ${status.currentPath || 'Initialisation...'}</p>
                <button class="btn" disabled>⏳ Scan en cours...</button>
            ` : `
                ${status.scannedFiles > 0 ? `
                    <p style="color: #1db954;">✅ Dernier scan terminé avec succès : ${status.scannedFiles} fichiers traités</p>
                ` : ''}
                <button class="btn" onclick="startScan()">▶️ ${status.scannedFiles > 0 ? 'Relancer le scan' : 'Démarrer le scan'}</button>
            `}
        </div>
    `;
    
    // Rafraîchir automatiquement si un scan est en cours
    if (status.isScanning) {
        setTimeout(() => {
            if (state.currentView === 'scan') {
                loadScan();
            }
        }, 2000);
    }
}

// Ajouter un chemin de scan
async function addScanPath() {
    const input = document.getElementById('newPathInput');
    const newPath = input.value.trim();
    
    if (!newPath) {
        alert('Veuillez entrer un chemin');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/scan/paths/add`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: newPath })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            input.value = '';
            loadScan();
        } else {
            alert(result.error || 'Erreur lors de l\'ajout du chemin');
        }
    } catch (error) {
        alert('Erreur: ' + error.message);
    }
}

// Supprimer un chemin de scan
async function removeScanPath(path) {
    if (!confirm(`Supprimer ce chemin ?\n${path}`)) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/scan/paths/remove`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            loadScan();
        } else {
            alert(result.error || 'Erreur lors de la suppression du chemin');
        }
    } catch (error) {
        alert('Erreur: ' + error.message);
    }
}

// Démarrer le scan
async function startScan() {
    try {
        const response = await fetch(`${API_BASE}/scan/start`, { method: 'POST' });
        const result = await response.json();
        
        if (response.ok) {
            console.log('✅ Scan démarré');
            loadScan();
        } else {
            alert(result.error || 'Erreur lors du démarrage du scan');
        }
    } catch (error) {
        console.error('Erreur scan:', error);
        alert('Erreur lors du démarrage du scan');
    }
}

// Vue statistiques
async function loadStats() {
    const [artists, albums, tracks] = await Promise.all([
        fetch(`${API_BASE}/artists`).then(r => r.json()),
        fetch(`${API_BASE}/albums`).then(r => r.json()),
        fetch(`${API_BASE}/tracks`).then(r => r.json())
    ]);
    
    contentView.innerHTML = `
        <h2 class="section-title">📊 Statistiques de la bibliothèque</h2>
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-value">${artists.length}</div>
                <div class="stat-label">Artistes</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${albums.length}</div>
                <div class="stat-label">Albums</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${tracks.total || 0}</div>
                <div class="stat-label">Titres</div>
            </div>
        </div>
    `;
}

// Détail artiste
async function loadArtistDetail(artistId) {
    const data = await fetch(`${API_BASE}/artists/${artistId}`).then(r => r.json());
    
    contentView.innerHTML = `
        <button class="btn" onclick="loadView('artists')">← Retour</button>
        <h1>🎤 ${data.artist.name}</h1>
        <button class="btn" onclick="playAllArtist(${artistId})" style="background: #1db954; margin: 16px 0;">▶️ Jouer tout</button>
        <div class="section">
            <h2 class="section-title">Albums</h2>
            <div class="grid">
                ${data.albums.map(album => `
                    <div class="card" data-album-id="${album.id}">
                        <div class="card-cover">💿</div>
                        <div class="card-title">${album.title}</div>
                        <div class="card-subtitle">${album.year || '?'}</div>
                    </div>
                `).join('')}
            </div>
        </div>
        <div class="section">
            <h2 class="section-title">Tous les titres (${data.tracks.length})</h2>
            <div class="track-list">
                ${data.tracks.map((track, i) => renderTrackItem(track, i)).join('')}
            </div>
        </div>
    `;
    
    document.querySelectorAll('[data-album-id]').forEach(card => {
        card.addEventListener('click', () => loadAlbumDetail(card.dataset.albumId));
    });
    
    attachTrackListeners();
}

// Détail album
async function loadAlbumDetail(albumId) {
    const data = await fetch(`${API_BASE}/albums/${albumId}`).then(r => r.json());
    
    contentView.innerHTML = `
        <button class="btn" onclick="loadView('albums')">← Retour</button>
        <h1>💿 ${data.album.title}</h1>
        <h3>${data.album.artist_name} • ${data.album.year || '?'}</h3>
        <button class="btn" onclick="playAllAlbum(${albumId})" style="background: #1db954; margin: 16px 0;">▶️ Jouer tout</button>
        <div class="track-list">
            ${data.tracks.map((track, i) => renderTrackItem(track, i)).join('')}
        </div>
    `;
    
    attachTrackListeners();
}

// Rendu d'un élément de piste
function renderTrackItem(track, index) {
    const duration = track.duration ? formatTime(track.duration) : '-';
    return `
        <div class="track-item" data-track-id="${track.id}">
            <div class="track-number">${track.track_number || index + 1}</div>
            <div class="track-title">${track.title}</div>
            <div class="track-artist">${track.artist_name || '-'}</div>
            <div class="track-album">${track.album_title || '-'}</div>
            <div class="track-duration">${duration}</div>
        </div>
    `;
}

// Lecteur audio
function attachTrackListeners() {
    document.querySelectorAll('.track-item').forEach(item => {
        item.addEventListener('click', () => {
            const trackId = item.dataset.trackId;
            playTrack(trackId);
        });
        
        // Menu contextuel (ajout à la queue, playlist, etc.)
        item.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            showTrackContextMenu(e, item.dataset.trackId);
        });
    });
}

async function playTrack(trackId, addToQueue = true) {
    const track = await fetch(`${API_BASE}/tracks/${trackId}`).then(r => r.json());
    
    if (addToQueue) {
        // Ajouter à la queue si pas déjà dedans
        const exists = state.queue.find(t => t.id == trackId);
        if (!exists) {
            state.queue.push(track);
        }
        state.currentIndex = state.queue.findIndex(t => t.id == trackId);
    }
    
    state.currentTrack = track;
    audioPlayer.src = `/stream/${trackId}`;
    audioPlayer.play();
    state.isPlaying = true;
    btnPlay.textContent = '⏸';
    
    document.getElementById('playerTitle').textContent = track.title;
    document.getElementById('playerArtist').textContent = track.artist_name || '-';
    
    // Highlight dans la queue
    updateQueueHighlight();
    
    // Sauvegarder l'état
    savePlayerState();
}

function playFromQueue(index) {
    if (index >= 0 && index < state.queue.length) {
        state.currentIndex = index;
        const track = state.queue[index];
        playTrack(track.id, false);
    }
}

function addToQueue(trackId) {
    fetch(`${API_BASE}/tracks/${trackId}`)
        .then(r => r.json())
        .then(track => {
            state.queue.push(track);
            console.log('✅ Ajouté à la file:', track.title);
            if (state.currentView === 'queue') {
                loadQueue();
            }
        });
}

async function playAllAlbum(albumId) {
    const data = await fetch(`${API_BASE}/albums/${albumId}`).then(r => r.json());
    state.queue = data.tracks;
    state.currentIndex = 0;
    if (data.tracks.length > 0) {
        playTrack(data.tracks[0].id, false);
        console.log(`▶️ Lecture de ${data.tracks.length} titres de l'album`);
    }
}

async function playAllArtist(artistId) {
    const data = await fetch(`${API_BASE}/artists/${artistId}`).then(r => r.json());
    state.queue = data.tracks;
    state.currentIndex = 0;
    if (data.tracks.length > 0) {
        playTrack(data.tracks[0].id, false);
        console.log(`▶️ Lecture de ${data.tracks.length} titres de l'artiste`);
    }
}

function removeFromQueue(index) {
    state.queue.splice(index, 1);
    if (index < state.currentIndex) {
        state.currentIndex--;
    } else if (index === state.currentIndex) {
        // Si on supprime la piste en cours, passer à la suivante
        if (state.queue.length > 0) {
            playFromQueue(Math.min(state.currentIndex, state.queue.length - 1));
        } else {
            audioPlayer.pause();
            state.isPlaying = false;
            state.currentIndex = -1;
        }
    }
    loadQueue();
}

function clearQueue() {
    if (confirm('Vider la file d\'attente ?')) {
        state.queue = [];
        state.currentIndex = -1;
        audioPlayer.pause();
        state.isPlaying = false;
        loadQueue();
    }
}

function updateQueueHighlight() {
    document.querySelectorAll('.track-item.playing').forEach(el => {
        el.classList.remove('playing');
    });
    const currentItem = document.querySelector(`[data-queue-index="${state.currentIndex}"]`);
    if (currentItem) {
        currentItem.classList.add('playing');
    }
}

function togglePlay() {
    if (state.isPlaying) {
        audioPlayer.pause();
        btnPlay.textContent = '▶';
    } else {
        audioPlayer.play();
        btnPlay.textContent = '⏸';
    }
    state.isPlaying = !state.isPlaying;
    savePlayerState();
}

function playPrevious() {
    if (state.currentIndex > 0) {
        playFromQueue(state.currentIndex - 1);
    }
}

function playNext() {
    if (state.shuffle) {
        // Mode aléatoire
        const randomIndex = Math.floor(Math.random() * state.queue.length);
        playFromQueue(randomIndex);
    } else if (state.currentIndex < state.queue.length - 1) {
        playFromQueue(state.currentIndex + 1);
    } else if (state.repeat) {
        // Recommencer au début si répétition activée
        playFromQueue(0);
    }
}

function updateProgress() {
    if (audioPlayer.duration) {
        const progress = (audioPlayer.currentTime / audioPlayer.duration) * 100;
        progressBar.value = progress;
        document.getElementById('currentTime').textContent = formatTime(audioPlayer.currentTime);
        document.getElementById('duration').textContent = formatTime(audioPlayer.duration);
    }
}

function seek(e) {
    const time = (e.target.value / 100) * audioPlayer.duration;
    audioPlayer.currentTime = time;
}

// Recherche
async function search(query) {
    if (!query || query.length < 2) {
        loadView(state.currentView);
        return;
    }
    
    const results = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}`).then(r => r.json());
    
    contentView.innerHTML = `
        <h2 class="section-title">🔍 Résultats pour "${query}"</h2>
        
        ${results.artists.length > 0 ? `
            <div class="section">
                <h3>Artistes</h3>
                <div class="grid">
                    ${results.artists.map(artist => `
                        <div class="card" data-artist-id="${artist.id}">
                            <div class="card-cover">🎤</div>
                            <div class="card-title">${artist.name}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        ` : ''}
        
        ${results.albums.length > 0 ? `
            <div class="section">
                <h3>Albums</h3>
                <div class="grid">
                    ${results.albums.map(album => `
                        <div class="card" data-album-id="${album.id}">
                            <div class="card-cover">💿</div>
                            <div class="card-title">${album.title}</div>
                            <div class="card-subtitle">${album.artist_name}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        ` : ''}
        
        ${results.tracks.length > 0 ? `
            <div class="section">
                <h3>Titres</h3>
                <div class="track-list">
                    ${results.tracks.map((track, i) => renderTrackItem(track, i)).join('')}
                </div>
            </div>
        ` : ''}
        
        ${results.artists.length === 0 && results.albums.length === 0 && results.tracks.length === 0 ? 
            '<p>Aucun résultat trouvé</p>' : ''}
    `;
    
    document.querySelectorAll('[data-artist-id]').forEach(card => {
        card.addEventListener('click', () => loadArtistDetail(card.dataset.artistId));
    });
    
    document.querySelectorAll('[data-album-id]').forEach(card => {
        card.addEventListener('click', () => loadAlbumDetail(card.dataset.albumId));
    });
    
    attachTrackListeners();
}

// Utilitaires
function formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function showTrackContextMenu(event, trackId) {
    // Supprimer un menu existant
    const existing = document.getElementById('contextMenu');
    if (existing) existing.remove();
    
    // Créer le menu contextuel
    const menu = document.createElement('div');
    menu.id = 'contextMenu';
    menu.style.cssText = `
        position: fixed;
        top: ${event.clientY}px;
        left: ${event.clientX}px;
        background: #282828;
        border: 1px solid #404040;
        border-radius: 4px;
        padding: 8px 0;
        z-index: 10000;
        min-width: 200px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.5);
        max-height: 400px;
        overflow-y: auto;
    `;
    
    const options = [
        { label: '➕ Ajouter à la file', action: () => addToQueue(trackId) },
        { label: '▶️ Jouer maintenant', action: () => { state.queue = []; addToQueue(trackId); } },
        { label: '📋 Ajouter à une playlist...', action: () => showPlaylistSelector(trackId) },
    ];
    
    options.forEach(opt => {
        const item = document.createElement('div');
        item.textContent = opt.label;
        item.style.cssText = `
            padding: 10px 16px;
            cursor: pointer;
            color: #fff;
            font-size: 14px;
        `;
        item.addEventListener('mouseenter', () => item.style.background = '#404040');
        item.addEventListener('mouseleave', () => item.style.background = 'transparent');
        item.addEventListener('click', () => {
            opt.action();
            menu.remove();
        });
        menu.appendChild(item);
    });
    
    document.body.appendChild(menu);
    
    // Fermer au clic ailleurs
    const closeMenu = (e) => {
        if (!menu.contains(e.target)) {
            menu.remove();
            document.removeEventListener('click', closeMenu);
        }
    };
    setTimeout(() => document.addEventListener('click', closeMenu), 100);
}

// Sélecteur de playlist pour ajouter une piste
async function showPlaylistSelector(trackId) {
    const playlists = await fetch(`${API_BASE}/playlists`).then(r => r.json());
    
    if (playlists.length === 0) {
        alert('Aucune playlist disponible. Créez-en une d\'abord !');
        return;
    }
    
    // Créer une modale
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10001;
    `;
    
    const content = document.createElement('div');
    content.style.cssText = `
        background: #282828;
        border-radius: 8px;
        padding: 24px;
        max-width: 400px;
        width: 90%;
        max-height: 500px;
        overflow-y: auto;
    `;
    
    content.innerHTML = `
        <h3 style="margin: 0 0 16px 0; color: #fff;">Ajouter à une playlist</h3>
        <div id="playlistList"></div>
        <button class="btn" onclick="this.closest('.modal').remove()" style="margin-top: 16px; background: #404040;">Annuler</button>
    `;
    
    modal.className = 'modal';
    modal.appendChild(content);
    document.body.appendChild(modal);
    
    // Remplir la liste des playlists
    const listContainer = document.getElementById('playlistList');
    playlists.forEach(playlist => {
        const item = document.createElement('div');
        item.style.cssText = `
            padding: 12px;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 4px;
            margin-bottom: 8px;
            cursor: pointer;
            transition: background 0.2s;
        `;
        item.innerHTML = `
            <div style="font-weight: bold; color: #fff;">${playlist.name}</div>
            <div style="color: #888; font-size: 13px;">${playlist.track_count || 0} pistes</div>
        `;
        item.addEventListener('mouseenter', () => item.style.background = 'rgba(255, 255, 255, 0.1)');
        item.addEventListener('mouseleave', () => item.style.background = 'rgba(255, 255, 255, 0.05)');
        item.addEventListener('click', async () => {
            await addTrackToPlaylist(playlist.id, trackId);
            modal.remove();
        });
        listContainer.appendChild(item);
    });
    
    // Fermer au clic sur le fond
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
}

// Ajouter une piste à une playlist
async function addTrackToPlaylist(playlistId, trackId) {
    try {
        const response = await fetch(`${API_BASE}/playlists/${playlistId}/tracks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ track_id: trackId })
        });
        
        if (response.ok) {
            console.log('✅ Piste ajoutée à la playlist');
            // Afficher une notification temporaire
            showNotification('✅ Ajouté à la playlist');
        } else {
            const error = await response.json();
            alert('Erreur: ' + (error.error || 'Impossible d\'ajouter la piste'));
        }
    } catch (error) {
        alert('Erreur: ' + error.message);
    }
}

// Notification temporaire
function showNotification(message) {
    const notif = document.createElement('div');
    notif.textContent = message;
    notif.style.cssText = `
        position: fixed;
        bottom: 100px;
        right: 20px;
        background: #1db954;
        color: white;
        padding: 12px 20px;
        border-radius: 4px;
        z-index: 10002;
        box-shadow: 0 4px 12px rgba(0,0,0,0.5);
        animation: slideIn 0.3s ease-out;
    `;
    document.body.appendChild(notif);
    
    setTimeout(() => {
        notif.style.opacity = '0';
        notif.style.transition = 'opacity 0.3s';
        setTimeout(() => notif.remove(), 300);
    }, 2000);
}

function createPlaylist() {
    const name = prompt('Nom de la playlist:');
    if (name) {
        fetch(`${API_BASE}/playlists`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name })
        }).then(() => loadPlaylists());
    }
}

// Explorateur de dossiers
let currentBrowsePath = null;

async function openFolderBrowser() {
    // Créer la modale
    const modal = document.createElement('div');
    modal.id = 'folderBrowserModal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
    `;
    
    const content = document.createElement('div');
    content.style.cssText = `
        background: #181818;
        border-radius: 8px;
        width: 90%;
        max-width: 700px;
        max-height: 80vh;
        display: flex;
        flex-direction: column;
        border: 1px solid #404040;
    `;
    
    content.innerHTML = `
        <div style="padding: 20px; border-bottom: 1px solid #404040;">
            <h2 style="margin: 0 0 16px 0;">📁 Sélectionner un dossier</h2>
            <div id="browserPath" style="padding: 10px; background: rgba(255,255,255,0.05); border-radius: 4px; font-family: monospace; font-size: 13px;"></div>
        </div>
        <div id="browserContent" style="flex: 1; overflow-y: auto; padding: 16px;"></div>
        <div style="padding: 16px; border-top: 1px solid #404040; display: flex; gap: 12px; justify-content: flex-end;">
            <button class="btn" onclick="closeFolderBrowser()" style="background: #404040;">Annuler</button>
            <button class="btn" onclick="selectCurrentFolder()" style="background: #1db954;">✓ Sélectionner ce dossier</button>
        </div>
    `;
    
    modal.appendChild(content);
    document.body.appendChild(modal);
    
    // Charger le répertoire home par défaut
    await browseTo(null);
}

async function browseTo(path) {
    currentBrowsePath = path;
    
    try {
        const url = path ? `${API_BASE}/scan/browse?path=${encodeURIComponent(path)}` : `${API_BASE}/scan/browse`;
        const response = await fetch(url);
        const data = await response.json();
        
        currentBrowsePath = data.currentPath;
        
        // Afficher le chemin actuel
        document.getElementById('browserPath').textContent = data.currentPath;
        
        // Construire la liste des dossiers
        let html = '';
        
        // Bouton parent si disponible
        if (data.parentPath) {
            html += `
                <div class="folder-item" onclick="browseTo('${data.parentPath.replace(/'/g, "\\'")}')">
                    <span style="font-size: 20px;">⬆️</span>
                    <span style="flex: 1; font-weight: bold;">..</span>
                </div>
            `;
        }
        
        // Liste des sous-dossiers
        if (data.directories.length === 0) {
            html += '<p style="color: #888; text-align: center; padding: 40px;">Aucun sous-dossier</p>';
        } else {
            data.directories.forEach(dir => {
                html += `
                    <div class="folder-item" onclick="browseTo('${dir.path.replace(/'/g, "\\'")}')">
                        <span style="font-size: 20px;">📁</span>
                        <span style="flex: 1;">${dir.name}</span>
                        <span style="color: #888;">›</span>
                    </div>
                `;
            });
        }
        
        document.getElementById('browserContent').innerHTML = html;
    } catch (error) {
        document.getElementById('browserContent').innerHTML = `
            <p style="color: #c41e3a; text-align: center; padding: 40px;">
                ❌ Erreur: ${error.message}
            </p>
        `;
    }
}

function selectCurrentFolder() {
    if (currentBrowsePath) {
        document.getElementById('newPathInput').value = currentBrowsePath;
        closeFolderBrowser();
    }
}

function closeFolderBrowser() {
    const modal = document.getElementById('folderBrowserModal');
    if (modal) {
        modal.remove();
    }
    currentBrowsePath = null;
}
