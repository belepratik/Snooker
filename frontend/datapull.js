let players = [];
let studioIdToName = {}; // Global map of studio ID to name
let showPlayingNowOnly = false; // To track if "Active Players" should be shown

// DOM Elements
const searchBar = document.getElementById("searchInput");
const searchIcon = document.getElementById("search_icon");
const studioSelect = document.getElementById("studioName");
const playerContainer = document.getElementById("playerContainer");
const loadingContainer = document.getElementById("loadingContainer");
const clubLogoImg = document.getElementById('clubLogo');
const clubBannerImg = document.getElementById('clubBannerImg');
const clubBannerContainer = document.getElementById('clubBannerContainer');


// Toggle Search Bar (for mobile) - add checks for null
if (searchIcon) {
  searchIcon.addEventListener("click", (e) => {
    if (searchBar) {
      searchBar.style.display = "block";
      searchIcon.style.display = "none";
      searchBar.focus();
    }
    e.stopPropagation();
  });
}
if (searchBar) {
  searchBar.style.display = "block";
}
if (searchIcon) {
  searchIcon.style.display = "none";
}

function toggleChampions() {
  const button = document.getElementById('championsButton');
  const isActive = button.getAttribute('data-active') === 'true';

  if (isActive) {
    // Show full list again
    button.setAttribute('data-active', 'false');
    button.classList.remove('btn-primary');
    button.classList.add('btn-outline-primary');
    showAllPlayers(); // Show all players
  } else {
    // Show only champions
    button.setAttribute('data-active', 'true');
    button.classList.remove('btn-outline-primary');
    button.classList.add('btn-primary');
    filterChampions(); // Your existing champion filtering logic
  }
  // Always show the search bar after filtering
  const searchBarOuter = document.querySelector('.searchbar-outer');
  if (searchBarOuter) searchBarOuter.style.display = 'flex';
  if (searchBar) searchBar.style.display = 'block';
}

function filterChampions() {
  const champions = players.filter((p) => p.medals && p.medals.trim() !== "");
  displayPlayers(champions);
}

function showAllPlayers() {
  // Display all players again when "Show All Players" is selected
  displayPlayers(players);
}

// Search Players by Name
function searchTable() {
  const filter = searchBar.value.toUpperCase();
  const cards = document.getElementsByClassName("player-card");

  for (let card of cards) {
    const name = card.querySelector(".player-name").textContent;
    card.style.display = name.toUpperCase().includes(filter) ? "" : "none";
  }
}

// Fetch Studios
async function fetchStudioName() {
  try {
    const res = await fetch("/apis/data/masterstudio");
    const data = await res.json();
    const studioData = data;
    if (studioData && Array.isArray(studioData)) {
      studioData.forEach((row) => {
        studioIdToName[row.Studio] = row.Studio_name;
        // If SQL has an image column, use it
        if (row.bannerImg) {
          studioBannerImages[row.Studio] = row.bannerImg;
        }
        const option = document.createElement("option");
        option.innerText = row.Studio_name;
        option.value = row.Studio;
        studioSelect.appendChild(option);
      });
    }
  } catch (err) {
    console.error("Error fetching studio names:", err);
  }
}

// Fetch Players
async function fetchPlayerData() {
  try {
    // Show loading, hide player container
    document.getElementById('loadingContainer').style.display = 'flex';
    document.getElementById('playerContainer').style.display = 'none';
    
    const res = await fetch("/apis/LeaderboardData/leaderboard");
    const data = await res.json();
    const playerData = data[0];

    if (playerData) {
      players = playerData.map((p, i) => ({
        rank: i + 1,
        name: p.players,
        studio: p.studio,
        coins: p.Coins,
        youtubeLink: p.Link,
        status: p.status,
        city: p.city,
        medals: p.medals,
      }));

      displayPlayers(players);
    }
  } catch (err) {
    console.error("Error fetching player data:", err);
    document.getElementById('loadingMessage').textContent = 
      "Oops! We scratched on this shot. Please try again.";
  } finally {
    // Hide loading, show player container
    document.getElementById('loadingContainer').style.display = 'none';
    document.getElementById('playerContainer').style.display = 'block';
  }
}

// Map studio IDs to banner image URLs (customize as needed)
const studioBannerImages = {
  'studio1': 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=900&q=80',
  'studio2': 'https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=900&q=80',
  // Add more studio IDs and URLs as needed
};

function showClubBanner(studioId) {
  const bannerContainer = document.getElementById('clubBannerContainer');
  const bannerImg = document.getElementById('clubBannerImg');
  // Default image
  let imgUrl = 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=900&q=80';
  // If studioId is present and has a custom image, use it
  if (studioId && studioBannerImages[studioId]) {
    imgUrl = studioBannerImages[studioId];
  }
  bannerImg.src = imgUrl;
  bannerContainer.style.display = studioId ? 'flex' : 'none';
}

// Update club logo
async function updateClubLogo(studio) {
  if (!studio) return;
  try {
    const res = await fetch(`/api/clublogo/${studio}`);
    const data = await res.json();
    if (clubLogoImg && data.clublogo) {
      clubLogoImg.src = data.clublogo;
      clubLogoImg.style.display = 'block';
    } else if (clubLogoImg) {
      clubLogoImg.src = '';
      clubLogoImg.style.display = 'none';
    }
  } catch (err) {
    if (clubLogoImg) {
      clubLogoImg.src = '';
      clubLogoImg.style.display = 'none';
    }
    console.error('Error fetching club logo:', err);
  }
}

async function updateClubBanner(studio) {
  if (!studio) {
    if (clubBannerContainer) clubBannerContainer.style.display = 'none';
    if (clubBannerImg) clubBannerImg.src = '';
    return;
  }
  try {
    const res = await fetch(`/api/clublogo/${studio}`);
    if (!res.ok) {
      if (clubBannerContainer) clubBannerContainer.style.display = 'none';
      if (clubBannerImg) clubBannerImg.src = '';
      return;
    }
    const data = await res.json();
    if (clubBannerImg && data.clublogo) {
      clubBannerImg.src = data.clublogo;
      clubBannerContainer.style.display = 'flex';
    } else {
      clubBannerImg.src = '';
      clubBannerContainer.style.display = 'none';
    }
  } catch (err) {
    if (clubBannerImg) clubBannerImg.src = '';
    if (clubBannerContainer) clubBannerContainer.style.display = 'none';
    console.error('Error fetching club banner:', err);
  }
}

// Filter by Studio
function studioFilter() {
  const studioValue = studioSelect.value;

  studioSelect.classList.toggle("clicked", !!studioValue);
  showClubBanner(studioValue);
  updateClubLogo(studioValue);

  const filteredPlayers = studioValue
    ? players.filter((p) => p.studio === studioValue).map((p, i) => ({ ...p, rank: i + 1 }))
    : [...players];

  displayPlayers(filteredPlayers);
}

// Toggle Playing Now
function togglePlayingNowPlayers() {
  showPlayingNowOnly = document.getElementById("showActivePlayers").checked;

  const cards = document.getElementsByClassName("player-card");
  for (let card of cards) {
    const isPlaying = card.querySelector(".playing-at-club");
    card.style.display = showPlayingNowOnly && !isPlaying ? "none" : "";
  }
  // Always show the search bar after filtering
  const searchBarOuter = document.querySelector('.searchbar-outer');
  if (searchBarOuter) searchBarOuter.style.display = 'flex';
  if (searchBar) searchBar.style.display = 'block';
}

// Display Player Cards
function displayPlayers(playerList) {
  playerContainer.innerHTML = "";
  
  if (playerList.length === 0) {
    playerContainer.innerHTML = '<p class="text-center my-5">No players found</p>';
    return;
  }
  
  playerList.forEach((player) => {
    const card = createPlayerCard(player);
    playerContainer.appendChild(card);
  });

  togglePlayingNowPlayers();
}

// Create Player Card
function createPlayerCard(player) {
  const { rank, name, coins, ggCount, youtubeLink, status, studio, medals, level } = player;
  const studioName = studioIdToName[studio] || studio;

  const card = document.createElement("div");
  card.className = "player-card";


  // Main flex row: left (name, club), right (GG, play)
  const mainRow = document.createElement("div");
  mainRow.className = "player-card-main-row";

  // Left column (name, club)
  const leftCol = document.createElement("div");
  leftCol.className = "player-card-main-left";
  // Player name
  const nameSpan = document.createElement("span");
  nameSpan.className = "player-name";
  nameSpan.title = "View player details / login";
  nameSpan.innerHTML = `${rank}. ${name}`;
  nameSpan.addEventListener("click", () => {
    window.location.assign(`/login?player=${encodeURIComponent(name)}&rank=${rank}&studio_id=${encodeURIComponent(studio)}&studio_name=${encodeURIComponent(studioName)}`);
  });
  leftCol.appendChild(nameSpan);
  // Club name
  const clubSpan = document.createElement("span");
  clubSpan.className = "club-name";
  clubSpan.textContent = studioName;
  leftCol.appendChild(clubSpan);

  // Right column (GG, play)
  const rightCol = document.createElement("div");
  rightCol.className = "player-card-main-right";
  // GG badge
  const ggBadge = document.createElement("span");
  ggBadge.className = "gg-badge";
  ggBadge.textContent = `GG: ${ggCount ?? 0}`;
  rightCol.appendChild(ggBadge);
  // Play button (always show, green if link, grey if not)
  const playBtn = document.createElement(youtubeLink ? "a" : "span");
  playBtn.className = "play-button" + (youtubeLink ? "" : " grey");
  playBtn.innerHTML = youtubeLink
    ? `<svg width="20" height="20" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg"><g clip-path="url(#clip0_1501_5981)"><circle cx="5" cy="5" r="5" fill="#01AB7A"/><path d="M8.4 4.65359C8.66667 4.80755 8.66667 5.19245 8.4 5.34641L3.6 8.11769C3.33333 8.27165 3 8.0792 3 7.77128L3 2.22872C3 1.9208 3.33333 1.72835 3.6 1.88231L8.4 4.65359Z" fill="white"/></g><defs><clipPath id="clip0_1501_5981"><rect width="10" height="10" fill="white"/></clipPath></defs></svg>`
    : `<svg width="20" height="20" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg"><g clip-path="url(#clip0_1501_5981)"><circle cx="5" cy="5" r="5" fill="#888"/><path d="M8.4 4.65359C8.66667 4.80755 8.66667 5.19245 8.4 5.34641L3.6 8.11769C3.33333 8.27165 3 8.0792 3 7.77128L3 2.22872C3 1.9208 3.33333 1.72835 3.6 1.88231L8.4 4.65359Z" fill="#eee"/></g><defs><clipPath id="clip0_1501_5981"><rect width="10" height="10" fill="white"/></clipPath></defs></svg>`;
  if (youtubeLink) {
    playBtn.href = youtubeLink;
    playBtn.target = "_blank";
  }
  rightCol.appendChild(playBtn);

  mainRow.appendChild(leftCol);
  mainRow.appendChild(rightCol);
  card.appendChild(mainRow);

  // Medals, status row (below main)
  const metaRow = document.createElement("div");
  metaRow.className = "player-meta";
  if (medals) {
    const medalsSpan = document.createElement("span");
    medalsSpan.className = "player-medals";
    medalsSpan.textContent = medals;
    metaRow.appendChild(medalsSpan);
  }
  if (status) {
    const statusSpan = document.createElement("span");
    statusSpan.className = "playing-at-club";
    metaRow.appendChild(statusSpan);
    card.classList.add("playing-at-club-border");
  }
  card.appendChild(metaRow);

  // Progress bar (if you want to keep it)
  if (typeof coins === 'number') {
    const bar = document.createElement("div");
    bar.className = "progress-bar";
    const inner = document.createElement("div");
    inner.className = "progress-bar-inner";
    // ...level logic as before...
    const levels = [
      { min: 0, max: 20, color: "#F44336", name: "Beginner" },
      { min: 21, max: 30, color: "#FFEB3B", name: "Bronze" },
      { min: 31, max: 40, color: "#4CAF50", name: "Silver" },
      { min: 41, max: 50, color: "#795548", name: "Gold" },
      { min: 51, max: 60, color: "#2196F3", name: "Platinum" },
      { min: 61, max: 70, color: "#E91E63", name: "Diamond" },
      { min: 71, max: 9999, color: "#000", name: "Black" },
    ];
    let levelName = "";
    for (const lvl of levels) {
      if (coins >= lvl.min && coins <= lvl.max) {
        const percent = ((coins - lvl.min + 1) / (lvl.max - lvl.min + 1)) * 100;
        inner.style.width = `${percent}%`;
        inner.style.backgroundColor = lvl.color;
        levelName = lvl.name;
        break;
      }
    }
    bar.appendChild(inner);
    card.appendChild(bar);
  }

  return card;
}

// Initial Fetches
document.addEventListener("DOMContentLoaded", () => {
  fetchStudioName().then(fetchPlayerData);
  // On initial load, set logo for default studio
  if (studioSelect && studioSelect.value) {
    updateClubLogo(studioSelect.value);
  }
});

// Event Bindings
studioSelect.addEventListener("change", studioFilter);
searchBar.addEventListener("keyup", searchTable);
document.getElementById("showActivePlayers").addEventListener("change", togglePlayingNowPlayers);
document.getElementById("championsButton").addEventListener("click", toggleChampions);
studioSelect.addEventListener('change', (e) => {
  updateClubBanner(e.target.value);
});

// On initial load, set banner for default studio
if (studioSelect && studioSelect.value) {
  updateClubBanner(studioSelect.value);
}