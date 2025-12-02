const urlParams = new URLSearchParams(window.location.search);
let tableId = urlParams.get("tableId");
let tableName = urlParams.get("tableName");

let setTableId = () => {
  const tableNoSelect = document.getElementById("tableNo");
  const option = document.createElement("option");
  option.value = tableId;
  option.textContent = tableName;
  option.selected = true;
  tableNoSelect.appendChild(option);
};
setTableId();

let getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return null;
};
const studio = decodeURIComponent(getCookie("studio"));

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

async function fetchData(table, Studio) {
  const url = `apis/data/${table}/${Studio}`;
  console.log(url);
  const response = await fetch(url);
  const data = await response.json();
  return data[0];
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
        // let result = {
        //   playerName: "yashb",
        //   nfcID: "MOCK123",
        // };

        resolve(result); // Resolving the Promise with mock data
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
  if ("NDEFReader" in window) {
    try {
      let a = await nfcScanner(); // Call NFC scanner
      console.log("Scanned Data:", a);

      // Populate player name and NFC ID
      playerInput = document.createElement("input");
      playerInput.className = "player-input";
      playerInput.id = `playerInput${index}`;
      playerInput.readOnly = true;
      playerInput.value = `${a.playerName} (${a.nfcID})`;
    } catch (error) {
      console.error("NFC Scanner Error:", error);
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


const addPlayerButton = document.getElementById("addPlayerButton");

addPlayerButton.addEventListener("click", async () => {
  const playersContainer = document.getElementById("playersContainer");
  const playerInputs = playersContainer.getElementsByClassName("player-input");
  if (playerInputs.length < 6) {
    createPlayerInput("", playerInputs.length);
  } else {
    alert("You can add up to 6 players only.");
  }
});
let submutButton = document.getElementById("submitBtn");
submutButton.addEventListener("click", async (e) => {
  e.preventDefault(); // Prevent default form submission
  updateFrameData();
  window.location.href = "/tvFrames";
});

let goBackButton = document.getElementById("backBtn");
goBackButton.addEventListener("click", (e) => {
  e.preventDefault(); // Prevent default form submission
  window.history.back(); // Go back to the previous page
});

async function updateFrameData() {
  try {

    const urlParams = new URLSearchParams(window.location.search);
    const markOn = true; 
    // const studio = urlParams.get("studio");

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
    console.log("startTime", startTime);
    // Ensure time format is valid
    // startTime = formatTime(startTime);

    const playersInputs = document.querySelectorAll(".player-input");
    // const isFixed = document.querySelector(
    //   'input[name="rateType"]:checked'
    // ).value;
    const players = Array.from(playersInputs)
      .map((input) => input.value)
      .join(", ");

    const payload = {
      frameId: parseInt(frameId),
      tableName: 'T1',
      tableNo: 'T1Studio 313',    
      startTime: startTime,
      studio: "Studio 313",
      // fixed: parseInt(isFixed),
      players: players.split(",").map((player) => player.trim()), // Ensure players are trimmed
    };
    console.log(payload);

    try {
      // loaderInstance.showLoader();

      fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }).then((resp) => {
        // loaderInstance.hideLoader();
        if (!resp.ok) {
          throw new Error("Network response was not ok");
        }
        goBack();
      });
    } catch (error) {
      // loaderInstance.hideLoader();
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
