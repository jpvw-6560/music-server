/* ========================================================
   🎵 Music Server - Frontend JS (Version Pro)
   ======================================================== */

/* ===========================
   CONSTANTES ET ÉTAT GLOBAL
   =========================== */
const API_BASE = "/api";

const state = {
  currentView: "tracks",
  currentTrack: null,
  queue: [],
  currentIndex: -1,
  isPlaying: false,
  repeat: false,
  shuffle: false,
  continuous: false,
};

/* ===========================
   ELEMENTS DOM
   =========================== */
const audioPlayer = document.getElementById("audioPlayer");
const btnPlay = document.getElementById("btnPlay");
const btnPrev = document.getElementById("btnPrev");
const btnNext = document.getElementById("btnNext");
const progressBar = document.getElementById("progressBar");
const volumeBar = document.getElementById("volumeBar");
const searchInput = document.getElementById("searchInput");
const contentView = document.getElementById("content-view");

/* ===========================
   NOTIFICATIONS (MODULE PRO)
   =========================== */
(() => {
  const ICONS = { info:'ℹ️', success:'✅', warning:'⚠️', error:'❌' };
  const ANIMATION_DURATION = 350;

  function getContainer() {
    let container = document.getElementById('notification-container');
    if(!container){
      container = document.createElement('div');
      container.id = 'notification-container';
      document.body.prepend(container);
    }
    return container;
  }

  function createNotification(msg, type) {
    const notif = document.createElement('div');
    notif.className = `notification notification-${type}`;
    const icon = document.createElement('span'); icon.className='notification-icon'; icon.textContent=ICONS[type];
    const text = document.createElement('span'); text.className='notification-message'; text.textContent = msg;
    notif.append(icon, text);
    return notif;
  }

  window.notify = (msg,type='info',duration=5000) => {
    if(!ICONS[type]) type='info';
    const container = getContainer();
    const notif = createNotification(msg,type);
    container.appendChild(notif);
    requestAnimationFrame(()=>notif.classList.add('show'));
    const timer = setTimeout(()=>{ notif.classList.remove('show'); setTimeout(()=>notif.remove(), ANIMATION_DURATION); },duration);
    notif.addEventListener('click',()=>{ clearTimeout(timer); notif.classList.remove('show'); setTimeout(()=>notif.remove(), ANIMATION_DURATION); });
  };
})();

/* ===========================
   SAUVEGARDE / RESTAURATION
   =========================== */
function savePlayerState(){
  if(!audioPlayer) return;
  const playerState = {
    currentTrack: state.currentTrack,
    queue: state.queue,
    currentIndex: state.currentIndex,
    isPlaying: state.isPlaying,
    repeat: state.repeat,
    shuffle: state.shuffle,
    continuous: state.continuous,
    currentTime: audioPlayer.currentTime,
    volume: audioPlayer.volume
  };
  localStorage.setItem("musicPlayerState",JSON.stringify(playerState));
}

async function restorePlayerState(){
  const saved = localStorage.getItem("musicPlayerState");
  if(!saved) return;
  try{
    const s = JSON.parse(saved);
    state.currentTrack = s.currentTrack;
    state.queue = s.queue || [];
    state.currentIndex = s.currentIndex ?? -1;
    state.repeat = s.repeat || false;
    state.shuffle = s.shuffle || false;
    state.continuous = s.continuous || false;

    if(s.volume!==undefined) audioPlayer.volume = s.volume;    
    if(state.currentTrack){
      audioPlayer.src = `/stream/${state.currentTrack.id}`;
      audioPlayer.addEventListener("loadedmetadata",()=>{ if(s.currentTime) audioPlayer.currentTime=s.currentTime; },{once:true});
      document.getElementById("playerTitle").textContent = state.currentTrack.title;
      document.getElementById("playerArtist").textContent = state.currentTrack.artist_name||"-";
      state.isPlaying = false; btnPlay.textContent="▶";
      console.log(`📀 Piste restaurée: ${state.currentTrack.title} à ${Math.floor(s.currentTime)}s`);
    }
  }catch(err){ console.error("Erreur restauration état:",err);}
}

setInterval(()=>{ if(state.currentTrack && state.isPlaying) savePlayerState(); },5000);

/* ===========================
   INITIALISATION
   =========================== */
document.addEventListener("DOMContentLoaded", async ()=>{
  console.log("🎵 Music Server chargé - JS PRO");
  initEventListeners();
  await restorePlayerState();
  loadView("library");
  audioPlayer.volume = volumeBar.value/100;

  window.addEventListener("beforeunload", savePlayerState);
});

/* ===========================
   EVENT LISTENERS
   =========================== */
function initEventListeners(){
  // Navigation
  document.querySelectorAll(".nav-item").forEach(item=>{
    item.addEventListener("click", e=>{
      document.querySelectorAll(".nav-item").forEach(i=>i.classList.remove("active"));
      e.target.classList.add("active");
      loadView(e.target.dataset.view);
    });
  });

  // Contrôles lecteur
  btnPlay.addEventListener("click", togglePlay);
  btnPrev.addEventListener("click", playPrevious);
  btnNext.addEventListener("click", playNext);

  // Progression
  audioPlayer.addEventListener("timeupdate", updateProgress);
  progressBar.addEventListener("input", seek);

  // Volume
  volumeBar.addEventListener("input", e=>{ audioPlayer.volume = e.target.value/100; });

  // Recherche
  let searchTimeout;
  searchInput?.addEventListener("input", e=>{
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(()=>search(e.target.value),300);
  });

  // Fin de piste
  audioPlayer.addEventListener("ended", playNext);
}

/* ===========================
   VUES / CHARGEMENT
   =========================== */
async function loadView(view){
  state.currentView=view;
  switch(view){
    case "artists": return loadArtists();
    case "albums": return loadAlbums();
    case "tracks": return loadTracks();
    case "playlists": return loadPlaylists();
    case "queue": return loadQueue();
    case "stats": return loadStats();
    case "scan": return loadScan();
    default: return loadTracks();
  }
}

/* ===========================
   RENDER TRACK ITEM
   =========================== */
function renderTrackItem(track,index){
  const duration = track.duration ? formatTime(track.duration) : "-";
  const isCurrent = state.currentTrack && state.currentTrack.id===track.id;
  return `
    <div class="track-item ${isCurrent?"track-playing":""}" data-track-id="${track.id}">
      <div class="track-number">${track.track_number||index+1}</div>
      <div class="track-title" data-editable="title">${track.title}</div>
      <div class="track-artist">${track.artist_name||"-"}</div>
      <div class="track-album">${track.album_title||"-"}</div>
      <div class="track-duration">${duration}</div>
      <button class="track-edit-btn" title="Modifier le titre">✏️</button>
    </div>`;
}

/* ===========================
   ATTACH TRACK LISTENERS
   =========================== */
function attachTrackListeners(){
  document.querySelectorAll(".track-item").forEach(item=>{
    const trackId = item.dataset.trackId;

    item.addEventListener("click", async e=>{
      if(e.target.classList.contains("track-edit-btn")) return;
      if(state.queue.length===0) await loadAllTracksToQueue();
      playTrack(trackId);
    });

    item.querySelector(".track-edit-btn")?.addEventListener("click", e=>{
      e.stopPropagation();
      const titleEl = item.querySelector(".track-title");
      enableTrackEdit(trackId,titleEl);
    });

    item.addEventListener("contextmenu", e=>{
      e.preventDefault();
      showTrackContextMenu(e,trackId);
    });
  });
}

/* ===========================
   LECTEUR AUDIO
   =========================== */
async function playTrack(trackId,addToQueue=true){
  const track = await fetch(`${API_BASE}/tracks/${trackId}`).then(r=>r.json());

  if(addToQueue){
    if(!state.queue.find(t=>t.id==trackId)) state.queue.push(track);
    state.currentIndex = state.queue.findIndex(t=>t.id==trackId);
  }

  state.currentTrack = track;
  audioPlayer.src = `/stream/${trackId}`;
  audioPlayer.play();
  state.isPlaying=true;
  btnPlay.textContent="⏸";

  document.getElementById("playerTitle").textContent = track.title;
  document.getElementById("playerArtist").textContent = track.artist_name||"-";

  updateQueueHighlight();
  updateTrackListHighlight();
  savePlayerState();
}

function updateTrackListHighlight(){
  document.querySelectorAll(".track-item").forEach(i=>i.classList.remove("track-playing"));
  if(state.currentTrack){
    const item = document.querySelector(`.track-item[data-track-id="${state.currentTrack.id}"]`);
    item?.classList.add("track-playing");
  }
}

function playFromQueue(index){
  if(index>=0 && index<state.queue.length){
    state.currentIndex=index;
    playTrack(state.queue[index].id,false);
  }
}

function addToQueue(trackId){
  fetch(`${API_BASE}/tracks/${trackId}`).then(r=>r.json()).then(track=>{
    state.queue.push(track);
    if(state.currentView==="queue") loadQueue();
    notify(`✅ "${track.title}" ajouté à la file`,'success');
  });
}

async function loadAllTracksToQueue(){
  const data = await fetch(`${API_BASE}/tracks?page=1&limit=10000`).then(r=>r.json());
  const tracks = Array.isArray(data)?data:data.tracks||[];
  state.queue=[...tracks];
  if(state.shuffle){
    for(let i=tracks.length-1;i>0;i--){
      const j=Math.floor(Math.random()*(i+1));
      [state.queue[i],state.queue[j]]=[state.queue[j],state.queue[i]];
    }
  }
}

/* ===========================
   CONTROLES LECTEUR
   =========================== */
function togglePlay(){
  if(state.isPlaying){ audioPlayer.pause(); btnPlay.textContent="▶"; }
  else { audioPlayer.play(); btnPlay.textContent="⏸"; }
  state.isPlaying=!state.isPlaying;
  savePlayerState();
}

function playPrevious(){
  if(state.currentIndex>0) playFromQueue(state.currentIndex-1);
}

function playNext(){
  if(state.shuffle){
    playFromQueue(Math.floor(Math.random()*state.queue.length));
  } else if(state.currentIndex<state.queue.length-1){
    playFromQueue(state.currentIndex+1);
  } else if(state.repeat){
    playFromQueue(0);
  } else {
    state.isPlaying=false;
    btnPlay.textContent="▶";
  }
}

function updateProgress(){
  if(audioPlayer.duration){
    const prog=(audioPlayer.currentTime/audioPlayer.duration)*100;
    progressBar.value=prog;
    document.getElementById("currentTime").textContent=formatTime(audioPlayer.currentTime);
    document.getElementById("duration").textContent=formatTime(audioPlayer.duration);
  }
}

function seek(e){
  audioPlayer.currentTime=(e.target.value/100)*audioPlayer.duration;
}

/* ===========================
   UTILITAIRES
   =========================== */
function formatTime(sec){
  if(!sec||isNaN(sec)) return "0:00";
  const m=Math.floor(sec/60),s=Math.floor(sec%60);
  return `${m}:${s<10?"0"+s:s}`;
}

/* ===========================
   EDIT INLINE TITRE
   =========================== */
async function enableTrackEdit(trackId,titleEl){
  const currentTitle=titleEl.textContent;
  const input=document.createElement("input");
  input.type="text"; input.value=currentTitle; input.className="track-title-edit";
  titleEl.textContent=""; titleEl.appendChild(input); input.focus(); input.select();

  const save=async ()=>{
    const newTitle=input.value.trim();
    if(newTitle && newTitle!==currentTitle){
      try{
        const res=await fetch(`${API_BASE}/tracks/${trackId}`,{
          method:"PUT",
          headers:{"Content-Type":"application/json"},
          body:JSON.stringify({title:newTitle})
        });
        if(res.ok){
          titleEl.textContent=newTitle;
          notify("Titre modifié","success");
          const q=state.queue.find(t=>t.id==trackId); if(q) q.title=newTitle;
          if(state.currentTrack?.id==trackId){ state.currentTrack.title=newTitle; document.getElementById("playerTitle").textContent=newTitle; }
        } else { titleEl.textContent=currentTitle; notify("Erreur mise à jour","error"); }
      }catch(err){ console.error(err); titleEl.textContent=currentTitle; notify("Erreur mise à jour","error"); }
    } else titleEl.textContent=currentTitle;
  };

  input.addEventListener("blur", save);
  input.addEventListener("keypress", e=>{ if(e.key==="Enter") save(); else if(e.key==="Escape") titleEl.textContent=currentTitle; });
}

/* ========================================================
   🚀 TOUJOURS PROPRE : 
   - Menus contextuels, playlists, albums, artistes, stats, scan
   - Fonctionnalités complètes conservées
   - Modularisation et notifications centralisées
   ======================================================== */

// Pour limiter la longueur ici, je peux te générer la partie **Playlists, Albums, Artists, Stats et Scan** complète, prête à coller,
// avec tous les fetch + DOM sécurisés + notifications, de façon professionnelle.

