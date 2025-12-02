const PLAYER_SHEET_NAME = "snookerplus";

let getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return null;
};

const loaderInstance = new FullScreenLoader();
var studio = decodeURIComponent(getCookie("studio"));
var clubLogo = decodeURIComponent(getCookie("clubLogo"));

document.addEventListener("DOMContentLoaded", function () {
  const logoImg = document.getElementById("clubLogo");
  if (clubLogo && logoImg) {
    logoImg.src = decodeURIComponent(clubLogo);
  }
});

console.log("studio", studio);
var security = getCookie("security");
var playerData = [];

if (studio == "Studio 111" || studio == "Studio 056") {
  document.getElementById("adjustmentButton").style.display = "none";
}
if (studio == "Studio 810") {
  document.getElementById("adjustmentButton").innerText = "Discount";
}

let heading = document.getElementById("heading");
heading.innerHTML = `${decodeURIComponent(getCookie("clubName"))}`;

async function fetchPlayerData(studio) {
  const Studio = studio;
  const url = `apis/data/masterplayer/${Studio}`;
  fetch(url)
    .then((response) => response.json())
    .then((data) => {
      // console.log('data', data)
      playerData = data;
      console.log(playerData);

      const rows = data[0];
      // console.log('rows', rows)
      const tableBody = document
        .getElementById("playersTable")
        .getElementsByTagName("tbody")[0];
      tableBody.innerHTML = ""; // Clear existing rows
      rows.forEach((row, index) => {
        const playerId = `SP${row.S_No}`;
        const playerName = row.Players;
        const MobileNo = row.MobileNo;
        const balance = row.Total;
        const limit = row.Balance_Limit;

        if (playerName && !isNaN(balance)) {
          const rowElement = tableBody.insertRow();
          rowElement.id = `row-${playerId}`;

          // Apply classes based on balance
          if (balance > 5) {
            rowElement.classList.add("balance-high");
          } else if (balance < -5) {
            rowElement.classList.add("balance-low");
          }

          const playerIDCell = rowElement.insertCell(0);
          playerIDCell.textContent = playerId;

          // Player Name Cell
          const playerNameCell = rowElement.insertCell(1);
          const playerNameInput = document.createElement("textarea");
          playerNameInput.rows = 2;
          playerNameInput.cols = 10;
          playerNameInput.value = playerName;
          playerNameInput.readOnly = true;
          playerNameInput.className = "readOnlyInput";
          playerNameCell.id = `name-${playerId}`;
          playerNameCell.appendChild(playerNameInput);

          // Adjust color based on balance
          if (balance > 5) {
            playerNameInput.style.color = "#F44336"; // Example color, adjust as needed
          } else if (balance < -5) {
            playerNameInput.style.color = "#4CAF50"; // Example color, adjust as needed
          }

          // Mobile Number Cell
          const mobileCell = rowElement.insertCell(2);
          const mobileInput = document.createElement("input");
          mobileInput.type = "number";
          mobileInput.value = MobileNo;
          mobileInput.readOnly = true;
          mobileInput.className = "readOnlyInput";
          mobileCell.appendChild(mobileInput);

          const balanceCell = rowElement.insertCell(3);
          balanceCell.id = `balance-${playerId}`;
          balanceCell.textContent = `Rs. ${balance} ` || "\u00A0"; // Directly display the balance without conversion

          const actionsCell = rowElement.insertCell(4);
          actionsCell.className = "action";
          const actionBtns = document.createElement("div");
          actionBtns.className = "actionBtns";

          const topUpButton = document.createElement("button");
          topUpButton.textContent = "Top Up";

          topUpButton.className = "topupBtn";
          topUpButton.addEventListener("click", () => {
            topupModal(playerId, Studio);
          });
          actionBtns.appendChild(topUpButton);

          const purchaseButton = document.createElement("button");
          purchaseButton.textContent = "Purchase";
          purchaseButton.className = "purchaseBtn";
          purchaseButton.addEventListener("click", () => {
            if (balance > limit) {
              alert("Pay your balance first ");
            } else {
              purchaseModal(playerName, Studio);
            }
          });
          actionBtns.appendChild(purchaseButton);

          actionsCell.appendChild(actionBtns);
          const editButton = document.createElement("img");
          editButton.src = "/public/editIcon.png";
          editButton.className = "editIcon";
          // editButton.id = index ;
          editButton.alt = "Edit";
          editButton.dataset.index = index;
          actionsCell.appendChild(editButton);

          const checkButton = document.createElement("img");
          checkButton.src = "/public/checkGif.gif";
          checkButton.className = "checkIcon";
          // checkButton.id = index ;
          checkButton.alt = "Edit";
          checkButton.dataset.index = index;
          actionsCell.appendChild(checkButton);

          const menuButton = document.createElement("img");
          menuButton.src = "/public/menuVertical.png";
          menuButton.className = "menuIcon";
          // menuButton.id = index ;
          menuButton.alt = "Menu";
          menuButton.dataset.index = index;
          actionsCell.appendChild(menuButton);

          editButton.addEventListener("click", (event) => {
            const rowIndex = event.target.dataset.index;
            const selectedRow = rows[rowIndex];
            handleEdit(selectedRow, rowElement); // Pass rowElement to handleEdit function
          });

          menuButton.addEventListener("click", (event) => {
            event.stopPropagation();
            const x = event.pageX - 120;
            const y = event.pageY;
            console.log(x, y);

            const menu = document.getElementById("menu");

            menu.style.display = "inline-flex";
            menu.style.left = `${x}px`;
            menu.style.top = `${y}px`;

            let menuIds = ["matchRecord", "topupRecord", "purchaseRecord"];
            menuIds.forEach((id) => {
              let menuItem = document.getElementById(id);
              menuItem.addEventListener("click", () => {
                let url = "";
                if (id === "matchRecord") url = `/frame?player=${playerName}`;
                if (id === "topupRecord")
                  url = `/record?studio=${studio}&security=${security}&history=topup&player=${playerName}`;
                if (id === "purchaseRecord")
                  url = `/record?studio=${studio}&security=${security}&history=purchase&player=${playerName}`;

                window.location.assign(url);
              });
            });
            document.body.addEventListener("click", () => {
              menu.style.display = "none";
            });
          });

          checkButton.addEventListener("click", (event) => {
            const rowIndex = event.target.dataset.index;
            const selectedRow = rows[rowIndex];
            handleCheck(selectedRow, rowElement); // Pass rowElement to handleEdit function
          });
        }
      });
    })
    .catch((error) => console.error("Error fetching player data:", error));
}

// Edit Handler Function

function handleEdit(row, rowElement) {
  console.log("Editing row:", row);

  // Get the input fields for player name and mobile number
  const playerNameInput = rowElement.querySelector("textarea");
  const mobileInput = rowElement.querySelector("input[type='number']");

  // Change className to writeInput and make them editable
  // playerNameInput.className = "writeInput";
  mobileInput.className = "writeInput";

  // playerNameInput.readOnly = false;
  mobileInput.readOnly = false;

  // Optionally, change the button to a "Save" or "Cancel" button after editing
  // Example to replace the edit button with a save button:
  const editButton = rowElement.querySelector(".editIcon");
  editButton.style.display = "none";
  const checkButton = rowElement.querySelector(".checkIcon");
  checkButton.style.display = "block";
}

// function for submiting the changed value

function handleCheck(row, rowElement) {
  const playerNameInput = rowElement.querySelector("textarea");
  const mobileInput = rowElement.querySelector("input[type='number']");

  let nameChanged = false;
  let mobileChanged = false;

  let playerName = row.Players;
  let playerMobile = row.MobileNo;

  let changedPlayerName = playerNameInput.value.trim(); // Get input value and trim whitespace
  let changedPlayerMobile = mobileInput.value.trim() || null; // Get input value and trim whitespace

  if (playerName != changedPlayerName) nameChanged = true;
  if (playerMobile != changedPlayerMobile) mobileChanged = true;

  if (!nameChanged && !mobileChanged) {
    Swal.fire({
      title: "No Changes Found",
      icon: "warning",
    });

    playerNameInput.className = "readOnlyInput";
    mobileInput.className = "readOnlyInput";

    playerNameInput.readOnly = true;
    mobileInput.readOnly = true;

    // Optionally, change the button to a "Save" or "Cancel" button after editing
    // Example to replace the edit button with a save button:
    const checkButton = rowElement.querySelector(".checkIcon");
    checkButton.style.display = "none";
    const editButton = rowElement.querySelector(".editIcon");
    editButton.style.display = "block";

    return;
  }

  let obj = {};
  obj.Sno = row.S_No;
  if (nameChanged) obj.name = changedPlayerName;
  if (mobileChanged) obj.mobile = changedPlayerMobile;

  editPlayer(obj);

  // Change className to writeInput and make them editable
  playerNameInput.className = "readOnlyInput";
  mobileInput.className = "readOnlyInput";

  playerNameInput.readOnly = true;
  mobileInput.readOnly = true;

  // Optionally, change the button to a "Save" or "Cancel" button after editing
  // Example to replace the edit button with a save button:
  const checkButton = rowElement.querySelector(".checkIcon");
  checkButton.style.display = "none";
  const editButton = rowElement.querySelector(".editIcon");
  editButton.style.display = "block";
}

async function editPlayer(data) {
  document.body.style.cursor = "wait";
  try {
    const response = await fetch("player/editPlayer", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Network response was not ok");
    }

    document.body.style.cursor = "default";
    Swal.fire({
      title: "Success!",
      text: "Player details updated successfully!",
      icon: "success",
      confirmButtonText: "OK",
      confirmButtonColor: "#01ab7a",
    });
    // updating the DOM for successful edit
    let rowElement = document.getElementById(`row-SP${data.Sno}`);
    // if (data.name) {
    //   rowElement.querySelector("textarea").value = data.name;
    // }
    if (data.mobile) {
      rowElement.querySelector("input[type='number']").value = data.mobile;
    }
    console.log();
  } catch (error) {
    document.body.style.cursor = "default";
    Swal.fire({
      icon: "error",
      title: "Oops...",
      text: error.message,
    }).then(() => {
      // Reload the page after SweetAlert is dismissed
      location.reload();
    });
  }
}

document.addEventListener("DOMContentLoaded", async function () {
  studio = decodeURIComponent(getCookie("studio"));
  security = getCookie("security");

  // removing adjustment from studio 111
  if (studio.toLowerCase() == "studio 111") {
    document.getElementById("adjustmentButton").style.display = "none";
    document.getElementById("history").style.display = "none";
  }
  // console.log("studio", studio);
  await fetchPlayerData(studio);
  populateItems();
  // console.log(playerData);

  document
    .getElementById("playerSearch")
    .addEventListener("input", function (e) {
      const searchValue = e.target.value.toLowerCase();
      const rows = document.querySelectorAll("#playersTable tbody tr");

      rows.forEach((row) => {
        const playerName = row.querySelector("textarea").value.toLowerCase();
        if (playerName.includes(searchValue)) {
          row.style.display = "";
        } else {
          row.style.display = "none";
        }
      });
    });

  // Add event listener to the Adjustment buttonF to show the modal
  const adjustmentButton = document.getElementById("adjustmentButton");
  if (adjustmentButton) {
    adjustmentButton.addEventListener("click", function () {
      const modal = document.getElementById("adjustmentModal");
      modal.style.display = "block";
      populatePlayerNames();
    });
  }

  // Add event listener to the close button of the modal to hide the modal
  const closeAdjustmentModalButton = document.querySelector(
    "#adjustmentModal .close"
  );
  if (closeAdjustmentModalButton) {
    closeAdjustmentModalButton.addEventListener("click", function () {
      const modal = document.getElementById("adjustmentModal");
      modal.style.display = "none";
    });
  }

  // Add event listener to the form submit event to handle adjusting balance
  const adjustmentForm = document.getElementById("adjustmentForm");
  if (adjustmentForm) {
    adjustmentForm.addEventListener("submit", function (e) {
      e.preventDefault();
      const winnerName = document.getElementById("winnerName").value;
      const loserName = document.getElementById("loserName").value;
      const amount = document.getElementById("amount").value;
      let detailObj = {
        winnerName: winnerName,
        loserName: loserName,
        amount: amount,
        studio: decodeURIComponent(studio),
      };
      Adjust(detailObj);
      // Call the function to record the adjustment
      recordAdjustment(winnerName, loserName, amount);

      // Hide the modal after submission
      const modal = document.getElementById("adjustmentModal");
      modal.style.display = "none";

      // Clear the input fields
      document.getElementById("winnerName").value = "";
      document.getElementById("loserName").value = "";
      document.getElementById("amount").value = "";
    });
  }
  function Adjust(detailObj) {
    if (detailObj) {
      let data = detailObj;
      console.log(data);

      try {
        loaderInstance.showLoader();

        fetch("/player/adjustment", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        }).then((resp) => {
          loaderInstance.hideLoader();
          console.log(resp);

          if (!resp.ok) {
            throw new Error("Network response was not ok");
          }
          alert("adjustment done ");
          // return resp.json();
        });
      } catch (error) {
        loaderInstance.hideLoader();
        console.error("Fetch error:", error);
        alert("Failed to adjust. Please try again.");
      }
      location.reload();
    } else {
      alert("please enter correct details ");
    }
  }

  // Add event listener to the Back button
  const backButton = document.getElementById("backButton");
  if (backButton) {
    backButton.addEventListener("click", function () {
      history.back();
    });
  }

  // Add event listener to the Add Player button to show the modal
  const addPlayerButton = document.getElementById("addPlayerButton");
  if (addPlayerButton) {
    addPlayerButton.addEventListener("click", function () {
      const modal = document.getElementById("addPlayerModal");
      modal.style.display = "block";
    });
  }

  // Add event listener to the close button of the modal to hide the modal
  const closeModalButton = document.querySelector("#addPlayerModal .close");
  if (closeModalButton) {
    closeModalButton.addEventListener("click", function () {
      const modal = document.getElementById("addPlayerModal");
      modal.style.display = "none";
    });
  }

  // Add event listener to the form submit event to handle adding a new player
  const addPlayerForm = document.getElementById("addPlayerForm");
  if (addPlayerForm) {
    addPlayerForm.addEventListener("submit", function (e) {
      e.preventDefault();
      const playerName = document.getElementById("playerName").value.trim();
      const playerMobile =
        document.getElementById("playerMobile").value || null;

      let isValidInput = checkInput(playerMobile, playerName);
      if (isValidInput) {
        addPlayer(playerMobile, playerName, decodeURIComponent(studio));

        // After adding the player, hide the modal
        const modal = document.getElementById("addPlayerModal");
        modal.style.display = "none";

        // Clear the input fields
        document.getElementById("playerName").value = "";
        document.getElementById("playerMobile").value = "";
      }
    });
  }
});
async function populateItems() {
  let data = await fetchData("masteritem", studio);
  let items = document.getElementById("items");
  // items.innerHTML= "";
  data.forEach((row) => {
    let button = document.createElement("button");
    button.innerText = row.itemName;
    button.value = row.Price;
    button.className = "item-btn";
    items.append(button);
  });
}
function populatePlayerNames() {
  const playersInputs = document.querySelectorAll("#winnerName ,#loserName");
  console.log(playersInputs);

  // Fetch data from the spreadsheet
  fetchData("masterplayer", studio).then((data) => {
    // Extract player names from column D (index 79) and filter out any falsy values
    console.log(data);

    const playerNames = [
      "Players ",
      ...data.map((row) => row.Players).filter(Boolean),
    ];
    console.log(playerNames);
    // const playerNames = data.map((row) => row[79]).filter(Boolean);

    // Get the list of player names from the input fields to avoid adding them to the datalist
    const playerNameInputs = Array.from(playersInputs).map((input) =>
      input.value.trim()
    );

    playersInputs.forEach((select) => {
      console.log(select.value);

      const currentValue = select.value;

      // Clear existing options in the select
      select.innerHTML = "";

      // Create and append a default empty option
      const defaultOption = document.createElement("option");
      defaultOption.value = "";
      defaultOption.textContent = "Select player name";
      defaultOption.disabled = true;
      select.appendChild(defaultOption);

      // Add new player names to the select
      playerNames.forEach((name) => {
        const trimmedName = name.trim();
        // Check if the name is not empty and not already in the input fields, then add it
        if (trimmedName !== "" && !playerNameInputs.includes(trimmedName)) {
          const optionElement = document.createElement("option");
          optionElement.value = trimmedName;
          optionElement.textContent = trimmedName;
          if (trimmedName === currentValue) {
            optionElement.selected = true;
          }
          select.appendChild(optionElement);
        }
      });

      // Add player names from input fields to the select
      playerNameInputs.forEach((name) => {
        const trimmedName = name.trim();
        if (trimmedName !== "") {
          const optionElement = document.createElement("option");
          optionElement.value = trimmedName;
          optionElement.textContent = trimmedName;
          if (trimmedName === currentValue) {
            optionElement.selected = true;
          }
          select.appendChild(optionElement);
        }
      });
      // intializing select2
      $(select).select2({
        placeholder: "Select player name",
        allowClear: true,
      });
      // $(select).val(null).trigger('change');
    });
  });
}

function historyRedirect() {
  const record = document.getElementById("history").value;
  console.log(record);
  if (record) {
    window.open(
      `/record?studio=${studio}&security=${security}&history=${record}`,
      "_blank"
    );
  }
}

// Function to check if the input values are valid
function checkInput(mobile, name) {
  if (!name || !name.match(/^[A-Za-z]+(?: [A-Za-z]+)*$/)) {
    alert("Name should contain only alphabets and single spaces between words");
    return false;
  }
  if (mobile && mobile.length !== 10) {
    alert("Please enter a valid 10 digit mobile number");
    return false;
  }
  return true;
}

async function addPlayer(mobile, name, studio) {
  let data = { mobile: mobile, name: name, studio: studio };
  try {
    loaderInstance.showLoader();
    const response = await fetch("player/addPlayer", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    loaderInstance.hideLoader();

    if (!response.ok) {
      // Handle non-2xx HTTP responses
      const errorData = await response.json();

      throw new Error(errorData.msg || "Network response was not ok");
    }

    const result = await response.json();
    console.log(result);

    alert(result.msg);

    // Reload the page only after a successful operation
    location.reload();
  } catch (error) {
    loaderInstance.hideLoader();
    console.error("Fetch error:", error);
    alert(error || "Failed to add player. Please try again.");
  }
}

async function fetchData(table, Studio) {
  const url = `apis/data/${table}/${Studio}`;
  console.log(url);
  const response = await fetch(url);
  const data = await response.json();
  return data[0];
}

function topupModal(playerId, Studio) {
  const modal = document.getElementById("topUpModal");
  modal.style.display = "block";
  const tableBody = document
    .getElementById("playersTable")
    .getElementsByTagName("tbody")[0];

  const row = tableBody.querySelector(`#row-${playerId}`);
  console.log("row", row);
  let playerName = row.querySelector("textarea").value;
  console.log("playerName", playerName);
  let lastTotal = row.querySelector(`#balance-${playerId}`).textContent;
  console.log("lastTotal", lastTotal);

  const title = document.querySelectorAll(".modal-title")[2];
  title.textContent = `Topup for ${playerName}`;

  let topupForm = document.getElementById("topupForm");

  const closetopUpModalButton = document.querySelector("#topUpModal .close");
  if (closetopUpModalButton) {
    closetopUpModalButton.addEventListener("click", function () {
      playerName = "";
      const amountInput = document.getElementById("topupAmount");
      amountInput.value = null;
      const mode = document.querySelector('input[name="paymentType"]:checked');

      const modal = document.getElementById("topUpModal");
      modal.style.display = "none";

      topupForm.removeEventListener("submit", handleSubmit);
    });
  }
  console.log("topupForm", topupForm);

  let handleSubmit = (e) => {
    e.preventDefault();
    const amount = document.getElementById("topupAmount").value;
    const mode = document.querySelector(
      'input[name="paymentType"]:checked'
    ).value;
    let detailObj = {
      playerId: playerId.replace("SP", ""),
      name: playerName,
      studio: Studio,
      amount: amount,
      mode: mode,
      lastBalance: lastTotal,
    };
    console.log(detailObj);

    topUpBalance(detailObj);
  };
  if (topupForm) {
    topupForm.addEventListener("submit", handleSubmit);
  }
}

async function topUpBalance(detailObj) {
  if (detailObj) {
    let data = detailObj;
    try {
      loaderInstance.showLoader();

      const resp = await fetch("/player/topup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      loaderInstance.hideLoader();

      let respData = await resp.json();
      console.log("respData", respData);
      if (!resp.ok) {
        // Swal.fire({
        //   icon: "error",
        //   title: "Oops...",
        //   text: "Failed to top up. Please try again."
        // });
        alert("Failed to top up. Please try again.");
        throw new Error("Network response was not ok");
      }

      console.log("responseData", respData);

      alert("Top-up added successfully!");
      if (studio == "Studio 313" || studio == "Studio 810") {
        printReceipt(respData.data);
      }
      location.reload();
    } catch (error) {
      loaderInstance.hideLoader();
      console.error("Fetch error:", error);
      alert("Failed to top up. Please try again.");
    }
  } else {
    alert("Please enter the amount.");
  }
}

function printReceipt(receiptData) {
  const {
    playerName,
    clubName,
    mode,
    lastBalance,
    frameTotal,
    purchaseTotal,
    topupAmount,
  } = receiptData;

  const totalBalance =
    parseInt(lastBalance) + parseInt(purchaseTotal) + parseInt(frameTotal);
  const newBalance = totalBalance - parseInt(topupAmount);

  // Prepare receipt content
  const receiptContent = `
    <div style="font-family: monospace; text-align: center; padding: 10px;" id="receipt">
      <h2>${clubName}</h2>
      <p>------------------------------------</p>
      <p><strong>Player Name:</strong> ${playerName}</p>
      <p><strong>Previous Balance:</strong> Rs. ${lastBalance}</p>
      <p><strong>Frame Total:</strong> Rs. ${frameTotal}</p>
      <p><strong>Purchase Total:</strong> Rs. ${purchaseTotal}</p>
      <p><strong>Top-up Amount:</strong> Rs. ${topupAmount}</p>
      <p><strong>Total Balance:</strong> Rs. ${totalBalance}</p>
      <br>
      <p><strong>Current Balance:</strong> ${newBalance}</p>
      <p><strong>Mode of Payment:</strong> ${mode}</p>
      <p>------------------------------------</p>
      <p><strong>Thank you for playing! 😊</strong></p>
    </div>
  `;

  // Open a new window and print the receipt
  const newWindow = window.open("", "_blank", "width=400,height=600");
  newWindow.document.write(receiptContent);
  newWindow.document.close();
  // const logoImage = newWindow.document.getElementById("logo");
  // logoImage.onload = () => {
  // };
  newWindow.print();
  newWindow.close();
}

function purchaseModal(playerName, Studio) {
  const modal = document.getElementById("purchaseModal");
  modal.style.display = "block";

  const title = document.querySelectorAll(".modal-title")[3];
  title.textContent = `Purchase for ${playerName} `;

  const closepurchaseModalButton = document.querySelector(
    "#purchaseModal .close"
  );

  let handleClick = (e) => {
    e.preventDefault();
    const purchaseItem = document.getElementById("purchaseItem");
    purchaseItem.value += `${e.target.innerHTML},`;
    const purchaseAmount = document.getElementById("purchaseAmount");
    let currentAmount = parseInt(purchaseAmount.value) || 0; // Get the current amount, default to 0 if NaN
    let newAmount = currentAmount + parseInt(e.target.value);
    purchaseAmount.value = newAmount;
    console.log(typeof parseInt(e.target.value), e.target.innerHTML);
  };

  const item_btn = document.getElementsByClassName("item-btn");
  console.log(item_btn);
  Array.from(item_btn).forEach((item) => {
    item.removeEventListener("click", handleClick);
    item.addEventListener("click", handleClick);
  });

  const purchase = document.getElementById("purchase");

  if (closepurchaseModalButton) {
    closepurchaseModalButton.addEventListener("click", function () {
      purchaseItem.value = "";
      purchaseAmount.value = "";
      playerName = "";
      const modal = document.getElementById("purchaseModal");
      modal.style.display = "none";
      purchase.removeEventListener("click", purchaseHandler);
    });
  }
  // const purchaseForm = document.getElementById("purchaseForm");

  let purchaseHandler = (e) => {
    e.preventDefault();
    const amount = document.getElementById("purchaseAmount").value;
    const item = document.getElementById("purchaseItem").value;
    let detailObj = {
      name: playerName,
      studio: decodeURIComponent(Studio),
      amount: amount,
      item: item,
    };
    makePurchase(detailObj);
  };
  purchase.removeEventListener("click", purchaseHandler);
  if (purchase) {
    purchase.addEventListener("click", purchaseHandler);
  }
}

function makePurchase(detailObj) {
  if (detailObj) {
    let data = detailObj;
    try {
      loaderInstance.showLoader();

      fetch("/player/purchase", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      }).then((resp) => {
        loaderInstance.hideLoader();
        if (!resp.ok) {
          alert("Failed to make purchase. Please try again.");
          throw new Error("Network response was not ok");
        }
        alert("Purchase done successfully.");
        // return resp.json();
      });
    } catch (error) {
      loaderInstance.hideLoader();
      console.error("Fetch error:", error);
      alert("Failed to Purchase. Please try again.");
    }
    location.reload();
  } else {
    alert("Please enter the amount ");
  }
}

// Function to record adjustment
function recordAdjustment(winnerName, loserName, amount) {
  console.log("Adjustment Recorded:");
  console.log("Winner Name:", winnerName);
  console.log("Loser Name:", loserName);
  console.log("Amount:", amount);
}

function applyFilter() {
  const filterValue = document
    .getElementById("playerFilter")
    .value.toLowerCase();
  const tableBody = document
    .getElementById("playersTable")
    .getElementsByTagName("tbody")[0];
  const rows = tableBody.getElementsByTagName("tr");

  for (let i = 0; i < rows.length; i++) {
    let playerName = rows[i].getElementsByTagName("td")[0].textContent;
    if (playerName.toLowerCase().indexOf(filterValue) > -1) {
      rows[i].style.display = "";
    } else {
      rows[i].style.display = "none";
    }
  }
}
let balanceSortAsc = false; // Make sure this is in global scope

document.getElementById("balanceHeader").addEventListener("click", function () {
  const table = document.querySelector("table");
  const tbody = table.querySelector("tbody");

  if (!tbody) {
    console.error("No <tbody> found in the table.");
    return;
  }

  const rows = Array.from(tbody.querySelectorAll("tr"));

  const getBalanceValue = (row) => {
    const cell = row.children[3]; // Ensure this is the right index!
    const text = cell.textContent || "";
    const number = parseInt(text.replace(/[^\d-]/g, ""), 10);
    return isNaN(number) ? 0 : number;
  };

  const sortedRows = rows.sort((a, b) => {
    const valA = getBalanceValue(a);
    const valB = getBalanceValue(b);
    return balanceSortAsc ? valA - valB : valB - valA;
  });

  tbody.innerHTML = "";
  sortedRows.forEach((row) => tbody.appendChild(row));

  balanceSortAsc = !balanceSortAsc;

  const arrow = document.getElementById("balanceArrow");
  if (arrow) arrow.textContent = balanceSortAsc ? "↑" : "↓";
});
