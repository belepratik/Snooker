const urlParams = new URLSearchParams(window.location.search);
const studio = urlParams.get("studio");
const player = urlParams.get("player");
const history = urlParams.get("history");
const security = urlParams.get("security");
// console.log("security",security);

async function check(security, studio) {
  const url = `apis/data/${"masterstudio"}/${studio}`;
  console.log(url);
  const response = await fetch(url);
  let data = await response.json();
  data = data[0];

  let found = false;
  if (security == data[0].SecurityKey) {
    found = true;
  }
  return found;
}

let applyFilter = async (all) => {
  let type = "";
  if (history == "topup" || history == "purchase") type = "topupPurchase";

  if (history == "adjustment") type = "adjustment";

  let access = await check(security, studio);

  if (access) {
    let success = document.getElementById("success");
    success.style.display = "block";

    if (all) {
      loadValue = null;
      loadButton.style.display = "none";
    } else {
      loadValue = document.getElementById("loadButton").value;
    }

    var endpoint;

    if (history == "topup") {
      let topupPurchase = document.querySelector(".topupPurchase");
      topupPurchase.style.display = "block";

      let modeDiv = document.getElementById("modeDiv");
      modeDiv.style.display = "block";

      let heading = document.getElementById("heading");
      heading.innerText = "TopUp History";

      let th = document.getElementById("mode/item");
      th.innerText = "Mode";

      endpoint = `/record/topup/${studio}/${loadValue}`;
    }
    if (history == "purchase") {
      let topupPurchase = document.querySelector(".topupPurchase");
      topupPurchase.style.display = "block";

      let heading = document.getElementById("heading");
      heading.innerText = "Purchase History";

      let th = document.getElementById("mode/item");
      th.innerText = "Item";

      endpoint = `/record/purchase/${studio}/${loadValue}`;
    }
    if (history == "adjustment") {
      let heading = document.getElementById("heading");
      heading.innerText = "Adjustment History";

      let adjustment = document.querySelector(".adjustment");
      adjustment.style.display = "block";

      endpoint = `/record/adjustment/${studio}/${loadValue}`;
    }

    let datas = await fetchData(endpoint);

    let playerFilter =
      document.getElementById("nameFilter").value.toLowerCase() || null;

    let operatorFilter =
      document.getElementById("opNameFilter").value.toLowerCase() || null;

    let startDateFilter =
      document.getElementById("startDateFilter").value || null;

    let endDateFilter = document.getElementById("endDateFilter").value || null;

    let modefilter = document.getElementById("modeSelect").value || null;

    let filterData = datas;

    if (playerFilter) {
      if (history == "topup" || history == "purchase") {
        filterData = filterData.filter(
          (item) =>
            item.UserName &&
            item.UserName.toLowerCase().includes(playerFilter.toLowerCase())
        );
      }
      if (history == "adjustment") {
        filterData = filterData.filter(
          (item) =>
            item.winner.toLowerCase().includes(playerFilter) ||
            item.losser.toLowerCase().includes(playerFilter)
        );
      }
    }

    if (operatorFilter) {
      filterData = filterData.filter((item) => {
        if (item.operator) {
          return item.operator.toLowerCase() == operatorFilter;
        }
        return false;
      });
    }

    if (startDateFilter) {
      filterData = filterData.filter((item) => {
        let startDate = new Date(startDateFilter);
        let filterDate = new Date(item.RecordDate || item.recordDate);
        return filterDate > startDate;
      });
    }
    if (endDateFilter) {
      filterData = filterData.filter((item) => {
        let endDate = new Date(endDateFilter);
        let filterDate = new Date(item.RecordDate);
        return filterDate < endDate;
      });
    }
    if (modefilter) {
      filterData = filterData.filter((item) => {
        return item.Mode == modefilter;
      });
    }
    populate(filterData, type);
  }
};

if (player) {
  document.getElementById("nameFilter").value = player;
  applyFilter(true);
} else {
  applyFilter(false);
}

let addInventoryBtn = document.getElementById("addInventory");

addInventoryBtn.addEventListener("click", async () => {
  const { value: itemData } = await Swal.fire({
    title: "Add Item",
    html: `
        <input id="itemName" class="swal2-input" placeholder="Enter Item Name" required>
        <input id="itemPrice" type="number" class="swal2-input" placeholder="Enter price in Rs." min="0" required>
        <input id="itemStock" type="number" class="swal2-input" placeholder="Enter Available Stocks" min="0" required>
      `,
    focusConfirm: false,
    confirmButtonText: "Add Item",
    preConfirm: () => {
      let itemName = document.getElementById("itemName").value;
      let itemPrice = document.getElementById("itemPrice").value;
      let itemStock = document.getElementById("itemStock").value;

      if (
        itemName.trim() === "" ||
        itemPrice.trim() === "" ||
        itemStock.trim() === ""
      ) {
        Swal.fire("Please fill all the fields");
        return null;
      }
      return [
        {
          itemName: itemName,
          itemPrice: itemPrice,
          itemStock: itemStock,
        },
      ];
    },
  });
  if (itemData) {
    changeData("/studio/addItem", itemData[0]);
  }
});

let addExpenseBtn = document.getElementById("addExpense");
addExpenseBtn.addEventListener("click", async () => {
  const { value: formValues } = await Swal.fire({
    title: "Add Expense",
    html: `
        <input id="expense" type="number" class="swal2-input" placeholder="Enter expense" min="0" required>
        <textarea id="description" class="swal2-textarea" rows = 2 placeholder="Enter Description"></textarea>
      `,
    focusConfirm: false,
    confirmButtonText: "Add Expense",
    preConfirm: () => {
      let expense = document.getElementById("expense").value;
      let description = document.getElementById("description").value;
      if (expense == "" || description == "") {
        Swal.showValidationMessage("Please fill all the fields");
        return null;
      } else {
        return [
          {
            expense: expense,
            description: description,
          },
        ];
      }
    },
  });
  if (formValues) {
    askPassword(formValues);
  }
});

let askPassword = async (formValues) => {
  const { value: password } = await Swal.fire({
    title: "Enter your password",
    input: "password",
    inputPlaceholder: "Enter your password",
    inputAttributes: {
      autocapitalize: "off",
      autocorrect: "off",
    },
  });
  if (password) {
    formValues[0].password = password;
    console.log("formValues", formValues);
    await changeData("/studio/addExpense", formValues);
  }
};

let changeData = async (endpoint, data) => {
  let url = endpoint;
  console.log(endpoint, "endpoint in changeData");

  try {
    let res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // Include cookies for authentication
      body: JSON.stringify(data),
    });

    // Parse JSON response
    let response = await res.json();
    console.log(response.message);

    if (response.success) {
      Swal.fire({
        title: "Success!",
        text: "Item added successfully!",
        icon: "success",
        confirmButtonText: "OK",
        confirmButtonColor: "#01ab7a",
      });
      window.location.reload();
    } else {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: response.message,
      });
    }
  } catch (error) {
    console.error("Error adding item :", error);
    Swal.fire({
      icon: "error",
      title: "Oops...",
      text: error.message,
    });
  }
};

async function fetchData1(table, Studio) {
  const url = `apis/data/${table}/${Studio}`;
  const response = await fetch(url);
  const data = await response.json();
  return data[0];
}
let createStocksTable = async () => {
  let data = await fetchData1("masteritem", studio);
  let stdata = await fetchData1("masterstudio", studio);
  console.log(stdata);

  // Create table body rows
  const table = document.getElementsByClassName("stocks")[0];
  console.log(table);

  table.style.display = "block";
  // table.style.width = "100%";
  const tbody = document.getElementById("stocksTableBody");

  data.forEach((rowData) => {
    const sno = rowData.sno;
    const row = document.createElement("tr");
    row.id = `row-${sno}`;

    const SNo = document.createElement("td");
    SNo.textContent = rowData.sno;
    row.appendChild(SNo);

    const itemName = document.createElement("td");
    itemName.textContent = rowData.itemName;
    row.appendChild(itemName);

    const Price = document.createElement("td");
    Price.textContent = `Rs. ${rowData.Price}`;
    row.appendChild(Price);

    const Stocks = document.createElement("td");
    Stocks.className = "stocks_row";
    const stockInp = document.createElement("input");
    stockInp.type = "number";
    stockInp.min = 0;
    stockInp.required = true;
    stockInp.value = rowData.Stocks;
    stockInp.id = rowData.itemName;
    stockInp.className = "readOnlyInput";
    stockInp.readOnly = true;
    Stocks.appendChild(stockInp);
    const addImg = document.createElement("img");
    addImg.src = "public/add.png";
    addImg.className = "addIcon";
    addImg.id = `add_${sno}`;
    Stocks.appendChild(addImg);
    const checkImg = document.createElement("img");
    checkImg.src = "public/checkGif.gif";
    checkImg.className = "checkIcon";
    checkImg.style.display = "none";
    checkImg.id = `check_${sno}`;
    Stocks.appendChild(checkImg);
    row.appendChild(Stocks);

    addImg.addEventListener("click", async (e) => {
      handleAddStocks(row, rowData);
    });

    checkImg.addEventListener("click", async (e) => {
      await handleSubmit(row, rowData); // Call submit function
    });

    tbody.appendChild(row);
  });
};
if (history == "purchase") {
  createStocksTable();
  document.getElementById("actionBtns").style.display = "block";
}

let handleAddStocks = async (row, rowData) => {
  let oldStock = row.querySelector("input[type='number']");
  let addimg = row.querySelector("#add_" + rowData.sno);
  addimg.style.display = "none";

  let checkImg = row.querySelector("#check_" + rowData.sno);
  checkImg.style.display = "block";
  oldStock.className = "writeInput";
  oldStock.readOnly = false;
};

let handleSubmit = async (row, rowData) => {
  let newStock = row.querySelector("input[type='number']");
  let newStockValue = parseInt(newStock.value);

  if (newStockValue <= rowData.Stocks) {
    Swal.fire({
      title:
        newStockValue < rowData.Stocks
          ? "Available Stocks can't be less than previous value"
          : "No change in stocks",
      icon: "warning",
    });
    resetUI(row, rowData.Stocks);
    return;
  } else {
    let data = {
      stockSno: rowData.sno,
      stockAmount: newStockValue,
      stockName: rowData.itemName,
      prevStocks: rowData.Stocks,
    };

    let url = `/studio/stocksEdit`;
    try {
      let res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Include cookies for authentication
        body: JSON.stringify(data),
      });

      // Handle non-200 responses
      if (!res.ok) {
        throw new Error(`HTTP error! Status: ${res.status}`);
      }

      // Parse JSON response
      let response = await res.json();
      if (response.success) {
        Swal.fire({
          title: "Success!",
          text: "Stocks updated successfully!",
          icon: "success",
          confirmButtonText: "OK",
          confirmButtonColor: "#01ab7a",
        });
        resetUI(row, newStockValue); // Update UI
      } else {
        Swal.fire({
          icon: "error",
          title: "Oops...",
          text: response.message,
        });
        resetUI(row, rowData.Stocks); // Reset UI
      }
    } catch (error) {
      console.error("Error updating stocks:", error);
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: error.message,
      });
      resetUI(row, rowData.Stocks); // Reset UI
    }
  }
};

let resetUI = (row, value) => {
  let stockInput = row.querySelector("input[type='number']");
  stockInput.className = "readOnlyInput";
  stockInput.value = value;
  stockInput.readOnly = true;

  let addImg = row.getElementsByTagName("img")[0];
  addImg.style.display = "block";

  let checkImg = row.getElementsByTagName("img")[1];
  checkImg.style.display = "none";
};

let datas;
let loadButton = document.getElementById("loadButton");
loadButton.addEventListener("click", () => {
  let loadValue = parseInt(loadButton.value);
  loadValue += 12;
  loadButton.value = loadValue;
  console.log(typeof loadValue, loadValue);
  applyFilter(false);
});

async function fetchData(endpoint) {
  try {
    let res = await fetch(endpoint);
    if (!res.ok) {
      throw new Error(`HTTP error! Status: ${res.status}`);
    }
    let response = await res.json();
    let data = response.result;
    return data;
  } catch (error) {
    console.error("Error fetching data:", error);
    alert(error);
    return null;
  }
}

function localTime(Time) {
  let localTime = new Date(Time).toLocaleString().split(",");
  // console.log(localTime);
  let date = localTime[0].split("/");
  let time = localTime[1];
  let month = date[0];
  let day = date[1];
  let year = date[2];
  date = ` ${day}/${month}/${year}`;
  return date + " ," + time;
}
function populate(data, type) {
  console.log(`${type}TableBody`);

  const tableBody = document.getElementById(`${type}TableBody`);
  console.log(tableBody);

  tableBody.innerHTML = ""; // Clear existing rows
  let totalAmount = 0;
  history == "topup" ? (document.getElementById("BATM").style.display = "block") : null;

  data.forEach((item) => {
    const row = document.createElement("tr");
    if (type === "topupPurchase") {
      const recordIDCell = document.createElement("td");
      recordIDCell.textContent = item.RecordID;
      row.appendChild(recordIDCell);

      const recordDateCell = document.createElement("td");
      recordDateCell.textContent = localTime(item.RecordDate); // Format date if needed
      row.appendChild(recordDateCell);

      const userNameCell = document.createElement("td");
      userNameCell.textContent = item.UserName;
      row.appendChild(userNameCell);

      const modeCell = document.createElement("td");
      modeCell.textContent =
        history == "topup" ? item.Mode || "N/A" : item.Item || "None"; // Handle null or undefined values
      // Handle null or undefined values
      row.appendChild(modeCell);

      const operator = document.createElement("td");
      operator.textContent = item.operator || "N/A";
      row.appendChild(operator);
      
            if (history == "topup") {
              const lastBalanceCell = document.createElement("td");
              lastBalanceCell.textContent = `Rs. ${
                parseInt(item.lastTotal) - parseInt(item.Amount)
              }`;
              // totalAmount += parseFloat(item.Amount) || parseFloat(item.amount);
              row.appendChild(lastBalanceCell);
            }

      const topUpAmountCell = document.createElement("td");
      topUpAmountCell.textContent = `Rs. ${item.Amount || item.amount}`;
      totalAmount += parseFloat(item.Amount) || parseFloat(item.amount);
      row.appendChild(topUpAmountCell);

    } else if (type === "adjustment") {
      const recordIDCell = document.createElement("td");
      recordIDCell.textContent = item.recordID;
      row.appendChild(recordIDCell);

      const dateCell = document.createElement("td");
      dateCell.textContent = localTime(item.recordDate); // Format date if needed
      row.appendChild(dateCell);

      const winnerCell = document.createElement("td");
      winnerCell.textContent = item.winner;
      row.appendChild(winnerCell);

      const looserCell = document.createElement("td");
      looserCell.textContent = item.losser;
      row.appendChild(looserCell);

      const amountCell = document.createElement("td");
      amountCell.textContent = item.amount;
      totalAmount += parseFloat(item.amount);
      row.appendChild(amountCell);
    }

    tableBody.appendChild(row);
  });
  let totalRow = document.createElement("tr");
  totalRow.id = "totalRow";

  // Calculate column count dynamically based on rows
  let colCount = tableBody.rows[0].cells.length;

  // Create the "Total" cell aligned to the first column
  let totalCell = document.createElement("td");
  totalCell.innerText =
    type === "topupPurchase"
      ? `${
          history === "topup" ? "Total TopUp Amount" : "Total Purchase Amount"
        }`
      : "Total Adjustment Amount";

  // Span across all columns except the last one
  totalCell.colSpan = colCount - 1;
  totalCell.style.textAlign = "left"; // Align left
  totalRow.appendChild(totalCell);

  // Create the "Total Amount" cell aligned to the last column
  let totalAmountCell = document.createElement("td");
  totalAmountCell.innerText = `Rs. ${totalAmount.toFixed(2)}`;
  totalRow.appendChild(totalAmountCell);

  tableBody.appendChild(totalRow);
}
