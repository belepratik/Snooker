let players = [];
let studioIdToName = {}; // Global map of studio ID to name
let showPlayingNowOnly = false; // To track if "Active Players" should be shown

// DOM Elements
const searchBar = document.getElementById("searchInput");
const searchIcon = document.getElementById("search_icon");
const studioSelect = document.getElementById("studioName");
const playerContainer = document.getElementById("playerContainer");
const loadingContainer = document.getElementById("loadingContainer");

// Toggle Search Bar (for mobile)
searchIcon.addEventListener("click", (e) => {
  searchBar.style.display = "block";
  searchIcon.style.display = "none";
  searchBar.focus();
  e.stopPropagation();
});
document.addEventListener("click", () => {
  if (window.innerWidth < 600) {
    searchBar.style.display = "none";
    searchIcon.style.display = "block";
  }
});
searchBar.addEventListener("click", (e) => e.stopPropagation());

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
    const studioData = data[0];

    if (studioData) {
      studioData.forEach((row) => {
        studioIdToName[row.Studio] = row.Studio_name;

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

// Filter by Studio
function studioFilter() {
  const studioValue = studioSelect.value;

  studioSelect.classList.toggle("clicked", !!studioValue);

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
  const { rank, name, coins, youtubeLink, status, studio, medals } = player;
  const studioName = studioIdToName[studio] || studio;

  const card = document.createElement("div");
  card.className = "player-card";

  const info = document.createElement("div");
  info.className = "player-info";

  const nameSpan = document.createElement("span");
  nameSpan.className = "player-name";
  nameSpan.innerHTML = `${rank}. ${name} ${medals ? medals : ''}<br><span class="club-name">${studioName}</span>`;
  nameSpan.addEventListener("click", () => {
    window.location.assign(`/login?player=${encodeURIComponent(name)}&rank=${rank}&studio_id=${encodeURIComponent(studio)}&studio_name=${encodeURIComponent(studioName)}`);
  });
  
  info.appendChild(nameSpan);

  if (youtubeLink) {
    const playBtn = document.createElement("a");
    playBtn.href = youtubeLink;
    playBtn.target = "_blank";
    playBtn.className = "play-button";
    playBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g clip-path="url(#clip0_1501_5981)">
        <circle cx="5" cy="5" r="5" fill="#01AB7A"/>
        <path d="M8.4 4.65359C8.66667 4.80755 8.66667 5.19245 8.4 5.34641L3.6 8.11769C3.33333 8.27165 3 8.0792 3 7.77128L3 2.22872C3 1.9208 3.33333 1.72835 3.6 1.88231L8.4 4.65359Z" fill="white"/>
      </g>
      <defs>
        <clipPath id="clip0_1501_5981">
          <rect width="10" height="10" fill="white"/>
        </clipPath>
      </defs>
    </svg>`;
    info.appendChild(playBtn);
  }

  if (status) {
    const statusSpan = document.createElement("span");
    statusSpan.className = "playing-at-club";
    info.appendChild(statusSpan);
    card.classList.add("playing-at-club-border");
  }

  const coinsSpan = document.createElement("span");
  coinsSpan.className = "player-coins";
  coinsSpan.textContent = `S+: ${coins}`;
  info.appendChild(coinsSpan);

  card.appendChild(info);

  if (coins > 70) {
    card.classList.add("black-level-card");
  } else {
    const bar = document.createElement("div");
    bar.className = "progress-bar";

    const inner = document.createElement("div");
    inner.className = "progress-bar-inner";

    const levels = [
      { min: 0, max: 20, color: "#F44336" },
      { min: 21, max: 30, color: "#FFEB3B" },
      { min: 31, max: 40, color: "#4CAF50" },
      { min: 41, max: 50, color: "#795548" },
      { min: 51, max: 60, color: "#2196F3" },
      { min: 61, max: 70, color: "#E91E63" },
    ];

    for (const lvl of levels) {
      if (coins >= lvl.min && coins <= lvl.max) {
        const percent = ((coins - lvl.min + 1) / (lvl.max - lvl.min + 1)) * 100;
        inner.style.width = `${percent}%`;
        inner.style.backgroundColor = lvl.color;
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
});

// Event Bindings
studioSelect.addEventListener("change", studioFilter);
searchBar.addEventListener("keyup", searchTable);