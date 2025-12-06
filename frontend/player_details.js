
const loaderInstance = new FullScreenLoader();
let transactionsModal = null;
let clubModal = null;

// Utility: Player level color map with names
const LEVEL_COLORS = [
  { min: 0, max: 20, bg: "#bd372e", text: "#fff", name: "Rookie" }, // Red
  { min: 21, max: 30, bg: "#FFEB3B", text: "#000", name: "Novice" }, // Yellow
  { min: 31, max: 40, bg: "#4CAF50", text: "#fff", name: "Challenger" }, // Green
  { min: 41, max: 50, bg: "#795548", text: "#fff", name: "Competitor" }, // Brown
  { min: 51, max: 60, bg: "#2196F3", text: "#fff", name: "Expert" }, // Blue
  { min: 61, max: 70, bg: "#E91E63", text: "#fff", name: "Master" }, // Pink
  { min: 71, max: 9999, bg: "#000000", text: "#fff", name: "Legend" }, // Black
];

function getLevelColor(coins) {
  coins = parseInt(coins || 0);
  for (const lvl of LEVEL_COLORS) {
    if (coins >= lvl.min && coins <= lvl.max) return lvl;
  }
  return LEVEL_COLORS[0];
}

// Utility: Show error message
function showError(msg) {
  alert(msg || "An error occurred. Please try again.");
}

function initClient() {
  const urlParams = new URLSearchParams(window.location.search);
  const playerName = urlParams.get("player");
  const studioId = urlParams.get("studio_id");
  if (!playerName || !studioId) {
    showError("Player name or studio ID not provided.");
    return;
  }
  // Cache DOM
  const seeTransactionsBtn = document.getElementById("seeTransactions");
  const myClubBtn = document.getElementById("myClubBtn");
  const notificationBtn = document.getElementById("notificationBtn");
  transactionsModal = new bootstrap.Modal(document.getElementById("transactionsModal"), { backdrop: "static" });
  clubModal = new bootstrap.Modal(document.getElementById("clubModal"), { backdrop: "static" });
  // Click handlers
  seeTransactionsBtn?.addEventListener("click", async (e) => {
    e.preventDefault();
    await fetchTransactions(playerName, studioId);
    transactionsModal.show();
  });
  myClubBtn?.addEventListener("click", async (e) => {
    e.preventDefault();
    try {
      await fetchClubPlayers(studioId);
      clubModal.show();
    } catch (error) {
      showError("Failed to load club data");
    }
  });
  notificationBtn?.addEventListener("click", () => {
    alert("No new notifications.");
  });
  // Load initial data
  fetchStudio(playerName, studioId);
  fetchRankInfo(playerName);
}

async function fetchClubPlayers(studioId) {
  try {
    loaderInstance.showLoader();

    const response = await fetch(
      `/apis/data/leaderboard?studio=${encodeURIComponent(studioId)}&active=1&limit=50`
    );
    let data;
    try {
      data = await response.json();
    } catch (jsonErr) {
      console.error("Failed to parse club players response as JSON", jsonErr);
      throw new Error("Invalid server response");
    }
    if (!response.ok) {
      console.error("Backend error response:", data);
      throw new Error(`HTTP error! status: ${response.status} - ${data && data.msg ? data.msg : ''}`);
    }
    // Expecting data to be an array of players
    if (!Array.isArray(data)) {
      console.error("Unexpected club players response:", data);
      throw new Error("Unexpected server response format");
    }
    if (data.length === 0) {
      throw new Error("No player data received");
    }
    displayClubPlayers(data, studioId);
    return data;
  } catch (error) {
    console.error("Error fetching club players:", error);
    document.getElementById("clubPlayersTable").innerHTML = `
      <tr>
        <td colspan="4" class="text-center text-danger">
          Failed to load club players. ${error.message ? error.message : ''}
        </td>
      </tr>`;
    throw error;
  } finally {
    loaderInstance.hideLoader();
  }
}

function displayClubPlayers(players, studioId) {
  const tableBody = document.getElementById("clubPlayersTable");
  tableBody.innerHTML = "";

  if (!players || (Array.isArray(players) && players.length === 0)) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="4" class="text-center">
          No players found in this club
        </td>
      </tr>`;
    return;
  }

  // Filter players by studio and positive coins
  const filteredPlayers = players.filter(
    (player) => player.studio === studioId && Number(player.Coins) > 0
  );

  if (filteredPlayers.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="4" class="text-center">
          No active players found in this club
        </td>
      </tr>`;
    return;
  }

  // Sort by coins (descending)
  filteredPlayers.sort((a, b) => (b.Coins || 0) - (a.Coins || 0));

  const currentPlayerElement = document.getElementById("playerName");
  const currentPlayerName = currentPlayerElement?.innerText?.trim();

  filteredPlayers.forEach((player, index) => {
    const row = document.createElement("tr");
    const playerName = player.Players || player.players || "Unknown";
    const isCurrentPlayer =
      currentPlayerName && playerName === currentPlayerName;

    if (isCurrentPlayer) {
      row.classList.add("table-primary");
    }

    row.innerHTML = `
      <td class="club-player-rank">${index + 1}</td>
      <td class="club-player-name">${playerName}</td>
      <td class="club-player-coins">${player.Coins || 0}</td>
      <td>${player.win_rate || 0}%</td>
    `;

    tableBody.appendChild(row);
  });
}

function fetchStudio(playerName, studioId) {
  let url = `apis/playerData/masterplayer/${playerName}?studio=${studioId}`;
  fetch(url)
    .then((response) => response.json())
    .then((data) => {
      const row = data[0];
      if (!row) {
        console.error("Player data not found.");
        return;
      }
      const payOnline = row.onlinePay;
      if (payOnline) {
        const playerInfo = document.getElementById("playerInfo");
        if (playerInfo) {
          const payButton = document.createElement("button");
          payButton.className = "paybtn";
          payButton.innerText = "Pay Balance";
          payButton.onclick = payBalance;
          playerInfo.appendChild(payButton);
        }
      }

      displayPlayerInfo(row);
      fetchFrames(playerName, studioId);
    })
    .catch((error) => console.error("Error fetching studio data:", error));
}

// if(studioId && playerName){
async function payBalance() {
  // 1️⃣ Create order from backend
  const orderRes = await fetch("/payment/createOrder", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  const orderData = await orderRes.json();

  if (!orderData.success) {
    alert("Order creation failed: " + orderData.message);
    return;
  }

  const { id: orderId, amount, currency } = orderData.order;

  // 2️⃣ Open Razorpay Checkout
  const options = {
    key: "rzp_live_RArkinhXCdXlnG", // Replace with your key_id
    amount: amount,
    currency: currency,
    name: "My Course Platform",
    description: "Course Payment",
    order_id: orderId,
    handler: async function (response) {
      // 3️⃣ Verify payment with backend
      const verifyRes = await fetch("/payment/verifyOrder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: response.razorpay_order_id,
          paymentId: response.razorpay_payment_id,
          signature: response.razorpay_signature,
        }),
      });
      const verifyData = await verifyRes.json();
      if (verifyData.success) {
        alert("✅ Payment Successful!");
      } else {
        alert("❌ Payment Verification Failed");
      }
    },
    theme: { color: "#528FF0" },
  };

  const rzp = new Razorpay(options);
  rzp.open();
}

function fetchFrames(playerName, studio) {
  let url = `apis/data/frames/frames?studio=${encodeURIComponent(studio)}`;
  loaderInstance.showLoader();
  fetch(url)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      if (!data || !Array.isArray(data) || data.length === 0) {
        throw new Error("No frame data received");
      }

      const frames = data;
      loaderInstance.hideLoader();
      const playerFrame = frames.filter(
        (frame) =>
          frame &&
          [frame.P1, frame.P2, frame.P3, frame.P4, frame.P5, frame.P6].some(
            (player) => player && player === playerName
          )
      );

      if (playerFrame.length > 0) {
        displayFramesInfo(playerFrame, playerName);
      } else {
        console.log(`No frames found for player in ${studio}.`);
      }
    })
    .catch((error) => {
      console.error("Error fetching frame data:", error);
      loaderInstance.hideLoader();
    });
}

async function fetchRankInfo(playerName) {
  try {
    let url = `apis/playerData/leaderboard/${playerName}`;
    const response = await fetch(url);
    const data = await response.json();
    let row = data[0];
    if (row) {
      displayRankInfo(row);
    } else {
      showError("Rank info not found.");
    }
  } catch (error) {
    showError("Error fetching rank data");
  }
}

function displayPlayerInfo(playerInfo) {
  if (!playerInfo) return;

  document.getElementById("playerName").innerText =
    playerInfo.Players || "Unknown";
  const totalMoneyElement = document.getElementById("totalMoney");
  totalMoneyElement.innerText = `Balance: ₹ ${playerInfo.Total || 0}`;

  const nfcLockToggle = document.getElementById("nfcLockToggle");
  if (nfcLockToggle) {
    nfcLockToggle.checked = playerInfo.nfcOption === 1;
  }

  if (parseInt(playerInfo.Total || 0) > 0) {
    totalMoneyElement.classList.add("positive");
  } else {
    totalMoneyElement.classList.remove("positive");
  }

  if (parseInt(playerInfo.Total || 0) > 2000) {
    document.getElementById("warning").style.display = "block";
  } else {
    document.getElementById("warning").style.display = "none";
  }
}

function truncateName(name) {
  if (!name) return "";
  return name.length > 10 ? name.substring(0, 10) + "..." : name;
}


// Pagination state
let allPlayerFrames = [];
let framesPage = 0;
const FRAMES_PER_PAGE = 10;

function displayFramesInfoPaginated(playerName, reset = false) {
  const framesContainer = document.getElementById("framesInfo");
  const loadMoreBtn = document.getElementById("loadMoreFramesBtn");
  if (!framesContainer) return;

  if (reset) {
    framesContainer.innerHTML = "";
    framesPage = 0;
  }

  // Calculate which frames to show
  const startIdx = framesPage * FRAMES_PER_PAGE;
  const endIdx = startIdx + FRAMES_PER_PAGE;
  const framesToShow = allPlayerFrames.slice(startIdx, endIdx);

  if (framesToShow.length === 0 && framesPage === 0) {
    framesContainer.innerHTML = '<div class="text-center">No frame data available</div>';
    loadMoreBtn.style.display = "none";
    return;
  }

  // Find latest 10 frames with share for highlighting
  const framesWithShare = allPlayerFrames.filter((frame) => {
    if (!frame) return false;
    for (let i = 1; i <= 10; i++) {
      const lpKey = i < 10 ? `LP0${i}` : `LP${i}`;
      if (frame[lpKey] === playerName) {
        return true;
      }
    }
    return false;
  });
  const latestShareFrames = framesWithShare.slice(0, 10);

  framesToShow.forEach((frame) => {
    if (!frame) return;
    // ... (copy the original frame rendering logic here, unchanged) ...
    // --- BEGIN FRAME RENDER LOGIC ---
    const frameElement = document.createElement("div");
    frameElement.className = "frame-card";

    const dateStr = frame.StartTime
      ? new Date(frame.StartTime).toLocaleDateString()
      : "N/A";
    const timeStr = frame.StartTime
      ? new Date(frame.StartTime).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "N/A";
    const durationStr = frame.Duration ? `${frame.Duration} min` : "N/A";
    const winner = frame.Winner || "";
    const loser = frame.Looser || "";

    const lpPayers = [];
    for (let i = 1; i <= 10; i++) {
      const lpKey = i < 10 ? `LP0${i}` : `LP${i}`;
      if (frame[lpKey] && frame[lpKey].trim() !== "") {
        lpPayers.push(frame[lpKey]);
      }
    }

    const playerPositions = ["P1", "P2", "P3", "P4", "P5", "P6"].filter(
      (pos) => frame[pos] === playerName
    );
    const isDuplicatePlayer = playerPositions.length > 1;

    const showShare = latestShareFrames.includes(frame);
    let frameShare = 0;
    if (showShare) {
      for (let i = 1; i <= 10; i++) {
        const lpKey = i < 10 ? `LP0${i}` : `LP${i}`;
        if (frame[lpKey] === playerName) {
          frameShare = parseInt(frame.Share) || 0;
          break;
        }
      }
    }

    const mainPlayers = [
      frame.P1,
      frame.P2,
      frame.P3,
      frame.P4,
      frame.P5,
      frame.P6,
    ].filter((p) => p && p.trim() !== "");
    const allPlayers = [...new Set([...mainPlayers, ...lpPayers])];
    const isRummy = allPlayers.length > 2;

    if (isDuplicatePlayer) {
      frameElement.classList.add("duplicate-player");
      frameElement.innerHTML = `
              <div class="line1">
                  <span>📅 ${dateStr} 🕒 ${timeStr} ⏱️ ${durationStr}</span>
              </div>
             <div class="duplicate-charge-notice">
  <div class="notice-header">
    <span class="notice-icon">⚠️</span>
    Table charges applied to your account
  </div>
  <div class="player-matchup">
    <span class="player-name">${playerName}</span>
    <span class="vs">vs</span>
    <span class="player-name">${playerName}</span>
  </div>
</div>
              <div class="line3">
                  ${
                    showShare
                      ? `<span>💰 Table Charges: ₹${frameShare}</span>`
                      : ""
                  }
              </div>
          `;
    } else if (isRummy) {
      frameElement.classList.add("rummy");
      const isWinner = winner === playerName;

      frameElement.innerHTML = `
              <div class="line1">
                  <span>📅 ${dateStr} 🕒 ${timeStr} ⏱️ ${durationStr}</span>
              </div>
              <div class="line2">
                  <span>🃏 Rummy (${allPlayers.length}p)</span>
              </div>
              <div class="players-grid">
                  ${allPlayers
                    .map((player) => {
                      const isYou = player === playerName;
                      const isWinnerPlayer = player === winner;
                      const isPayerPlayer = lpPayers.includes(player);
                      return `
                      <div class="player ${isYou ? "you" : ""} ${
                        isPayerPlayer ? "payer" : ""
                      }">
                          ${truncateName(player)} ${isWinnerPlayer ? "👑" : ""}
                      </div>`;
                    })
                    .join("")}
              </div>
              <div class="line3">
                  ${
                    showShare
                      ? `<span>💰 Table Charges: ₹${frameShare}</span>`
                      : ""
                  }
              </div>
          `;
    } else {
      const isWinner = winner === playerName;
      const isTie = winner === "Tie";
      let opponentName = isTie
        ? frame.P1 === playerName
          ? frame.P2
          : frame.P1
        : isWinner
        ? loser
        : winner;

      frameElement.classList.add(
        isWinner ? "winner" : isTie ? "tie-grey" : "loser"
      );

      // GG logic
      const gg1 = frame.gg1;
      const gg2 = frame.gg2;
      let ggState = "grey"; // default
      let canSendGG = false;
      let ggTooltip = "Send GG to opponent";
      // Determine if current player is P1 or P2
      let isP1 = frame.P1 === playerName;
      let isP2 = frame.P2 === playerName;
      let opponent = isP1 ? frame.P2 : frame.P1;
      // Only show GG for 1v1
      if (isP1 || isP2) {
        if ((isP1 && gg1 === playerName) || (isP2 && gg2 === playerName)) {
          // User already sent GG
          if ((isP1 && gg2 === opponent) || (isP2 && gg1 === opponent)) {
            ggState = "gold"; // both sent
            ggTooltip = "Both sent GG!";
          } else {
            ggState = "green"; // user sent
            ggTooltip = "You sent GG";
          }
        } else if ((isP1 && gg2 === opponent) || (isP2 && gg1 === opponent)) {
          ggState = "grey"; // opponent sent, user not sent
          canSendGG = true;
          ggTooltip = "Opponent sent GG. Send yours!";
        } else {
          ggState = "grey";
          canSendGG = true;
        }
      }

      // GG icon with thumbs up emoji and color logic
      const ggIcons = {
        grey: `<span class="gg-icon" style="font-size: 1.5rem; background: #aaa2; border-radius: 50%; padding: 2px 6px;">👍</span>` ,
        green: `<span class="gg-icon" style="font-size: 1.5rem; background: #4caf5022; border-radius: 50%; padding: 2px 6px;">👍</span>` ,
        gold: `<span class="gg-icon" style="font-size: 1.5rem; background: #FFD70022; border-radius: 50%; padding: 2px 6px;">👍</span>`
      };

      frameElement.innerHTML = `
              <div class="line1">
                  <span>📅 ${dateStr} 🕒 ${timeStr} ⏱️ ${durationStr}</span>
              </div>
              <div class="line2">
                  <span>👤 vs ${truncateName(opponentName)}</span>
                  <span>Coins ${isTie ? "±0" : isWinner ? "+" : "-"}${
        isWinner
          ? frame.LooserStake || 0
          : Math.floor((frame.LooserStake || 0) / 2)
      }</span>
                  ${(isP1 || isP2) ? `<span class="gg-btn-wrapper" title="${ggTooltip}">
                    <button class="gg-btn" data-frame-id="${frame.FrameID}" data-from-player="${playerName}" data-to-player="${opponent}" ${!canSendGG ? "disabled" : ""} style="background: none; border: none; cursor: pointer; padding: 0;">${ggIcons[ggState]}</button>
                  </span>` : ""}
              </div>
              <div class="line3">
                  ${
                    showShare
                      ? `<span>💰 Table Charges: ₹${frameShare}</span>`
                      : ""
                  }
              </div>
          `;

      // Add click handler for GG button
      if ((isP1 || isP2) && canSendGG) {
        const ggBtn = frameElement.querySelector(".gg-btn");
        if (ggBtn) {
          ggBtn.addEventListener("click", function(e) {
            e.preventDefault();
            // Placeholder: call sendGG API here
            alert(`Send GG: frame ${frame.FrameID}, from ${playerName} to ${opponent}`);
          });
        }
      }
    }

    framesContainer.appendChild(frameElement);
    // --- END FRAME RENDER LOGIC ---
  });

  // Show/hide Load More button
  if (endIdx < allPlayerFrames.length) {
    loadMoreBtn.style.display = "block";
  } else {
    loadMoreBtn.style.display = "none";
  }
}

// Patch fetchFrames to use pagination
function fetchFrames(playerName, studio) {
  let url = `apis/data/frames/frames?studio=${encodeURIComponent(studio)}`;
  loaderInstance.showLoader();
  fetch(url)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      if (!data || !Array.isArray(data) || data.length === 0) {
        throw new Error("No frame data received");
      }

      // Sort and filter frames for this player
      const frames = data;
      loaderInstance.hideLoader();
      const playerFrame = frames.filter(
        (frame) =>
          frame &&
          [frame.P1, frame.P2, frame.P3, frame.P4, frame.P5, frame.P6].some(
            (player) => player && player === playerName
          )
      ).reverse();

      allPlayerFrames = playerFrame;
      displayFramesInfoPaginated(playerName, true);
    })
    .catch((error) => {
      console.error("Error fetching frame data:", error);
      loaderInstance.hideLoader();
    });
}

// Attach Load More button handler
document.addEventListener("DOMContentLoaded", function() {
  const loadMoreBtn = document.getElementById("loadMoreFramesBtn");
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener("click", function() {
      framesPage++;
      const urlParams = new URLSearchParams(window.location.search);
      const playerName = urlParams.get("player");
      displayFramesInfoPaginated(playerName);
    });
  }
});

function displayRankInfo(rankInfo) {
  if (!rankInfo) return;
  const urlParams = new URLSearchParams(window.location.search);
  const rank = urlParams.get("rank") || "-";
  document.getElementById("playerRank").innerText = `Rank: ${rank}`;
  const winRate = rankInfo.win_rate ? Math.round(Number(rankInfo.win_rate)) : 0;
  document.getElementById("winRate").innerText = `Win Rate: ${winRate}%`;
  // Set color by level
  const coins = parseInt(rankInfo.Coins || 0);
  const { bg: playercardColor, text: textColor, min, max, name: levelName } = getLevelColor(coins);
  const playerCard = document.getElementById("playerCard");
  if (playerCard) {
    playerCard.style.backgroundColor = playercardColor;
    playerCard.style.color = textColor;
  }
  // Show level name above progress bar
  let levelNameElem = document.getElementById("playerLevelName");
  if (levelNameElem) {
    levelNameElem.textContent = `Level: ${levelName}`;
  }
  // Set GG received count
  const ggCount = rankInfo.gg_count || 0;
  const ggCountElem = document.getElementById("ggCount");
  if (ggCountElem) {
    ggCountElem.innerText = ggCount;
  }
  // Update progress bar
  const progressBar = document.getElementById("playerProgressBar");
  if (progressBar) {
    // Calculate progress within current level range
    let progress = 0;
    if (typeof min !== 'undefined' && typeof max !== 'undefined' && max > min) {
      progress = ((coins - min) / (max - min)) * 100;
      progress = Math.max(0, Math.min(progress, 100));
    }
    progressBar.style.width = progress + "%";
    progressBar.setAttribute("aria-valuenow", progress);
    progressBar.setAttribute("aria-valuemin", 0);
    progressBar.setAttribute("aria-valuemax", 100);
  }
}

let nfcToggle = document.getElementById("nfcLockToggle");
if (nfcToggle) {
  nfcToggle.addEventListener("click", (e) => {
    const urlParams = new URLSearchParams(window.location.search);
    const studioId = urlParams.get("studio_id");
    const playerName = urlParams.get("player");

    lockNfcOnly(e.target.checked, playerName, studioId);
  });
}

async function lockNfcOnly(isLocked, playerName, studioId) {
  try {
    loaderInstance.showLoader();
    const response = await fetch("/player/nfcOption", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nfcOption: isLocked,
        playerName: playerName,
        studioId: studioId,
      }),
    });

    if (!response.ok) throw new Error("Failed to update");
    loaderInstance.hideLoader();
  } catch (error) {
    console.error("Error:", error);
    loaderInstance.hideLoader();
    const nfcLockToggle = document.getElementById("nfcLockToggle");
    if (nfcLockToggle) {
      nfcLockToggle.checked = !isLocked;
    }
  }
}

function formatTransactionDate(dateString) {
  if (!dateString) return "N/A";
  const options = {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  };
  return new Date(dateString).toLocaleString(undefined, options);
}

async function fetchTransactions(playerName, studioId) {
  try {
    loaderInstance.showLoader();
    // Use new backend endpoint for fast filtered fetch
    const response = await fetch(`/player/topup?player=${encodeURIComponent(playerName)}&studio=${encodeURIComponent(studioId)}&limit=5`);
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    const playerTransactions = await response.json();
    displayTransactions(playerTransactions);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    document.getElementById("transactionsTable").innerHTML = `
      <tr>
        <td colspan="3" class="text-center text-danger">
          Failed to load transactions. Please try again later.
        </td>
      </tr>`;
  } finally {
    loaderInstance.hideLoader();
  }
}

function displayTransactions(transactions) {
  const tableBody = document.getElementById("transactionsTable");
  if (!tableBody) return;

  tableBody.innerHTML = "";

  if (!transactions || transactions.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="3" class="text-center">
          No transactions found for this player
        </td>
      </tr>`;
    return;
  }

  transactions.forEach((transaction) => {
    const row = document.createElement("tr");
    const amount = parseFloat(transaction.Amount || 0).toFixed(2);
    const mode = transaction.Mode || "N/A";
    const date = transaction.RecordDate
      ? formatTransactionDate(transaction.RecordDate)
      : "N/A";

    row.innerHTML = `
      <td>${date}</td>
      <td class="${amount >= 0 ? "text-success" : "text-danger"} fw-bold">
        ₹ ${amount}
      </td>
      <td>${mode}</td>
    `;
    tableBody.appendChild(row);
  });
}

gapi.load("client", initClient);
