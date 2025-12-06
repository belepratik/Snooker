// Investor Dashboard: Studio 111 - Table Money by Date Only
const studio = 'Studio 111';

async function fetchFramesData() {
  const url = `/apis/data/frames/${studio}`;
  const response = await fetch(url);
  return await response.json();
}

function processTableMoney(frames) {
  const dailyTotals = {};
  frames.forEach(frame => {
    const date = new Date(frame.StartTime).toISOString().slice(0, 10);
    const money = Number(frame.table_money || frame.Table_money || 0);
    dailyTotals[date] = (dailyTotals[date] || 0) + money;
  });
  const dates = Object.keys(dailyTotals).sort();
  const amounts = dates.map(date => dailyTotals[date]);
  return { dates, amounts };
}

function renderTableMoneyGraph(dates, amounts) {
  const ctx = document.getElementById('tableMoneyChart').getContext('2d');
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: dates,
      datasets: [{
        label: 'Table Money (₹)',
        data: amounts,
        backgroundColor: '#01AB7A'
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: true },
        title: { display: true, text: 'Table Money by Date' }
      }
    }
  });
}

window.onload = async function () {
  const frames = await fetchFramesData();
  const { dates, amounts } = processTableMoney(frames);
  renderTableMoneyGraph(dates, amounts);
};
const clubName = 'Studio 111';
let toggle = document.getElementById("toggle");
let date = document.getElementById("dateFilter");

const ctx = document.getElementById('expensesChart').getContext('2d');
date.addEventListener("input", () => { handleFitlerChange(); });

let heading = document.getElementById("heading");
heading.innerHTML = `Investor Dashboard`;
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
    let date = document.getElementById("dateFilter");
    date.style.display = "block";
    let dateValue = date.value;
    let data = await fetchData("studioDaily", studio);
    if (dateValue) {
      data = data.filter((row) => {
        rowDate = new Date(row.Date);
        newDate = dateConverter(rowDate);
        return newDate == dateValue;
      });
      displayClubDetails(data[0],true);
    } else {
      displayClubDetails(data[data.length - 1],true);
    }
  } else {
    document.getElementById("dateFilter").style.display = "none";
    let data = await fetchData("masterstudio", studio);
    displayClubDetails(data[0],false);
  }
}

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
  clubElement.innerText = `ClubName : Studio 111`;
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
  const data = await fetchData("tabledets", studio);
  const tables = data.map((row) => row.table_id);
  const occupancy = data.map((row) => row.total_duration);
  const tableStatus = data.map((row) => row.status);
  const barColors = tableStatus.map((status) => status === 1 ? "#01AB7A" : "#CCCCCC");
  createGraph(
    occupancy,
    tables,
    "tableWisePerformanceChart",
    "Table's Performance",
    barColors
  );
}

async function createSlotWisePerformanceGraph() {
  const data = await fetchData("tabledets", studio);
  let slots = [];
  let duration = new Array(12).fill(0);
  let arr = [4,5,6,7,8,9,10,11,12,1,2,3]
  arr.forEach( (i)=>{ slots.push(`Slot${i}_duration`) })
  data.forEach((row) => {
    slots.forEach((slot, index) => {
      duration[index] += row[slot] || 0;
    });
  });
  createGraph(
    duration,
    slots,
    "slotWisePerformanceChart",
    "Slots's Duration",
    null
  );
}

async function createDateWisePerformanceGraph() {
  const data = await fetchData("studioDaily", studio);
  const dates = data.map((row) => {
    date = new Date(row.Date);
    newDate = dateConverter(date);
    return newDate;
  });
  const occupancy = data.map((row) => row.duration);
  const dayOfWeek = data.map((row) => row.Day);
  // Prepare datasets for maximum and average values
  const maxValues = [];
  const avgValues = [];
  const barColorsMax = [];
  const barColorsAvg = [];
  dates.forEach((date, index) => {
    if (!isNaN(date) && dayOfWeek[index] === "Max") {
      maxValues.push(occupancy[index]);
      avgValues.push(date);
      barColorsMax.push("#A0A0A0");
      barColorsAvg.push("#2196F3");
    } else {
      maxValues.push(occupancy[index]);
      avgValues.push(null);
      barColorsMax.push(dayOfWeek[index] === "Sunday" ? "#F6AE2D" : "#01AB7A");
      barColorsAvg.push("rgba(0,0,0,0)");
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
          backgroundColor: backgroundColors || "#01AB7A",
          borderColor: "#018a5e",
          borderWidth: 1,
        },
      ],
    },
    options: {
      scales: {
        y: {
          beginAtZero: true,
          display: canvasId !== "dateWisePerformanceChart",
        },
      },
      plugins: {
        legend: { display: false },
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
        font: { size: 18, weight: "bold" },
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
        { label: "Maximum", data: maxData, backgroundColor: backgroundColorsMax },
        { label: "Average", data: avgData, backgroundColor: backgroundColorsAvg },
      ],
    },
    options: {
      scales: { y: { beginAtZero: true } },
      plugins: {
        legend: { display: false },
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
        font: { size: 18, weight: "bold" },
        color: "#01AB7A",
      },
    },
  });
}

// ...existing code...
  // Group by category
  const categoryTotals = {};
  expenses.forEach(row => {
    const cat = row.category || row.Category || 'Other';
    categoryTotals[cat] = (categoryTotals[cat] || 0) + Number(row.amount || row.Amount || 0);
  });
  const categories = Object.keys(categoryTotals);
  const amounts = categories.map(cat => categoryTotals[cat]);
  new Chart(ctx, {
    type: 'pie',
    data: {
      labels: categories,
      datasets: [
        {
          label: 'Expenses',
          data: amounts,
          backgroundColor: [
            '#F44336', '#FF9800', '#FFEB3B', '#4CAF50', '#2196F3', '#9C27B0',
          ],
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: true },
        title: { display: true, text: 'Expenses Breakdown' },
      },
    },
  });
}

function renderExpensesTable(expenses) {
  if (!expenses || !expenses.length) return;
  const container = document.getElementById('expensesTableContainer');
  let html = '<table><thead><tr><th>Date</th><th>Category</th><th>Amount (₹)</th></tr></thead><tbody>';
  expenses.forEach(row => {
    html += `<tr><td>${row.date || row.Date || ''}</td><td>${row.category || row.Category || ''}</td><td>₹${row.amount || row.Amount || 0}</td></tr>`;
  });
  html += '</tbody></table>';
  container.innerHTML = html;
}


// Main load function
window.onload = async function () {
  const studioDaily = await fetchStudioDaily();
  const frames = await fetchFramesData();
  const monthly = aggregateMonthlySummary(studioDaily);
  const framesSummary = aggregateFramesSummary(frames);
  renderMonthlySummary(monthly, framesSummary);
  renderMonthlyReportChart(monthly);

  const tablePerf = await fetchTablePerformance();
  renderTablePerformanceChart(tablePerf);
};
