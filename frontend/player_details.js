const loaderInstance = new FullScreenLoader();
let transactionsModal = null;
let clubModal = null;

function initClient() {
  const urlParams = new URLSearchParams(window.location.search);
  const playerName = urlParams.get("player");
  const studioId = urlParams.get("studio_id");

  // let payBtn = document.getElementById("paybtn");
  // if (studioId == "Studio 313") {
  //   payBtn.style.display = "block";
  // }

  if (!playerName || !studioId) {
    console.error("Player name or studio ID not provided.");
    return;
  }

  // Initialize modals
  transactionsModal = new bootstrap.Modal(
    document.getElementById("transactionsModal"),
    { backdrop: "static" }
  );

  clubModal = new bootstrap.Modal(document.getElementById("clubModal"), {
    backdrop: "static",
  });

  // Set up click handlers
  document
    .getElementById("seeTransactions")
    ?.addEventListener("click", async (e) => {
      e.preventDefault();
      await fetchTransactions(playerName, studioId);
      transactionsModal.show();
    });

  document.getElementById("myClubBtn")?.addEventListener("click", async (e) => {
    e.preventDefault();
    try {
      await fetchClubPlayers(studioId);
      clubModal.show();
    } catch (error) {
      console.error("Failed to load club data:", error);
    }
  });

  // Load initial data
  fetchStudio(playerName, studioId);
  fetchRankInfo(playerName);
}

async function fetchClubPlayers(studioId) {
  try {
    loaderInstance.showLoader();
    const response = await fetch(
      `https://app.snookerplus.in/apis/data/leaderboard?studio=${encodeURIComponent(
        studioId
      )}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Handle different response formats
    const players = Array.isArray(data)
      ? data.length > 0
        ? data[0]
        : []
      : data;

    if (!players) {
      throw new Error("No player data received");
    }

    displayClubPlayers(players, studioId);
    return players;
  } catch (error) {
    console.error("Error fetching club players:", error);
    document.getElementById("clubPlayersTable").innerHTML = `
      <tr>
        <td colspan="4" class="text-center text-danger">
          Failed to load club players. Please try again.
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
        const payButton = document.createElement("button");
        payButton.className = "paybtn";
        payButton.innerText = "Pay Balance";
        payButton.onclick = payBalance;
        playerInfo.appendChild(payButton);
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
  let url = `apis/data/frames/${studio}`;
  loaderInstance.showLoader();
  fetch(url)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      if (!data || !data[0]) {
        throw new Error("No frame data received");
      }

      const frames = data[0];
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

function fetchRankInfo(playerName) {
  let url = `apis/playerData/leaderboard/${playerName}`;
  fetch(url)
    .then((response) => response.json())
    .then((data) => {
      let row = data[0];
      if (row) {
        displayRankInfo(row);
      } else {
        console.log("Rank info not found.");
      }
    })
    .catch((error) => console.error("Error fetching rank data:", error));
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

function displayFramesInfo(framesData, playerName) {
  const framesContainer = document.getElementById("framesInfo");
  if (!framesContainer) return;

  framesContainer.innerHTML = "";

  if (!framesData || !Array.isArray(framesData)) {
    framesContainer.innerHTML =
      '<div class="text-center">No frame data available</div>';
    return;
  }

  const allFrames = framesData.reverse();

  const framesWithShare = allFrames.filter((frame) => {
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

  allFrames.forEach((frame) => {
    if (!frame) return;

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
              </div>
              <div class="line3">
                  ${
                    showShare
                      ? `<span>💰 Table Charges: ₹${frameShare}</span>`
                      : ""
                  }
              </div>
          `;
    }

    framesContainer.appendChild(frameElement);
  });
}

function displayRankInfo(rankInfo) {
  if (!rankInfo) return;

  const urlParams = new URLSearchParams(window.location.search);
  const rank = urlParams.get("rank") || "-";

  document.getElementById("playerRank").innerText = `Rank: ${rank}`;
  document.getElementById("winRate").innerText = `Win Rate: ${
    rankInfo.win_rate || 0
  }%`;

  let playercardColor = "";
  const coins = parseInt(rankInfo.Coins || 0);
  let textColor = "white";

  if (coins < 21) {
    playercardColor = "#bd372e";
  } else if (coins >= 21 && coins <= 30) {
    playercardColor = "#FFEB3B";
    textColor = "#000000";
  } else if (coins >= 31 && coins <= 40) {
    playercardColor = "#4CAF50";
  } else if (coins >= 41 && coins <= 50) {
    playercardColor = "#795548";
  } else if (coins >= 51 && coins <= 60) {
    playercardColor = "#2196F3";
  } else if (coins >= 61 && coins <= 70) {
    playercardColor = "#E91E63";
  } else if (coins > 70) {
    playercardColor = "#000000";
  }

  const playerCard = document.getElementById("playerCard");
  if (playerCard) {
    playerCard.style.backgroundColor = playercardColor;
    playerCard.style.color = textColor;
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
    const response = await fetch(`https://app.snookerplus.in/apis/data/topup`);

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const transactions = await response.json();

    const transactionData = transactions[0] || [];

    const playerTransactions = transactionData
      .filter((t) => t.UserName === playerName && t.studio === studioId)
      .sort((a, b) => new Date(b.RecordDate || 0) - new Date(a.RecordDate || 0))
      .slice(0, 5);

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
