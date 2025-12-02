async function fetchData(table, studio) {
  const url = `apis/data/${table}/${studio}`;
  const response = await fetch(url);
  const data = await response.json();
  return data[0];
}

let getCookie = (name)=>{
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
}

const clubName = getCookie("clubName");
const studio = getCookie("studio");
let toggle = document.getElementById("toggle");
let date = document.getElementById("dateFilter");
// console.log(date);

// let dateValue = date.value;
// console.log(dateValue);
toggle.addEventListener("change", async () => handleFitlerChange());

date.addEventListener("input", () => {
  handleFitlerChange();
});

let heading = document.getElementById("heading");
heading.innerHTML = `${clubName}`;
heading.style.textTransform = "capitalize";

let dateConverter = (dateString)=>{
  let date = new Date(dateString)
  let year = `${date.getFullYear()}`;
  let day = date.getDate() >9 ? `${date.getDate()}` : `0${date.getDate()}` ;
  let month = date.getMonth() >9 ? `${date.getMonth()+1}` : `0${date.getMonth()+1}` ;
  let newDate = `${year}-${month}-${day}`;
  return newDate ;
}

async function handleFitlerChange() {
  let clubDetails = document.getElementById("clubDetail");
  clubDetails.innerHTML = "";

  if (toggle.checked) {
    console.log("checked");
    let date = document.getElementById("dateFilter");
    date.style.display = "block";
    let dateValue = date.value;
    let data = await fetchData("studioDaily", studio);
    console.log(data);
    console.log(dateValue);
    if (dateValue) {
      console.log("if");

      data = data.filter((row) => {
        rowDate = new Date(row.Date);
        newDate = dateConverter(rowDate);
        console.log("newDate", newDate);
        return newDate == dateValue;
      });
      displayClubDetails(data[0],true);
    } else {
      console.log("else");
      displayClubDetails(data[data.length - 1],true);
    }
  } else {
    console.log("unchecked");
    document.getElementById("dateFilter").style.display = "none";

    let data = await fetchData("masterstudio", studio);
    console.log(data);

    displayClubDetails(data[0],false);
  }
}
// document.addEventListener("DOMContentLoaded", async () => {
//   handleFitlerChange();
// });

async function displayClubDetails(data,datewise) {

  const clubDetailsContainer = document.getElementById("clubDetail");

  if(datewise){
    const dateElement = document.createElement("p");
    rowDate = new Date(data.Date);
    newDate = dateConverter(rowDate);

    dateElement.innerText = `Date: ${newDate}`;
  clubDetailsContainer.appendChild(dateElement);
  }
  const clubElement = document.createElement("p");
  clubElement.innerText = `ClubName : ${clubName.toUpperCase()}`;
  // clubDetailsContainer.appendChild(clubElement);
  const detailElement = document.createElement("p");
  detailElement.innerText = `Table Money: ${data.table_money ||data.Table_money || 0}`;
  clubDetailsContainer.appendChild(detailElement);
  const detailElement2 = document.createElement("p");
  detailElement2.innerText = `Goods : ${data.Goods || 0}`;
  clubDetailsContainer.appendChild(detailElement2);
  const detailElement3 = document.createElement("p");
  detailElement3.innerText = `Received: ${data.Received || data.Recieved || 0}`;
  clubDetailsContainer.appendChild(detailElement3);
  const detailElement4 = document.createElement("p");
  detailElement4.innerText = `Credit_Balance: ${data.Credit_Balance || 0}`;
  clubDetailsContainer.appendChild(detailElement4);
}

async function createTableWisePerformanceGraph() {
  const clubName = getCookie("clubName");
  const studio = getCookie("studio");
  const data = await fetchData("tabledets", studio);
  console.log(data);

  const tables = data.map((row) => row.table_id);
  console.log(tables);
  const occupancy = data.map((row) => row.total_duration);
  const tableStatus = data.map((row) => row.status);
  console.log("tableStatus", tableStatus);

  // Set bar colors based on table status
  const barColors = tableStatus.map((status) =>
    status === 1 ? "#01AB7A" : "#CCCCCC"
  );
  console.log(barColors);

  createGraph(
    occupancy,
    tables,
    "tableWisePerformanceChart",
    "Table's Performance",
    barColors
  );
}
async function createSlotWisePerformanceGraph() {
  const clubName = getCookie("clubName");
  const studio = getCookie("studio");
  const data = await fetchData("tabledets", studio);
  console.log(data);

  let slots = [];
  let duration = new Array(12).fill(0);
  let arr = [4,5,6,7,8,9,10,11,12,1,2,3]
  arr.forEach( (i)=>{
    slots.push(`Slot${i}_duration`)

  })
  data.forEach((row) => {
    slots.forEach((slot, index) => {
      duration[index] += row[slot] || 0;
    });
  });

  console.log(slots, duration);

  createGraph(
    duration,
    slots,
    "slotWisePerformanceChart",
    "Slots's Duration",
    null
  );
}

async function createDateWisePerformanceGraph() {
  const clubName = getCookie("clubName");
  const data = await fetchData("studioDaily", studio);

  const dates = data.map((row) => {
    date = new Date(row.Date);
    newDate = dateConverter(date);
    console.log(newDate);

    return newDate;
  });
  const occupancy = data.map((row) => row.duration);
  const dayOfWeek = data.map((row) => row.Day);

  console.log(dates, occupancy, dayOfWeek);

  // Prepare datasets for maximum and average values
  const maxValues = [];
  const avgValues = [];
  const barColorsMax = [];
  const barColorsAvg = [];

  dates.forEach((date, index) => {
    if (!isNaN(date) && dayOfWeek[index] === "Max") {
      maxValues.push(occupancy[index]); // Maximum value
      avgValues.push(date); // Average value (from the date column)
      barColorsMax.push("#A0A0A0"); // Grey color for maximum
      barColorsAvg.push("#2196F3"); // Blue color for average
    } else {
      maxValues.push(occupancy[index]); // Regular value
      avgValues.push(null); // No average value
      barColorsMax.push(dayOfWeek[index] === "Sunday" ? "#F6AE2D" : "#01AB7A"); // Color based on day
      barColorsAvg.push("rgba(0,0,0,0)"); // Transparent for average
    }
  });

  createDualGraph(
    maxValues,
    avgValues,
    dates,
    "dateWisePerformanceChart",
    "Club Performance",
    barColorsMax,
    barColorsAvg
  );
}

function createGraph(data, labels, canvasId, graphTitle, backgroundColors) {
  var ctx = document.getElementById(canvasId).getContext("2d");
  var myChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: graphTitle,
          data: data,
          backgroundColor: backgroundColors || "#01AB7A", // Use provided colors or default color
          borderColor: "#018a5e",
          borderWidth: 1,
        },
      ],
    },
    options: {
      scales: {
        y: {
          beginAtZero: true,
          display: canvasId !== "dateWisePerformanceChart", // Hide axis for 'dateWisePerformanceChart'
        },
      },
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          callbacks: {
            title: function (context) {
              return `Details for ${labels[context[0].dataIndex]}`;
            },
          },
        },
      },
      title: {
        display: true,
        text: graphTitle,
        font: {
          size: 18,
          weight: "bold",
        },
        color: "#01AB7A",
      },
    },
  });
}
function createGraph2(data, labels, canvasId, graphTitle, backgroundColors) {
  var ctx = document.getElementById(canvasId).getContext("2d");
  var myChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: graphTitle,
          data: data,
          backgroundColor: backgroundColors || "#01AB7A", // Use provided colors or default color
          borderColor: "#018a5e",
          borderWidth: 1,
        },
      ],
    },
    options: {
      scales: {
        y: {
          beginAtZero: true,
          display: canvasId !== "dateWisePerformanceChart", // Hide axis for 'dateWisePerformanceChart'
        },
      },
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          callbacks: {
            title: function (context) {
              return `Details for ${labels[context[0].dataIndex]}`;
            },
          },
        },
      },
      title: {
        display: true,
        text: graphTitle,
        font: {
          size: 18,
          weight: "bold",
        },
        color: "#01AB7A",
      },
    },
  });
}

function createDualGraph(
  maxData,
  avgData,
  labels,
  canvasId,
  graphTitle,
  backgroundColorsMax,
  backgroundColorsAvg
) {
  var ctx = document.getElementById(canvasId).getContext("2d");
  var myChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Maximum",
          data: maxData,
          backgroundColor: backgroundColorsMax,
        },
        {
          label: "Average",
          data: avgData,
          backgroundColor: backgroundColorsAvg,
        },
      ],
    },
    options: {
      scales: {
        y: {
          beginAtZero: true,
        },
      },
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          callbacks: {
            title: function (context) {
              return `Details for ${labels[context[0].dataIndex]}`;
            },
          },
        },
      },
      title: {
        display: true,
        text: graphTitle,
        font: {
          size: 18,
          weight: "bold",
        },
        color: "#01AB7A",
      },
    },
  });
}

function getParameterByName(name, url = window.location.href) {
  name = name.replace(/[\[\]]/g, "\\$&");
  const regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)");
  const results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return "";
  return decodeURIComponent(results[2].replace(/\+/g, " "));
}

window.onload = function () {
  displayClubDetails();
  createTableWisePerformanceGraph();
  createDateWisePerformanceGraph();
};

// Rest of your code remains the same

window.onload = function () {
  handleFitlerChange();
  createTableWisePerformanceGraph();
  createSlotWisePerformanceGraph();
  createDateWisePerformanceGraph();
};
