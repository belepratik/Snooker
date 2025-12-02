// Extracting studio from the URL
const urlParams = new URLSearchParams(window.location.search);
const studio = urlParams.get("studio");
const markOn = urlParams.get("markOn");
const nfc = urlParams.get("nfc");

const loaderInstance = new FullScreenLoader();

let getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return null;
};

if (
  studio == "Studio 111" ||
  studio == "Studio 212" ||
  studio == "Studio 121"
) {
  document.querySelector(".rateType").style.display = "none";
}

if (!markOn) {
  console.log("edit");
  if (studio == "Studio 111") {
    document.getElementById("startTime").disabled = true;
  }
  document.addEventListener("DOMContentLoaded", function () {
    const frameId = getFrameIdFromURL();
    if (frameId) {
      fetchFrameData(frameId);
    }
  });
} else {
  async function prefill() {
    var frameId = getFrameIdFromURL();
    document.getElementById("frameNo").textContent = frameId;
    console.log("markon");
  }
  prefill();
  let table_option = async () => {
    try {
      let data = await fetchData("tabledets", studio);
      // console.log(data);
      const availableTables = data
        .filter((table) => table.status === 0) // Filter tables with status 0
        .map((table) => ({
          tableId: table.table_id,
          tableName: table.table_name,
        }));
      // console.log(tables)
      populateTableDropdown(availableTables);
    } catch (error) {
      console.error("Error fetching frame data:", error);
    }
  };
  document.addEventListener("DOMContentLoaded", table_option);
}

function getFrameIdFromURL() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get("frameId");
}

async function fetchFrameData(frameId) {
  const rowNumber = frameId.replace("SPS", "");

  try {
    let data1 = await fetchData("tabledets", studio);
    // console.log(data1);
    const tables = data1.map((table) => ({
      tableId: table.table_id,
      tableName: table.table_name,
    }));

    // console.log(tables)
    populateTableDropdown(tables);
    // console.log(data1);

    const data = await fetchFrame(rowNumber);
    // console.log(data);
    if (data) {
      const rowData = data;
      prefillForm(rowData, frameId);
    } else {
      console.error("No data found for the given frame ID.");
    }
  } catch (error) {
    console.error("Error fetching frame data:", error);
  }
}

function prefillForm(rowData, frameId) {
  const tableNo = rowData.TableId;

  const players = [
    rowData.P1,
    rowData.P2,
    rowData.P3,
    rowData.P4,
    rowData.P5,
    rowData.P6,
  ].filter(Boolean);

  document.getElementById("frameNo").textContent = frameId;
  document.getElementById("tableNo").value = tableNo || "";
  setDefaultTime(rowData.StartTime);

  // Populate player inputs
  // const playersArray = players.split(",").map(player => player.trim());
  const playersContainer = document.getElementById("playersContainer");
  playersContainer.innerHTML = ""; // Clear previous inputs
  // console.log(playersArray);

  players.forEach((player, index) => {
    const playerInput = createPlayerInput(player, index);
  });
}

document
  .getElementById("updateFrameForm")
  .addEventListener("submit", async function (event) {
    event.preventDefault();
    await updateFrameData();
  });

async function updateFrameData() {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const markOn = urlParams.get("markOn");
    const studio = urlParams.get("studio");

    let url = "/frames/onMatch/";
    if (markOn) {
      url = "/frames/onMatch?mark=On";
    }
    var frameId = document.getElementById("frameNo").textContent;
    frameId = frameId.replace("SPS", "");
    const tableDropdown = document.getElementById("tableNo");
    const selectedOption = tableDropdown.options[tableDropdown.selectedIndex];
    const tableName = selectedOption.innerText;
    const tableNo = selectedOption.value;
    let startTime = document.getElementById("startTime").value;
    // Ensure time format is valid
    startTime = formatTime(startTime);

    const playersInputs = document.querySelectorAll(".player-input");
    const isFixed = document.querySelector(
      'input[name="rateType"]:checked'
    ).value;

    const players = Array.from(playersInputs).map((input) =>
      input.value.trim()
    );

    // check for duplicates
    const duplicates = players.filter(
      (val, idx) => players.indexOf(val) !== idx && val !== ""
    );

    if (duplicates.length > 0) {
      alert("Player names must be unique!");
      return;
    }
    const payload = {
      frameId: frameId,
      tableName: tableName,
      tableNo: tableNo,
      startTime: startTime,
      fixed: isFixed,
      studio: studio,
      players: players, // Ensure players are trimmed
    };

    try {
      loaderInstance.showLoader();

      fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }).then((resp) => {
        loaderInstance.hideLoader();
        if (!resp.ok) {
          throw new Error("Network response was not ok");
        }
        goBack();
      });
    } catch (error) {
      loaderInstance.hideLoader();
      console.error("Fetch error:", error);
      alert("Failed to update the frame. Please try again.");
    }
  } catch (error) {
    console.error("Error updating frame:", error);
    alert(
      "An error occurred while updating the frame. Please try again later."
    );
  }
}

async function fetchData(table, Studio) {
  const url = `apis/data/${table}/${Studio}`;
  // console.log(url)
  const response = await fetch(url);
  const data = await response.json();
  return data[0];
}
async function fetchFrame(FrameId) {
  const url = `apis/framesData/frames/${FrameId}`;
  console.log(url);
  const response = await fetch(url);
  const data = await response.json();
  return data[0];
}

// Listen for input changes in the players field and populate player names
document
  .getElementById("playersContainer")
  .addEventListener("input", function () {
    populatePlayerNames();
  });
function populateTableDropdown(table) {
  const tableNoSelect = document.getElementById("tableNo");

  table.forEach((tableData) => {
    const option = document.createElement("option");
    option.value = tableData.tableId;
    option.textContent = tableData.tableName;
    tableNoSelect.appendChild(option);
  });
}

function setDefaultTime(dateTime) {
  const setTime = document.getElementById("startTime");

  const now = dateTime ? new Date(dateTime) : new Date();
  const offset = now.getTimezoneOffset() * 60000;

  // Convert to local time
  const localNow = new Date(now - offset);
  const localMax = new Date(now.getTime() + 45 * 60000 - offset);

  // Format properly for datetime-local input
  const formatDateTime = (date) => date.toISOString().slice(0, 16);

  setTime.value = formatDateTime(localNow);
  setTime.setAttribute("max", formatDateTime(localMax)); // Ensure it's correctly set
}
setDefaultTime();

const nfcScanner = async () => {
  return new Promise(async (resolve, reject) => {
    try {
      if ("NDEFReader" in window) {
        Swal.fire({
          title: "Waiting for NFC Card...",
          text: "Please tap your NFC card.",
          imageUrl: "/public/scanNfc.gif", // Custom icon
          imageWidth: 80,
          imageHeight: 80,
          imageAlt: "NFC Icon",
          allowOutsideClick: false, // Prevent closing by clicking outside
          showConfirmButton: false, // No confirmation button
          didOpen: () => {
            Swal.showLoading(); // Show a loading spinner
          },
        });

        try {
          const nfcReader = new NDEFReader();
          await nfcReader.scan();

          nfcReader.onreading = (event) => {
            const nfcMessage = event.message.records[0];
            if (nfcMessage) {
              const decoder = new TextDecoder();
              const nfcId = decoder.decode(nfcMessage.data);
              const nfcIdObj = JSON.parse(nfcId);

              let result = {
                playerName: nfcIdObj.playerName,
                nfcID: nfcIdObj.cardid,
              };

              // Close the SweetAlert popup
              Swal.close();
              resolve(result); // Resolving the Promise with result
            }
          };
        } catch (error) {
          console.error("NFC scan failed", error);
          Swal.close();

          // Show error message
          await Swal.fire({
            title: "Scan Failed!",
            text: error.message,
            icon: "error",
            timer: 2000, // Auto-close after 2 seconds
            showConfirmButton: false,
          });
          reject(error); // Rejecting the Promise in case of error
        }
      } else {
        Swal.close();
        alert("Web NFC is not supported on this device or browser");
        reject(new Error("Web NFC not supported"));
      }
    } catch (error) {
      // Handle errors and close the modal
      console.error(error);
      Swal.close();
      reject(error); // Rejecting the Promise in case of general error
    }
  });
};

async function createPlayerInput(value, index) {
  // created container to contain input and cancel sign
  let playerContainer = document.createElement("div");
  playerContainer.className = "playerContainer";
  playerContainer.id = "playerContainer";

  var playerInput;
  if (nfc) {
    try {
      let playerData = await nfcScanner(); // Call NFC scanner

      // Populate player name and NFC ID
      playerInput = document.createElement("input");
      playerInput.className = "player-input";
      playerInput.id = `playerInput${index}`;
      playerInput.readOnly = true;
      playerInput.value = `${playerData.playerName}`;
    } catch (error) {
      console.error("NFC Scanner Error:");
      return;
    }
    // console.log('a', a)
  } else {
    // input to contain name
    playerInput = document.createElement("select");
    playerInput.className = "player-input";
    playerInput.id = `playerInput${index}`;

    let defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.disabled = true; // cannot be slelected
    defaultOption.selected = true;
    defaultOption.innerText = "Select player ";
    playerInput.append(defaultOption);

    if (value) {
      const optionElement = document.createElement("option");
      optionElement.value = value;
      optionElement.textContent = value;
      optionElement.selected = true;
      playerInput.appendChild(optionElement);
    }
    fetchData("masterplayer", studio).then((data) => {
      data.forEach((player) => {
        let option = document.createElement("option");
        option.value = player.Players;
        option.innerText = player.Players;
        if (parseInt(player.Balance_Limit) <= parseInt(player.Total)) {
          option.disabled = true;
          option.innerText += " ( pay your balance first )";
        }

        let nfcStudio = [
          "Studio 111",
          "Studio 313",
          "Studio 056",
          "Studio 212",
        ];
        if (player.nfcOption === 1 && nfcStudio.includes(studio)) {
          option.innerText += " ( NFC only)";
          option.disabled = true;
          option.style.color = "green";
        }

        // Attach balance condition to the option itself using a data attribute
        option.setAttribute("data-balance-limit", player.Balance_Limit);
        option.setAttribute("data-total", player.Total);

        playerInput.append(option);
      });

      // Initialize select2 outside the forEach
      $(playerInput).select2({
        placeholder: "Select player name",
        allowClear: true,
        templateResult: formatOption, // Custom formatting function
      });
    });
  }

  const remove = document.createElement("div");
  remove.className = "remove";
  remove.id = `remove${index + 1}`;

  const rem = document.createElement("img");
  rem.className = "rem_icon";
  rem.id = `rem_icon${index + 1}`;
  rem.src = "/public/icons8-cross-30.png";

  remove.appendChild(rem);

  // let playersContainer = document.getElementById("playersContainer");
  remove.addEventListener("click", () => {
    playerContainer.remove();
  });
  playerContainer.append(playerInput);
  playerContainer.append(remove);

  let playersContainer = document.getElementById("playersContainer");
  playersContainer.append(playerContainer);
}

function formatOption(option) {
  if (!option.id) {
    return option.text; // Return the placeholder option text
  }

  // Extract the balance limit and total from the option's data attributes
  const balanceLimit = $(option.element).data("balance-limit");
  const total = $(option.element).data("total");

  // Determine the color based on the balance and total condition
  const color = parseInt(balanceLimit) <= parseInt(total) ? "red" : "white";

  var $option = $(
    '<span style="color: ' + color + ';">' + option.text + "</span>"
  );
  return $option;
}

document
  .getElementById("addPlayerButton")
  .addEventListener("click", function () {
    const playersContainer = document.getElementById("playersContainer");
    const playerInputs =
      playersContainer.getElementsByClassName("player-input");
    if (playerInputs.length < 6) {
      const playerInput = createPlayerInput("", playerInputs.length);
    } else {
      alert("You can add up to 6 players.");
    }
  });

function formatTime(time) {
  if (time && time.includes("AM")) {
    time = time.replace("AM", "").trim();
    let [hour, min, sec] = time.split(":");
    if (hour == 12) {
      time = `00:${min}:${sec}`;
    }
    // return time;
  } else if (time && time.includes("PM")) {
    time = time.replace("PM", "").trim();
    let [hour, min, sec] = time.split(":");
    hour = parseInt(hour);
    if (hour !== 12) {
      hour += 12;
      time = `${hour}:${min}:${sec}`;
    }

    // return `time`;
  }
  console.log("time", time);
  return time;
}
function goBack() {
  // const urlParams = new URLSearchParams(window.location.search);

  // const security = getCookie("security");
  // const studio = getCookie("studio");

  let backUrl = "/frame";
  window.location.assign(backUrl);
}

/* */
