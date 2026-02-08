console.log("YT Playlist Length Extension (Resume Version) running");

// --------------------- Utility Functions --------------------- //
function timeToSeconds(time) {
  const parts = time.split(":").map(Number);
  if (parts.length === 3) return parts[0]*3600 + parts[1]*60 + parts[2];
  if (parts.length === 2) return parts[0]*60 + parts[1];
  return 0;
}

function formatTime(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  return h > 0 ? `${h}h ${m}m ${s}s` : `${m}m ${s}s`;
}

function removeOldUI() {
  const old = document.getElementById("yt-playlist-time-box");
  if (old) old.remove();
}

function isPlaylistPage() {
  return window.location.href.includes("&list=");
}



// --------------------- Core Functions --------------------- //
function getDurations() {
  const els = document.querySelectorAll(
    "span.ytd-thumbnail-overlay-time-status-renderer"
  );
  const durations = [];
  els.forEach(el => {
    const text = el.textContent.trim();
    if (text) durations.push(text);
  });
  return durations;
}

function getCurrentIndex() {
  const params = new URLSearchParams(window.location.search);
  const index = params.get("index");

  if (!index) return 0;

  // YouTube index is 1-based → convert to 0-based
  return Math.max(parseInt(index) - 1, 0);
}

function getElapsedPlaylistTime() {
  const durations = window.playlistDurations || [];
  if (durations.length === 0) return 0;

  const currentIndex = getCurrentIndex();

  // sum of all videos BEFORE current
  const previousVideosTime = durations
    .slice(0, currentIndex)
    .reduce((sum, d) => sum + d, 0);

  const video = document.querySelector("video");
  const currentProgress = video ? video.currentTime : 0;

  return previousVideosTime + currentProgress;
}

// Display the sidebar UI based on settings
function displayUI(totalSeconds, settings) {
  removeOldUI();

  const panel = document.querySelector("ytd-playlist-panel-renderer");
  if (!panel) return;

  const elapsed = getElapsedPlaylistTime();
  const remaining = Math.max(totalSeconds - elapsed, 0);

  const box = document.createElement("div");
  box.id = "yt-playlist-time-box";
  box.style.padding = "12px";
  box.style.margin = "8px";
  box.style.borderRadius = "12px";
  box.style.fontFamily = "Roboto, Arial";
  box.style.border = "1px solid #303030";
  box.style.background = settings.darkTheme ? "#181818" : "#f5f5f5";
  box.style.color = settings.darkTheme ? "white" : "black";

  let innerHTML = `<div style="font-weight:600; margin-bottom:6px;">⏱ Playlist Time</div>`;
  innerHTML += `<div>Total: ${formatTime(totalSeconds)}</div>`;

  if (settings.speedTimes) {
    innerHTML += `<div>1.25x: ${formatTime(totalSeconds/1.25)}</div>`;
    innerHTML += `<div>1.5x: ${formatTime(totalSeconds/1.5)}</div>`;
    innerHTML += `<div>2x: ${formatTime(totalSeconds/2)}</div>`;
  }

  if (settings.remainingTime) {
    innerHTML += `<div style="margin-top:6px; opacity:0.8;">Remaining: ${formatTime(remaining)}</div>`;
  }

  if(settings.finishesAt) {

    const finish = new Date(Date.now() + remaining * 1000);
    const hours = finish.getHours().toString().padStart(2, '0');
    const minutes = finish.getMinutes().toString().padStart(2, '0');
    innerHTML += `<div style="opacity:0.7;">Finishes at: ${hours}:${minutes}</div>`;
  }

  

  box.innerHTML = innerHTML;
  panel.prepend(box);
}


// --------------------- Main Calculation --------------------- //
let totalSeconds = 0;

async function calculatePlaylist() {
  if (!isPlaylistPage()) return;

  const durations = getDurations();
  if (durations.length === 0) return;

  const durationsInSeconds = durations.map(timeToSeconds);

  totalSeconds = durationsInSeconds.reduce((a,b)=>a+b,0);

  // store globally so UI can use it
  window.playlistDurations = durationsInSeconds;


  // Read settings and display UI immediately
  chrome.storage.local.get(['remainingTime', 'speedTimes', 'darkTheme', 'finishesAt'], (settings) => {
    displayUI(totalSeconds, settings);
  });
}

// --------------------- Live Updates --------------------- //
function updateUI() {
  if (!isPlaylistPage()) {
    removeOldUI();
    return;
  }

  chrome.storage.local.get(['remainingTime', 'speedTimes', 'darkTheme', 'finishesAt'], (settings) => {
    displayUI(totalSeconds, settings);
  });
}

// Live update every second
setInterval(() => {
  updateUI();
}, 1000);

// Listen for storage changes and update instantly
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local") {
    updateUI();
  }
});

// Watch URL changes (SPA) to recalc playlist
let lastUrl = location.href;
setInterval(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    setTimeout(calculatePlaylist, 2000);
  }
}, 1000);

// Initial calculation
setTimeout(calculatePlaylist, 3000);
