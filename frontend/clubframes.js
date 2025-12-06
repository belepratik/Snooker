let frameGlobalData = []; // Global variable to store frame data
const loaderInstance = new FullScreenLoader(); // Assuming FullScreenLoader is defined elsewhere

const urlParams = new URLSearchParams(window.location.search);
const player = urlParams.get("player");

// Function to fetch data based on the provided sheet name
async function fetchData(sheetName, all) {
  let limit = document.getElementById("loadButton").value;
  let url = "";
  let data = [];
  if (all) {
    url = `apis/data/frames/${sheetName}`;
    let response = await fetch(url);
    data = await response.json();
    data = data.reverse();
  } else {
    url = `apis/data/frames/${sheetName}?limit=${limit}`;
    let response = await fetch(url);
    data = await response.json();
  }
  return data;
}

let getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return null;
};

var clubLogo = decodeURIComponent(getCookie("clubLogo"));

document.addEventListener("DOMContentLoaded", function () {
  const logoImg = document.getElementById("clubLogo");
  if (clubLogo && logoImg) {
    logoImg.src = decodeURIComponent(clubLogo);
  }
});

let heading = document.getElementById("heading");
heading.innerHTML = `${getCookie("clubName")}`;

let loadButton = document.getElementById("loadButton");
loadButton.addEventListener("click", () => {
  console.log(typeof loadButton.value);
  loadButton.value = parseInt(loadButton.value) + 10;
  console.log("loadbutton", loadButton.value);
  applyFilters(false);
});
async function offMatch(rowNumber, bet, selectedPlayers, rematch) {
  const studio = getCookie("studio");

  let frameID = rowNumber;

  loaderInstance.showLoader();

  await fetch("/frames/offMatch", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      studio: decodeURIComponent(studio),
      players: selectedPlayers,
      frameID: frameID,
      rematch: rematch,
      bet: bet || 0,
    }),
  })
    .then((response) => {
      loaderInstance.hideLoader();

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      location.reload();
    })
    .catch((error) => {
      loaderInstance.hideLoader();
      console.error("There was a problem with the fetch operation:", error);
    });
}

function markFrameOn() {
  let frameId = 1;
  if (frameGlobalData.length > 0) {
    frameId += parseInt(frameGlobalData[0].rowNumber);
  }
  const securityKey = getCookie("security");
  const studio = getCookie("studio");
  const query_params = `?frameId=${frameId}&markOn=true&security=${securityKey}&studio=${studio}`;
  window.location.assign("/markOn" + query_params);
}

// Function to display frame entries on the webpage
function displayFrameEntries(frameEntries) {
  const frameEntriesContainer = document.getElementById("frameEntries");
  frameEntriesContainer.innerHTML = ""; // Clear previous entries

  frameEntries.forEach((entry) => {
    // console.log(entry);
    const frameElement = document.createElement("div");
    frameElement.className = entry.isActive
      ? "frame-card active-frame"
      : "frame-card";

    // Include Frame ID
    const frameIdElement = document.createElement("p");
    frameIdElement.innerText =
      entry.edited == "Yes"
        ? `Frame ID: SPS${entry.rowNumber} ( Edited )`
        : `Frame ID: SPS${entry.rowNumber}`;
    frameIdElement.style.fontSize = "small"; // Making the font size small
    frameElement.appendChild(frameIdElement);

    // Display frame details
    const dateElement = document.createElement("h5");
    dateElement.innerText = `Date: ${entry.date}`;
    frameElement.appendChild(dateElement);

    const tableNameElement = document.createElement("p");
    tableNameElement.innerText = `Table Name : ${entry.tableName || "N/A"}`;
    frameElement.appendChild(tableNameElement);

    if (!entry.isActive) {
      const durationElement = document.createElement("p");
      durationElement.innerText = `Duration: ${entry.duration} min`;
      frameElement.appendChild(durationElement);

      const tableMoneyElement = document.createElement("p");
      tableMoneyElement.innerText = `Table Money: Rs. ${entry.tableMoney} , Rs. ${entry.share} each`;
      frameElement.appendChild(tableMoneyElement);

      const chargeTypeElement = document.createElement("p");
      chargeTypeElement.innerText = `Charge Type : ${entry.chargeType}`;
      frameElement.appendChild(chargeTypeElement);

      const timePeriodElement = document.createElement("p");
      timePeriodElement.innerText = `Time period :  ${entry.startTime} to ${entry.offTime} `;
      frameElement.appendChild(timePeriodElement);
    } else {
      const startTimeElement = document.createElement("p");
      startTimeElement.innerText = `Start Time: ${entry.startTime} `;
      frameElement.appendChild(startTimeElement);
    }

    const playersElement = document.createElement("p");
    playersElement.innerText = `Players: ${entry.playerNames
      .filter((name) => name)
      .join(", ")}`;
    frameElement.appendChild(playersElement);

    const paidByElement = document.createElement("p");
    paidByElement.innerText = `Paid by: ${
      entry.paidByNames.filter((name) => name).join(", ") || "N/A"
    }`;
    frameElement.appendChild(paidByElement);

    // Display status and buttons for active frames
    if (entry.isActive) {
      const statusElement = document.createElement("p");
      statusElement.innerText = `Status: ${
        entry.offStatus ? entry.offStatus : "Active"
      }`;
      statusElement.style.color = entry.offStatus ? "red" : "green"; // Red for "Off", green for "Active"
      frameElement.appendChild(statusElement);

      const actionButtons = document.createElement("div");
      actionButtons.className = "action-buttons";

      // Edit Button
      const editButton = document.createElement("button");
      editButton.innerText = "Edit";
      editButton.className = "btn btn-primary edit-btn";
      editButton.onclick = function () {
        const securityKey = getCookie("security");
        const studio = getCookie("studio");
        const query_params = `?frameId=SPS${entry.rowNumber}&security=${securityKey}&studio=${studio}`;
        window.location.assign("/markOn" + query_params);
      };
      actionButtons.appendChild(editButton);
      const studio = decodeURIComponent(getCookie("studio"));
      if (["Studio 313", "Studio 212", "Studio 111"].includes(studio)) {
        if (entry.ifPaused) {
          // pause Button
          const resumeButton = document.createElement("button");
          resumeButton.innerText = "Resume";
          resumeButton.className = "btn btn-primary resume-btn";
          resumeButton.addEventListener("click", () =>
            resumeMatch(entry.rowNumber)
          );
          actionButtons.appendChild(resumeButton);
        } else {
          // pause Button
          const pauseButton = document.createElement("button");
          pauseButton.innerText = "Pause";
          pauseButton.className = "btn btn-primary pause-btn";
          pauseButton.addEventListener("click", () => {
            const pauseData = {
              frameId: entry.rowNumber,
              startTime: entry.startTime,
              table: entry.tableNo,
              roaster: entry.roaster,
            };
            pauseMatch(pauseData);
          });
          actionButtons.appendChild(pauseButton);

          const offButton = document.createElement("button");
          offButton.innerText = "Off";
          offButton.className = "btn btn-danger off-btn";
          offButton.addEventListener("click", () =>
            showOffPopup(entry.rowNumber, entry.playerNames)
          );
          actionButtons.appendChild(offButton);
        }
      } else {
        const offButton = document.createElement("button");
        offButton.innerText = "Off";
        offButton.className = "btn btn-danger off-btn";
        offButton.addEventListener("click", () =>
          showOffPopup(entry.rowNumber, entry.playerNames)
        );
        actionButtons.appendChild(offButton);
      }

      frameElement.appendChild(actionButtons);
    }

    frameEntriesContainer.appendChild(frameElement);
  });
}

function resumeMatch(frameId) {
  swal.fire({
    title: "Resuming match...",
    text: "Please wait",
    allowOutsideClick: false,
    didOpen: () => {
      Swal.showLoading();
    },
  });

  console.log("resumeData", frameId);
  fetch("/frames/resumeMatch", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      frameId: frameId,
    }),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Something went wrong!",
      });
      return response.json();
    })
    .then((data) => {
      console.log("Match resumed successfully:", data);
      Swal.fire({
        icon: "success",
        title: "Match resumed!",
        text: "The match was successfully resumed.",
        confirmButtonText: "OK",
      }).then(() => {
        location.reload();
      });
    })
    .catch((error) => {
      console.error("There was a problem with the fetch operation:", error);
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Something went wrong!",
      });
    });
}

function pauseMatch(pauseData) {
  console.log("pauseData", pauseData);

  // Show loading SweetAlert
  Swal.fire({
    title: "Pausing match...",
    text: "Please wait",
    allowOutsideClick: false,
    didOpen: () => {
      Swal.showLoading();
    },
  });

  fetch("/frames/pauseMatch", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      data: pauseData,
    }),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    })
    .then((data) => {
      Swal.fire({
        icon: "success",
        title: "Match paused!",
        text: "The match was successfully paused.",
        confirmButtonText: "OK",
      }).then(() => {
        location.reload();
      });
    })
    .catch((error) => {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Something went wrong while pausing the match!",
      });
      console.error("There was a problem with the fetch operation:", error);
    });
}

function showOffPopup(rowNumber, playerNames) {
  const overlay = document.getElementById("offFormOverlay");
  const form = document.getElementById("offForm");
  const buttonsContainer = document.getElementById("playerButtonsContainer");
  const paymentDetailsInput = document.getElementById("paymentDetails");
  const betInput = document.getElementById("bet");

  let selectedPlayers = [];
  buttonsContainer.innerHTML = "";

  playerNames.forEach((playerName) => {
    if (playerName.trim() !== "") {
      const playerButton = document.createElement("button");
      playerButton.type = "button";
      playerButton.className = "player-button";
      playerButton.innerText = playerName;

      playerButton.onclick = () => {
        selectedPlayers.push(playerName);
        console.log(selectedPlayers);
        paymentDetailsInput.value = selectedPlayers.join(", ");
      };

      buttonsContainer.appendChild(playerButton);
    }
  });

  overlay.style.display = "block";

  const handleMatch = (isRematch) => {
    const bet = betInput.value;
    overlay.style.display = "none";
    form.reset();
    console.log(selectedPlayers);
    offMatch(rowNumber, bet, selectedPlayers, isRematch);
  };

  document.getElementById("offMatch").onclick = (e) => {
    e.preventDefault();
    handleMatch(false);
  };
  document.getElementById("rematch").onclick = (e) => {
    e.preventDefault();
    handleMatch(true);
  };

  document.getElementById("cancelOffForm").onclick = () => {
    form.reset();
    overlay.style.display = "none";
  };
}

// Function to apply filters to frame entries
function applyFilters(all) {
  const playerNameFilter = document
    .getElementById("playerNameFilter")
    .value.toLowerCase();
  let dateFilter = document.getElementById("dateFilter").value;
  if (dateFilter) {
    const [year, month, day] = dateFilter.split("-");
    dateFilter = `${day}/${month}/${year}`;
  }
  const showActiveFrames =
    document.getElementById("activeFramesFilter").checked;

  // Extract studio name and security key from URL
  const studioName = getCookie("studio");
  // console.log(dateFilter, playerNameFilter, showActiveFrames);

  // Fetch data based on studio name
  fetchData(studioName, all ? true : false).then((data) => {
    // console.log(data);

    let frameEntries = data
      .map((frame) => ({
        rowNumber: frame.FrameId,
        edited: frame.Edited,
        date: `${new Date(frame.StartTime).getDate()}-${
          parseInt(new Date(frame.StartTime).getMonth()) + 1
        }-${new Date(frame.StartTime).getFullYear()} `,
        startTime: new Date(frame.StartTime).toTimeString().split(" ")[0],
        offTime: new Date(frame.OffTime).toTimeString().split(" ")[0],
        tableNo: frame.TableId,
        tableName: frame.tableName,
        duration: frame.durationBkp,
        tableMoney: frame.totalMoney2,
        share: frame.Share,
        chargeType: frame.fixedCharge ? "Timewise" : "FrameWise",
        playerNames: [
          frame.P1,
          frame.P2,
          frame.P3,
          frame.P4,
          frame.P5,
          frame.P6,
        ].filter(Boolean),
        roaster: frame.Roaster,
        paidByNames: [
          frame.LP01,
          frame.LP02,
          frame.LP03,
          frame.LP04,
          frame.LP05,
          frame.LP06,
          frame.LP07,
          frame.LP08,
          frame.LP09,
          frame.LP010,
        ].filter(Boolean),
        isValid: frame.Status ? true : false,
        isActive:
          frame.Status == "ON" ||
          frame.Status == "paused" ||
          frame.Status == "resumed"
            ? true
            : false,
        ifPaused: frame.Status == "paused" ? true : false,
        offStatus: frame.Status == "ON" ? false : true,
      }))
      .filter((entry) => entry.isValid);

    if (showActiveFrames) {
      frameEntries = frameEntries.filter((entry) => entry.isActive);
    }
    if (playerNameFilter) {
      frameEntries = frameEntries.filter((entry) =>
        entry.playerNames.some((name) =>
          name.toLowerCase().includes(playerNameFilter)
        )
      );
    }
    if (dateFilter) {
      // console.log("hello");
      const [day, month, year] = dateFilter.split("/");
      const date = `${year}-${month}-${day}`;
      frameEntries = frameEntries.filter((entry) => entry.date === date);
    }
    // Display the filtered frame entries
    displayFrameEntries(frameEntries);
  });
}

document.addEventListener("DOMContentLoaded", function () {
  // Add event listener to the "Add Players" button
  const PlayersButton = document.getElementById("PlayersButton");
  if (PlayersButton) {
    PlayersButton.addEventListener("click", function () {
      window.location.assign(`/players`);
    });
  }
});

// Perform initial operations after the window has loaded
window.onload = function () {
  // Extract studio name and security key from URL
  const studioName = getCookie("studio");

  // Fetch frame entries based on the studio name
  fetchData(studioName).then((data) => {
    let frameEntries = data
      .map((frame) => ({
        rowNumber: frame.FrameId,
        edited: frame.Edited,
        date: `${new Date(frame.StartTime).getDate()}-${
          parseInt(new Date(frame.StartTime).getMonth()) + 1
        }-${new Date(frame.StartTime).getFullYear()} `,
        startTime: new Date(frame.StartTime).toTimeString().split(" ")[0],
        offTime: new Date(frame.OffTime).toTimeString().split(" ")[0],
        tableNo: frame.TableId,
        tableName: frame.tableName,
        duration: frame.durationBkp,
        tableMoney: frame.totalMoney2,
        share: frame.Share,
        chargeType: frame.fixedCharge ? "Timewise" : "FrameWise",
        playerNames: [
          frame.P1,
          frame.P2,
          frame.P3,
          frame.P4,
          frame.P5,
          frame.P6,
        ].filter(Boolean),
        roaster: frame.Roaster,
        paidByNames: [
          frame.LP01,
          frame.LP02,
          frame.LP03,
          frame.LP04,
          frame.LP05,
          frame.LP06,
          frame.LP07,
          frame.LP08,
          frame.LP09,
          frame.LP010,
        ].filter(Boolean),
        isValid: frame.Status ? true : false,

        isActive:
          frame.Status == "ON" ||
          frame.Status == "paused" ||
          frame.Status == "resumed"
            ? true
            : false,
        ifPaused: frame.Status == "paused" ? true : false,
        offStatus: frame.Status == "ON" ? false : true,
      }))
      .filter((entry) => entry.isValid);

    // Store frame entries globally for later use
    frameGlobalData = frameEntries;

    // Display the frame entries
    displayFrameEntries(frameEntries);
  });
};

if (player) {
  console.log("player if", player);
  document.getElementById("playerNameFilter").value = player;
  applyFilters(true);
  const url = new URL(window.location);
  url.searchParams.delete("player"); // Remove 'player' parameter
  window.history.replaceState({}, "", url);
} else {
  console.log("player else", player);
  applyFilters(false);
}
