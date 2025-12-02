let getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return null;
};

document.addEventListener("DOMContentLoaded", async function () {
  const studioID = decodeURIComponent(getCookie("studio")); // Studio ID to match
  const tableContainer = document.getElementById("tableContainer");
  const clubNameElement = document.querySelector(".club-name");
  const clubLogoElement = document.querySelector(".club-logo");
  const clockElement = document.getElementById("clock");

  // Initialize live clock
  function updateClock() {
    const now = new Date();
    const time = now.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
      timeZone: "Asia/Kolkata",
    });
    clockElement.textContent = time;
  }

  // Update clock immediately and then every second
  updateClock();
  setInterval(updateClock, 1000);

  async function fetchStudioData() {
    try {
      const response = await fetch("/apis/data/masterstudio");
      const data = await response.json();

      if (!Array.isArray(data) || !data.length)
        throw new Error("Invalid studio data format");

      const allStudios = data[0];
      const matchedStudio = allStudios.find(
        (studio) => studio.Studio === studioID
      );

      if (matchedStudio) {
        clubNameElement.textContent = matchedStudio.Studio_name;
        clubLogoElement.src = matchedStudio.clublogo || "default-logo.png";
        document.title = matchedStudio.Studio_name + " - Table Status";
      } else {
        clubNameElement.textContent = "Unknown Club";
        clubLogoElement.src = "default-logo.png";
      }
    } catch (error) {
      console.error("Error fetching studio data:", error);
      clubNameElement.textContent = "Error Loading Club";
      clubLogoElement.src = "default-logo.png";
      showErrorNotification("Failed to load club information. Please refresh.");
    }
  }

  async function fetchTablesAndFrames() {
    try {
      showLoadingIndicator();

      const response = await fetch("/apis/data/tv");
      let tvData = await response.json();
      tvData = tvData.data;

      console.log("tvData", tvData);
      renderTables(tvData);
      hideLoadingIndicator();
    } catch (error) {
      console.error("Error fetching data:", error);
      hideLoadingIndicator();
      showErrorNotification("Failed to load table data. Please refresh.");
    }
  }

  function convertToIST(utcTime) {
    if (!utcTime) return "N/A";
    return new Date(utcTime).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Asia/Kolkata",
    });
  }

  function calculateDuration(startTime) {
    if (!startTime) return null;

    const start = new Date(startTime);
    const now = new Date();
    const diffMs = now - start;

    // Calculate hours and minutes
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  }

  function renderTables(tables) {
    if (tables.length === 0) {
      tableContainer.innerHTML = `
                <div class="no-tables-message">
                    No tables found for this studio.
                </div>
            `;
      return;
    }

    tableContainer.innerHTML = "";

    tables.forEach((table) => {
      const tableCard = document.createElement("div");
      tableCard.classList.add(
        "table-card",
        table.isOccupied ? "occupied" : "available"
      );

      let startTime = convertToIST(table.startTime);
      let duration = calculateDuration(table.startTime);
      const playerText = table.players.length
        ? `<div class="players" >Players: ${table.players.join(", ")}</div>`
        : "";

      // const durationText = table.duration
      //     ? `<div class="duration">Duration: ${table.duration}</div>`
      //     : "";

      tableCard.innerHTML = `
                <div class="table-id">${table.table_id}</div>
                <div class="table-name">${table.table_name}</div>
                <div class="table-status">${
                  table.isOccupied ? "In Use" : "Available"
                }</div>
                ${table.isOccupied ? playerText : ""}
                ${
                  table.isOccupied && startTime !== "N/A"
                    ? `<div class="start-time">Started: ${startTime}</div>`
                    : ""
                }
                ${duration}
                
            `;

      tableCard.id = table.table_id;

      tableCard.addEventListener("click", (event) => {
        console.log("Table clicked:", table.table_id, table.frameId);
        if (!table.isOccupied) {
          window.location.href = `/nfcOn?tableId=${table.table_id}&tableName=${table.table_name}`;
        } else {
          showOffPopup(table.frameId, table.players);
        }
      });

      tableContainer.appendChild(tableCard);
    });
  }

  function showLoadingIndicator() {
    // Only show if not already present
    if (!document.querySelector(".loading-indicator")) {
      const loading = document.createElement("div");
      loading.className = "loading-indicator";
      loading.innerHTML = `
                <div class="spinner"></div>
                <p>Loading tables...</p>
            `;
      document.body.appendChild(loading);
    }
  }

  function hideLoadingIndicator() {
    const loading = document.querySelector(".loading-indicator");
    if (loading) {
      loading.remove();
    }
  }

  function showErrorNotification(message) {
    const notification = document.createElement("div");
    notification.className = "error-notification";
    notification.innerHTML = `
            <p>${message}</p>
            <button class="close-btn">×</button>
        `;

    document.body.appendChild(notification);

    // Add event listener to close button
    notification
      .querySelector(".close-btn")
      .addEventListener("click", function () {
        notification.remove();
      });

    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (document.body.contains(notification)) {
        notification.remove();
      }
    }, 5000);
  }

  // Initial Fetch
  await fetchStudioData();
  await fetchTablesAndFrames();

  // Auto Refresh Every 30 Seconds
  // setInterval(fetchTablesAndFrames, 30000);

  // Add these CSS rules to your existing stylesheet
  const style = document.createElement("style");
  style.textContent = `
        .loading-indicator {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(0, 0, 0, 0.7);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 1000;
            color: white;
        }
        
        .spinner {
            border: 5px solid rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            border-top: 5px solid #01AB7A;
            width: 50px;
            height: 50px;
            animation: spin 1s linear infinite;
            margin-bottom: 15px;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .error-notification {
            position: fixed;
            top: 20px;
            right: 20px;
            background-color: #FF5733;
            color: white;
            padding: 15px;
            border-radius: 5px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
            z-index: 1000;
            display: flex;
            align-items: center;
            justify-content: space-between;
            min-width: 300px;
        }
        
        .close-btn {
            background: none;
            border: none;
            color: white;
            font-size: 20px;
            cursor: pointer;
            margin-left: 10px;
        }
        
        .duration {
            margin-top: 5px;
            font-size: 14px;
            background-color: rgba(255, 255, 255, 0.15);
            padding: 3px 8px;
            border-radius: 4px;
        }
        
        .no-tables-message {
            grid-column: 1 / -1;
            text-align: center;
            padding: 40px;
            background-color: rgba(255, 255, 255, 0.1);
            border-radius: 10px;
            font-size: 18px;
            color: #ccc;
        }
    `;
  document.head.appendChild(style);
});
var paymentDetailsArray = [];
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
      }
    } catch (error) {
      // Handle errors and close the modal
      console.error(error);
      Swal.close();
      reject(error); // Rejecting the Promise in case of general error
    }
  });
};

function showLoadingIndicator() {
    // Only show if not already present
    if (!document.querySelector(".loading-indicator")) {
      const loading = document.createElement("div");
      loading.className = "loading-indicator";
      loading.innerHTML = `
                <div class="spinner"></div>
                <p>Loading tables...</p>
            `;
      document.body.appendChild(loading);
    }
  }

  function hideLoadingIndicator() {
    const loading = document.querySelector(".loading-indicator");
    if (loading) {
      loading.remove();
    }
  }

  function showErrorNotification(message) {
    const notification = document.createElement("div");
    notification.className = "error-notification";
    notification.innerHTML = `
            <p>${message}</p>
            <button class="close-btn">×</button>
        `;

    document.body.appendChild(notification);

    // Add event listener to close button
    notification
      .querySelector(".close-btn")
      .addEventListener("click", function () {
        notification.remove();
      });

    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (document.body.contains(notification)) {
        notification.remove();
      }
    }, 5000);
  }

async function offMatch(rowNumber) {
  const studio = "Studio 313"; // Studio ID to match

  let value = paymentDetailsArray;
  console.log("offMatch called with rowNumber:", rowNumber);
  console.log(value);

  let frameID = rowNumber;

  // loaderInstance.showLoader();
  showLoadingIndicator();
  await fetch("/frames/offMatch", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      studio: decodeURIComponent(studio),
      players: value,
      frameID: frameID,
      bet: 0,
    }),
  })
    .then((response) => {
      // loaderInstance.hideLoader();

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      hideLoadingIndicator();
      location.reload();
    })
    .catch((error) => {
      // loaderInstance.hideLoader();
      hideLoadingIndicator();
      console.error("There was a problem with the fetch operation:", error);
    });
}

function showOffPopup(rowNumber, playerNames) {
  // Create overlay div
  console.log("showOffPopup called with rowNumber:", rowNumber);

  const overlay = document.createElement("div");
  overlay.id = "offFormOverlay";
  overlay.classList.add("overlay");

  // Create content div
  const content = document.createElement("div");
  content.className = "overlay-content";

  // Create form
  const form = document.createElement("form");
  form.id = "offForm";

  const offHeading = document.createElement("h3");
  offHeading.innerText = "Select The Losing Player (LP)";
  // offHeading.className = "off-heading";
  // offHeading.style.textAlign = "center";
  offHeading.style.color = "Black";
  form.appendChild(offHeading);

  // Create buttons for each player
  playerNames.forEach((playerName) => {
    if (playerName.trim() !== "") {
      // Check if player name is not empty
      const playerButton = document.createElement("button");
      playerButton.type = "button";
      playerButton.className = "player-button";
      playerButton.innerText = playerName;
      playerButton.onclick = function () {
        const paymentDetails = document.getElementById("paymentDetails");
        paymentDetails.value += `${playerName}, `;
      };

      form.appendChild(playerButton);
    }
  });

  // Create input field for payment details
  const paymentDetailsInput = document.createElement("input");
  paymentDetailsInput.type = "text";
  paymentDetailsInput.id = "paymentDetails";
  paymentDetailsInput.readOnly = true;
  paymentDetailsInput.placeholder = "Frames Lost by each player";
  form.appendChild(paymentDetailsInput);

  // Create submit and cancel buttons
  const submitButton = document.createElement("button");
  submitButton.type = "button";
  submitButton.innerText = "Scan Card";
  submitButton.className = "submit-button";
  submitButton.addEventListener("click", async () => {
    if ("NDEFReader" in window) {
      let check = await nfcScanner();
      if (playerNames.includes(check.playerName)) {
        console.log("Player Name:", check.playerName);
        const paymentDetails = document.getElementById("paymentDetails").value;
        paymentDetailsArray = paymentDetails.split(",");
        paymentDetailsArray.pop();

        paymentDetailsArray = paymentDetailsArray.map((name) => name.trim());
        // console.log(paymentDetailsArray);

        overlay.style.display = "none"; // Hide overlay after submission
        form.reset(); // Reset form fields
        offMatch(rowNumber);
      }
    } else {
      const paymentDetails = document.getElementById("paymentDetails").value;
      paymentDetailsArray = paymentDetails.split(",");
      paymentDetailsArray.pop();

      paymentDetailsArray = paymentDetailsArray.map((name) => name.trim());
      // console.log(paymentDetailsArray);

      overlay.style.display = "none"; // Hide overlay after submission
      form.reset(); // Reset form fields
      offMatch(rowNumber);
    }
  });
  // submitButton.value = "Confirm";

  const cancelButton = document.createElement("button");
  cancelButton.type = "button";
  cancelButton.innerText = "Cancel";
  cancelButton.onclick = function () {
    paymentDetailsInput.value = "";
    overlay.style.display = "none"; // Hide overlay on cancel
  };

  // Append buttons to the form
  form.appendChild(submitButton);
  form.appendChild(cancelButton);

  // Append form to the content
  content.appendChild(form);

  // Append content to the overlay
  overlay.appendChild(content);

  // Append overlay to the document body
  document.body.appendChild(overlay);

  // Show overlay
  overlay.style.display = "block";

  // Clicking outside the form will also close the overlay
  overlay.addEventListener("click", function (event) {
    if (event.target === overlay) {
      overlay.style.display = "none";
    }
  });
}
