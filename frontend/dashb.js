async function fetchData(table, studio) {
  const response = await fetch(`/apis/data/${table}/${studio}`);
  let data = await response.json();
  data = data[0];
  return data;
}

let getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return null;
};

function historyRedirect() {
  const record = document.getElementById("history").value;
  if (record) {
    window.open(
      `/record?studio=${studio}&security=${security}&history=${record}`,
      "_blank"
    );
  }
}

var Studio = decodeURIComponent(getCookie("studio"));
var clubLogo = decodeURIComponent(getCookie("clubLogo"));

document.addEventListener("DOMContentLoaded", function () {
  const logoImg = document.getElementById("clubLogo");

  if (clubLogo && logoImg) {
    logoImg.src = decodeURIComponent(clubLogo);
  }
});

// table section

var month = document.getElementById("monthInput");
month.value = new Date().getMonth() + 1;
month.addEventListener("change", async () => {
  await performanceOptimisedChart();
});

const performanceChartCanvas = document
  .getElementById("tableChart")
  .getContext("2d");
let chart;

async function performanceOptimisedChart() {
  let response = await fetch(`/dash/tableData?month=${month.value}`);
  let data = await response.json();
  let tableData = data.data;

  const labels = tableData.map((record) => {
    return record.TableId;
  });

  const durations = tableData.map((record) => {
    return record.TotalDuration;
  });

  const colors = tableData.map((record) => {
    return record.Status === "ON" ? "#01AB7A" : "#6c757d";
  });

  // tableData.forEach((record) => {

  // });

  if (chart) {
    chart.data.labels = labels;
    chart.data.datasets[0].data = durations;
    chart.data.datasets[0].backgroundColor = colors;
    chart.update();
  } else {
    chart = new Chart(performanceChartCanvas, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Total Duration (minutes)",
            data: durations,
            backgroundColor: colors,
            borderColor: colors.map((color) => color),
            borderWidth: 1,
          },
        ],
      },
      options: {
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: "Minutes",
            },
          },
          x: {
            title: {
              display: true,
              text: "Table",
            },
          },
        },
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                return context.parsed.y + " minutes";
              },
            },
          },
        },
      },
    });
  }
}

// async function plotPerformanceChart() {

//   let rawData = await fetchData("frames", Studio);
//   // rawData = rawData[0];
//   const tableData = {}; // Store aggregated data by TableId
//   const selectedMonth = month.value;
//   // rawData.for
//   rawData.forEach((record) => {
//     const startTimeUTC = new Date(record.StartTime);
//     const startTimeIST = new Date(
//       startTimeUTC.toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
//     );

//     const recordMonth =String(startTimeIST.getMonth() + 1);

//     if (recordMonth !== selectedMonth) return; // Filter by hardcoded month

//     const tableId = record.TableId;
//     if (!tableData[tableId]) {
//       tableData[tableId] = { totalDuration: 0, statusOn: false };
//     }
//     tableData[tableId].totalDuration += record.Duration;
//     if (record.Status === "ON") {
//       tableData[tableId].statusOn = true;
//     }
//   });

//   // Sort tables numerically
//   const sortedTables = Object.keys(tableData).sort((a, b) => {
//     return parseInt(a.replace(/\D/g, "")) - parseInt(b.replace(/\D/g, ""));
//   });

//   // Prepare data for Chart.js
//   const labels = sortedTables;
//   const durations = sortedTables.map(
//     (tableId) => tableData[tableId].totalDuration
//   );
//   const colors = sortedTables.map((tableId) =>
//     tableData[tableId].statusOn ? "#01AB7A" : "#6c757d"
//   );

//   // Create Chart.js bar chart
//  // Create Chart.js bar chart
//  if (chart) {
//   chart.data.labels = labels;
//   chart.data.datasets[0].data = durations;
//   chart.data.datasets[0].backgroundColor = colors;
//   chart.update();
// } else {
//   chart = new Chart(performanceChartCanvas, {
//     type: "bar",
//     data: {
//       labels,
//       datasets: [
//         {
//           label: "Total Duration (minutes)",
//           data: durations,
//           backgroundColor: colors,
//           borderColor: colors.map((color) => color),
//           borderWidth: 1,
//         },
//       ],
//     },
//     options: {
//       scales: {
//         y: {
//           beginAtZero: true,
//           title: {
//             display: true,
//             text: "Minutes",
//           },
//         },
//         x: {
//           title: {
//             display: true,
//             text: "Table",
//           },
//         },
//       },
//       plugins: {
//         legend: {
//           display: false,
//         },
//         tooltip: {
//           callbacks: {
//             label: (context) => {
//               return context.parsed.y + " minutes";
//             },
//           },
//         },
//       },
//     },
//   });
// }
// }

// Helper function to convert UTC to IST

function toIST(dateString) {
  if (!dateString) return null; // Handle empty input

  const utcDate = new Date(dateString);
  if (isNaN(utcDate.getTime())) return null; // Handle invalid date

  // Convert UTC to IST using Intl.DateTimeFormat for accuracy
  return new Date(
    utcDate.toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
  );
}

// Fetch Data Once & Process
async function fetchOccupancyData(studio) {
  try {
    const url = `/apis/data/frames/${encodeURIComponent(studio)}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

    const data = await response.json();
    if (!data || data.length === 0) return [];

    return processOccupancyData(data[0]); // Process immediately
  } catch (error) {
    console.error("Error fetching occupancy data:", error);
    return [];
  }
}

const today = new Date().toISOString().split("T")[0];
let occupDateFilter = document.getElementById("occupDateFilter");
occupDateFilter.value = today;
occupDateFilter.addEventListener("change", async () => {
  await loadOccupancyChart(Studio);
});

// Process & Group Data
function processOccupancyData(rawData) {
  const occupancyData = new Map();
  const targetDateStart = new Date(`${occupDateFilter.value}T00:00:00`);
  const targetDateEnd = new Date(`${occupDateFilter.value}T23:59:59`);
  const now = new Date(); // Current time for live updates

  rawData.forEach((entry) => {
    const tableId = entry.TableId;
    let startTime = toIST(entry.StartTime);
    let endTime = entry.OffTime ? toIST(entry.OffTime) : now; // If ongoing, use current time

    // Ensure within target date range
    if (startTime < targetDateStart) startTime = targetDateStart;
    if (endTime > targetDateEnd) endTime = targetDateEnd;
    if (endTime <= startTime) return;

    if (!occupancyData.has(tableId)) occupancyData.set(tableId, []);

    occupancyData.get(tableId).push({
      startTime: startTime.getHours() + startTime.getMinutes() / 60, // Convert to decimal hours
      endTime: endTime.getHours() + endTime.getMinutes() / 60,
    });
  });

  return occupancyData;
}

// Render Occupancy Chart Efficiently
function renderOccupancyChart(occupancyData) {
  const chartContainer = document.getElementById("tableOccupancyChart");
  chartContainer.innerHTML = ""; // Clear previous chart

  const canvas = document.createElement("canvas");
  canvas.className = "graph";
  canvas.style.height = "50vw";
  chartContainer.appendChild(canvas);

  const datasets = [];
  const tableIds = Array.from(occupancyData.keys()).sort((a, b) => a - b); // Sort tables numerically

  tableIds.forEach((tableId) => {
    const dataPoints = occupancyData.get(tableId).map((entry) => ({
      x: `Table ${tableId}`,
      y: [entry.startTime, entry.endTime], // Time range
    }));

    const randomColor = `rgba(${Math.floor(
      Math.random() * 255
    )}, 99, 132, 0.5)`;

    datasets.push({
      label: `Table ${tableId}`,
      data: dataPoints,
      backgroundColor: randomColor,
      borderColor: randomColor.replace("0.5", "1"),
      borderWidth: 1,
    });
  });

  new Chart(canvas, {
    type: "bar",
    data: { labels: tableIds.map((id) => `Table ${id}`), datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          max: 24,
          ticks: {
            stepSize: 0.25,
            callback: (value) => `${Math.floor(value)}:${(value % 1) * 60}`,
          },
          title: { display: true, text: "Time (24-hour scale)" },
        },
        x: { title: { display: true, text: "Tables" } },
      },
    },
  });
}

// Main Function to Load and Render Data
async function loadOccupancyChart(studio) {
  const occupancyData = await fetchOccupancyData(studio);
  renderOccupancyChart(occupancyData);
}

// Initialize

function updateChart() {
  // Create an array with 24 entries (for each hour: 0-23).
  const hourTotals = new Array(24).fill(0);
  const selectedMonth = monthFilter.value; // format: "YYYY-MM"
  const selectedStudio = studioFilter.value;

  rawData.forEach((record) => {
    // Filter out records not matching the selected studio.
    if (selectedStudio !== "all" && record.Studio !== selectedStudio) {
      return;
    }

    // Convert the record's StartTime (which is in UTC) to IST.
    const startTimeUTC = new Date(record.StartTime);
    const startTimeIST = convertToIST(startTimeUTC);

    // Use UTC getters on the converted date so that we treat it as IST.
    if (selectedMonth) {
      const recordMonth =
        startTimeIST.getUTCFullYear() +
        "-" +
        String(startTimeIST.getUTCMonth() + 1).padStart(2, "0");
      if (recordMonth !== selectedMonth) {
        return;
      }
    }

    // Compute the end time in IST by adding Duration (in minutes).
    const endTimeIST = new Date(
      startTimeIST.getTime() + record.Duration * 60000
    );
    let currentTime = new Date(startTimeIST);

    // Split the duration over the hourly bins.
    while (currentTime < endTimeIST) {
      // Use getUTCHours on the IST-converted time.
      const currentHour = currentTime.getUTCHours();
      // Determine the end of the current hour slot (in IST terms).
      let endOfHour = new Date(currentTime);
      endOfHour.setUTCHours(currentHour + 1, 0, 0, 0);

      // The segment end is either the end of the frame or the end of the current hour.
      const segmentEnd = endTimeIST < endOfHour ? endTimeIST : endOfHour;
      const minutesInSegment = (segmentEnd - currentTime) / 60000;
      hourTotals[currentHour] += minutesInSegment;

      // Move currentTime pointer to the segment end.
      currentTime = segmentEnd;
    }
  });

  // If chart exists, update its data; otherwise, create a new chart.
  if (chart) {
    chart.data.datasets[0].data = hourTotals;
    chart.update();
  } else {
    chart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: Array.from({ length: 24 }, (_, i) => `${i}:00 - ${i + 1}:00`),
        datasets: [
          {
            label: "Total Duration (minutes)",
            data: hourTotals,
            backgroundColor: "rgba(75, 192, 192, 0.5)",
            borderColor: "rgba(75, 192, 192, 1)",
            borderWidth: 1,
          },
        ],
      },
      options: {
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: "Minutes",
            },
          },
          x: {
            title: {
              display: true,
              text: "Hour of Day (IST)",
            },
          },
        },
        plugins: {
          legend: {
            display: false,
          },
        },
      },
    });
  }
}

// Call the function to fetch data and render the chart

// peak hour chart

var monthPeak = document.getElementById("monthInputPeak");
monthPeak.value = new Date().getMonth() + 1;
monthPeak.addEventListener("change", async () => {
  await peakOptimisedChart();
});

const peakHourChartCanvas = document
  .getElementById("peakChart")
  .getContext("2d");
let chart3; // Chart.js instance

// async function peakHourChart() {
//   const ctx = document.getElementById("peakChart").getContext("2d");
//   // const loadingDiv = document.getElementById('loading');

//   let rawData = []; // To store fetched data.
//   let chart; // Chart.js instance

//   // Helper function to convert a UTC date into IST.
//   // IST = UTC + 5 hours 30 minutes.
//   // We add the offset, and then use UTC getters on the new Date so that
//   // the returned hour/month/etc represent IST.
//   function convertToIST(date) {
//     return new Date(date.getTime() + 5.5 * 60 * 60 * 1000);
//   }

//   // Fetch data from the API.
//   async function fetchData() {
//     try {
//       // loadingDiv.style.display = 'block';
//       const response = await fetch(
//         "/apis/data/frames/Studio 111"
//       );
//       const data = await response.json();
//       // If data is nested (array of arrays), flatten it.
//       rawData =
//         Array.isArray(data) && Array.isArray(data[0]) ? data.flat() : data;
//       // loadingDiv.style.display = 'none';
//       await updateChart();
//     } catch (error) {
//       // loadingDiv.textContent = 'Error fetching data.';
//       alert("Error fetching data:", error);
//       console.error("Error fetching data:", error);
//     }
//   }

//   // Update and render the chart based on the selected filters.
//   function updateChart() {
//     // Create an array with 24 entries (for each hour: 0-23).
//     const hourTotals = new Array(24).fill(0);
//     const selectedMonth = monthPeak.value; // format: "YYYY-MM"
//     const selectedStudio = Studio;

//     rawData.forEach((record) => {
//       // Filter out records not matching the selected studio.
//       if (selectedStudio !== "all" && record.Studio !== selectedStudio) {
//         return;
//       }

//       // Convert the record's StartTime (which is in UTC) to IST.
//       const startTimeUTC = new Date(record.StartTime);
//       const startTimeIST = convertToIST(startTimeUTC);

//       // Use UTC getters on the converted date so that we treat it as IST.
//       if (selectedMonth) {
//         const recordMonth = String(startTimeIST.getUTCMonth() + 1);
//         if (recordMonth !== selectedMonth) {
//           return;
//         }
//       }

//       // Compute the end time in IST by adding Duration (in minutes).
//       const endTimeIST = new Date(
//         startTimeIST.getTime() + record.Duration * 60000
//       );
//       let currentTime = new Date(startTimeIST);

//       // Split the duration over the hourly bins.
//       while (currentTime < endTimeIST) {
//         // Use getUTCHours on the IST-converted time.
//         const currentHour = currentTime.getUTCHours();
//         // Determine the end of the current hour slot (in IST terms).
//         let endOfHour = new Date(currentTime);
//         endOfHour.setUTCHours(currentHour + 1, 0, 0, 0);

//         // The segment end is either the end of the frame or the end of the current hour.
//         const segmentEnd = endTimeIST < endOfHour ? endTimeIST : endOfHour;
//         const minutesInSegment = (segmentEnd - currentTime) / 60000;
//         hourTotals[currentHour] += minutesInSegment;

//         // Move currentTime pointer to the segment end.
//         currentTime = segmentEnd;
//       }
//     });

//     // If chart exists, update its data; otherwise, create a new chart.
//     if (chart3) {
//       chart3.data.datasets[0].data = hourTotals;
//       chart3.update();
//     } else {
//       chart3 = new Chart(peakHourChartCanvas, {
//         type: "bar",
//         data: {
//           labels: Array.from({ length: 24 }, (_, i) => `${i}:00 - ${i + 1}:00`),
//           datasets: [
//             {
//               label: "Total Duration (minutes)",
//               data: hourTotals,
//               backgroundColor: "rgba(75, 192, 192, 0.5)",
//               borderColor: "rgba(75, 192, 192, 1)",
//               borderWidth: 1,
//             },
//           ],
//         },
//         options: {
//           scales: {
//             y: {
//               beginAtZero: true,
//               title: {
//                 display: true,
//                 text: "Minutes",
//               },
//             },
//             x: {
//               title: {
//                 display: true,
//                 text: "Hour of Day (IST)",
//               },
//             },
//           },
//           plugins: {
//             legend: {
//               display: false,
//             },
//           },
//         },
//       });
//     }
//   }

//   // Initiate data fetch.
//   fetchData();
// }

async function peakOptimisedChart() {
  const selectedMonth = monthPeak.value; // format: "YYYY-MM"
  const response = await fetch(`/dash/peakData?month=${selectedMonth}`);
  let peakData = await response.json();

  if (chart3) {
    chart3.data.datasets[0].data = peakData;
    chart3.update();
  } else {
    chart3 = new Chart(peakHourChartCanvas, {
      type: "bar",
      data: {
        labels: Array.from({ length: 24 }, (_, i) => `${i}:00 - ${i + 1}:00`),
        datasets: [
          {
            label: "Total Duration (minutes)",
            data: peakData,
            backgroundColor: "rgba(75, 192, 192, 0.5)",
            borderColor: "rgba(75, 192, 192, 1)",
            borderWidth: 1,
          },
        ],
      },
      options: {
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: "Minutes",
            },
          },
          x: {
            title: {
              display: true,
              text: "Hour of Day (IST)",
            },
          },
        },
        plugins: {
          legend: {
            display: false,
          },
        },
      },
    });
  }
}

async function initTableSection() {
  await performanceOptimisedChart();
  await loadOccupancyChart(Studio);
  await peakOptimisedChart();
}

function showTableSection() {
  // document.getElementById("tableSection").style.display = "block";
  document.querySelectorAll(".section").forEach((sect) => {
    sect.style.display = "none";
  });
  document.getElementById("tableSection").style.display = "block";
  initTableSection();
}

// Report Section

async function setDateRangeReport() {
  const today = new Date(); // Get current date in YYYY-MM-DD
  const startDateInput = document.getElementById("startDateReport");
  const endDateInput = document.getElementById("endDateReport");
  endDateInput.value = today.toISOString().split("T")[0];
  today.setDate(1);
  startDateInput.value = today.toISOString().split("T")[0];
}

async function createReportGraph() {
  const response = await fetch(`/dash/dashData`);
  let tableData = await response.json();
  tableData = tableData.tableData;

  let total_tableMoney = 0;
  let total_duration = 0;
  let groupedData = {};

  let startDate = document.getElementById("startDateReport").value;
  let endDate = document.getElementById("endDateReport").value;

  tableData.forEach((row) => {
    let date = toIST(row.day).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    date = date.split("/").reverse().join("-");

    if (date < startDate || date > endDate) {
      return;
    }

    let tableMoney = parseInt(row.total_tableMoney);
    total_tableMoney += tableMoney;

    let duration = parseInt(row.total_duration);
    total_duration += duration;

    if (!groupedData[date]) {
      groupedData[date] = { duration: 0, totalMoney: 0 };
    }

    groupedData[date].duration = duration;
    groupedData[date].totalMoney = tableMoney;
  });

  document.getElementById("totalTableMoney").innerText =
    "Rs. " + total_tableMoney.toLocaleString("en-IN");
  document.getElementById("totalDuration").innerText =
    total_duration.toLocaleString("en-IN") + " mins";
  updateReportChart(groupedData);
}

let reportChart = null;
function updateReportChart(groupedData) {
  const ctx = document.getElementById("reportChart").getContext("2d");

  const labels = Object.keys(groupedData);
  const durations = labels.map((date) => groupedData[date].duration);
  const totalMoney = labels.map((date) => groupedData[date].totalMoney);

  // Colors for each bar: normal color or different for Sundays
  const backgroundColors = labels.map((date) => {
    const dayOfWeek = new Date(date).getDay(); // Get the day of the week (0 for Sunday)
    return dayOfWeek === 0
      ? "rgba(255, 99, 132, 0.2)"
      : "rgba(75, 192, 192, 0.2)"; // Red for Sundays
  });

  const borderColors = labels.map((date) => {
    const dayOfWeek = new Date(date).getDay();
    return dayOfWeek === 0 ? "rgba(255, 99, 132, 1)" : "rgba(75, 192, 192, 1)"; // Red for Sundays
  });

  if (reportChart) {
    reportChart.destroy(); // Destroy existing chart instance if it exists
  }

  reportChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Total Duration (minutes)",
          data: durations,
          backgroundColor: backgroundColors,
          borderColor: borderColors,
          borderWidth: 1,
        },
        {
          label: "Total Money",
          data: totalMoney,
          backgroundColor: "rgba(153, 102, 255, 0.2)",
          borderColor: "rgba(153, 102, 255, 1)",
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true, // Ensures it adapts to container size
      maintainAspectRatio: false, // Allows it to expand freely
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: "Values",
          },
        },
      },
      plugins: {
        legend: {
          display: true,
        },
      },
    },
  });
}

async function initReportSection() {
  setDateRangeReport();
  createReportGraph();
  document
    .getElementById("startDateReport")
    .addEventListener("change", createReportGraph);
  document
    .getElementById("endDateReport")
    .addEventListener("change", createReportGraph);
}

function showReportSection() {
  document.querySelectorAll(".section").forEach((sect) => {
    sect.style.display = "none";
  });
  document.getElementById("reportSection").style.display = "block";
  initReportSection();
}

showReportSection();

// Topup Section

async function setDateRangeTopup() {
  const today = new Date(); // Get current date in YYYY-MM-DD
  const startDateInput = document.getElementById("startDateTopUp");
  const endDateInput = document.getElementById("endDateTopup");
  endDateInput.value = today.toISOString().split("T")[0];
  today.setDate(1);
  startDateInput.value = today.toISOString().split("T")[0];
}

async function createTopupTable() {
  const response = await fetch(`/dash/dashData`);
  let topupData = await response.json();
  topupData = topupData.topupData;

  const startDateInput = document.getElementById("startDateTopUp");
  const endDateInput = document.getElementById("endDateTopup");
  const startDate = startDateInput.value;
  const endDate = endDateInput.value;

  const table = document.getElementById("topupTable");
  const tbody = table.getElementsByTagName("tbody")[0];
  tbody.innerHTML = ""; // Clear previous table

  let totalTopup = 0;
  let onlineTopup = 0;
  let cashTopup = 0;

  if (!topupData || topupData.length === 0) {
    const row = document.createElement("tr");
    const noDataCell = document.createElement("td");
    noDataCell.textContent = "No data available";
    noDataCell.colSpan = 3; // Ensures it spans across all columns
    row.appendChild(noDataCell);
    tbody.appendChild(row);
    return;
  }

  topupData = topupData.reverse();
  topupData.forEach((topup) => {
    let date = toIST(topup.topup_date).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    date = date.split("/").reverse().join("-");

    if (date < startDate || date > endDate) return;

    const row = tbody.insertRow();
    row.className = "topupRow p-6 odd:bg-[#2A2E34]";
    const dateCell = row.insertCell(0);
    const totalCell = row.insertCell(1);
    const onlineCell = row.insertCell(2);
    const cashCell = row.insertCell(3);

    [dateCell, totalCell, onlineCell, cashCell].forEach((cell) => {
      cell.className = "p-4"; // Adjust padding as needed
    });

    dateCell.textContent = date;
    totalCell.textContent = `Rs. ${parseInt(topup.total_topup)}`;
    totalTopup += parseInt(topup.total_topup);

    onlineCell.textContent = `Rs. ${parseInt(topup.online_topup)}`;
    onlineTopup += parseInt(topup.online_topup);

    cashCell.textContent = `Rs. ${parseInt(topup.cash_topup)}`;
    cashTopup += parseInt(topup.cash_topup);
  });

  document.getElementById("totalTopup").textContent = `Rs. ${totalTopup}`;
  document.getElementById("onlineTotal").textContent = `Rs. ${onlineTopup}`;
  document.getElementById("cashTotal").textContent = `Rs. ${cashTopup}`;
}

async function initTopupSection() {
  setDateRangeTopup();
  createTopupTable();

  document
    .getElementById("startDateTopUp")
    .addEventListener("change", createTopupTable);
  document
    .getElementById("endDateTopup")
    .addEventListener("change", createTopupTable);
}

initTopupSection();

function showTopupSection() {
  document.querySelectorAll(".section").forEach((sect) => {
    sect.style.display = "none";
  });
  document.getElementById("topupSection").style.display = "block";
  initTopupSection();
}

// Purchase Section

async function setDateRangePurchase() {
  const today = new Date(); // Get current date in YYYY-MM-DD
  const startDateInput = document.getElementById("startDatePurchase");
  const endDateInput = document.getElementById("endDatePurchase");
  endDateInput.value = today.toISOString().split("T")[0];
  today.setDate(1);
  startDateInput.value = today.toISOString().split("T")[0];
}

async function createPurchaseTable() {
  const response = await fetch(`/dash/dashData`);
  let purchaseData = await response.json();
  purchaseData = purchaseData.purchaseData;

  const startDateInput = document.getElementById("startDatePurchase");
  const endDateInput = document.getElementById("endDatePurchase");
  const startDate = startDateInput.value;
  const endDate = endDateInput.value;

  const table = document.getElementById("purchaseTable");
  const tbody = table.getElementsByTagName("tbody")[0];
  tbody.innerHTML = ""; // Clear previous table

  let totalPurchase = 0;

  if (!purchaseData || purchaseData.length === 0) {
    const row = document.createElement("tr");
    const noDataCell = document.createElement("td");
    noDataCell.textContent = "No data available";
    noDataCell.colSpan = 3; // Ensures it spans across all columns
    row.appendChild(noDataCell);
    tbody.appendChild(row);
    return;
  }

  purchaseData = purchaseData.reverse();
  purchaseData.forEach((purchase) => {
    let date = toIST(purchase.purchase_date).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    date = date.split("/").reverse().join("-");

    if (date < startDate || date > endDate) return;

    const row = tbody.insertRow();
    row.className = "purchaseRow p-6 odd:bg-[#2A2E34]";
    const dateCell = row.insertCell(0);
    const totalCell = row.insertCell(1);

    [dateCell, totalCell].forEach((cell) => {
      cell.className = "p-4"; // Adjust padding as needed
    });

    dateCell.textContent = date;
    totalCell.textContent = `Rs. ${parseInt(purchase.total_purchase)}`;
    totalPurchase += parseInt(purchase.total_purchase);
  });

  document.getElementById("totalPurchase").textContent = `Rs. ${totalPurchase}`;
}

async function createRecordTable() {
  const response = await fetch(`/dash/dashData`);
  let recordsData = await response.json();
  recordsData = recordsData.expenseData;

  // Filter out records that start with "Expense"
  recordsData = recordsData.filter(
    (record) => !record.action.startsWith("Expense")
  );
  recordsData = recordsData.reverse();

  const startDateInput = document.getElementById("startDatePurchase");
  const endDateInput = document.getElementById("endDatePurchase");
  const startDate = startDateInput.value;
  const endDate = endDateInput.value;

  const table = document.getElementById("recordsTable");
  const tbody = table.getElementsByTagName("tbody")[0];
  tbody.innerHTML = ""; // Clear previous table

  let totalPurchase = 0;

  if (!recordsData || recordsData.length === 0) {
    const row = document.createElement("tr");
    const noDataCell = document.createElement("td");
    noDataCell.textContent = "No data available";
    noDataCell.colSpan = 3; // Ensures it spans across all columns
    row.appendChild(noDataCell);
    tbody.appendChild(row);
    return;
  }

  // ✅ Only One forEach() Loop
  recordsData.forEach((record) => {
    let date = toIST(record.timestamp).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });

    let [Date, time] = date.split(",");
    Date = Date.split("/").reverse().join("-");
    date = [Date, time].join(" ,");

    if (Date < startDate || Date > endDate) return;

    const row = tbody.insertRow();
    row.className = "recordRow p-6 odd:bg-[#2A2E34]";
    const idCell = row.insertCell(0);
    const dateCell = row.insertCell(1);
    const actionCell = row.insertCell(2);
    const operatorCell = row.insertCell(3);

    [dateCell, actionCell, operatorCell].forEach((cell) => {
      cell.className = "p-4"; // Adjust padding as needed
    });

    idCell.textContent = record.id;
    dateCell.textContent = date;
    actionCell.textContent = record.details;
    operatorCell.textContent = record.operatorName;
  });
}

async function initPurchaseSection() {
  setDateRangePurchase();
  createPurchaseTable();
  createRecordTable();

  document
    .getElementById("startDatePurchase")
    .addEventListener("change", createPurchaseTable);
  document
    .getElementById("endDatePurchase")
    .addEventListener("change", createPurchaseTable);
}

function showPurchaseSection() {
  document.querySelectorAll(".section").forEach((sect) => {
    sect.style.display = "none";
  });
  document.getElementById("purchaseSection").style.display = "block";
  initPurchaseSection();
}
async function initSummarySection() {
  // Set default dates to today
  const now = new Date();
  const oneMonthBack = new Date();
  oneMonthBack.setMonth(now.getMonth() - 1);

  // Format date and time to 'YYYY-MM-DDTHH:MM' (for datetime-local input)
  const toDateTimeLocal = (d) => {
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
      d.getDate()
    )}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  document.getElementById("startDate").value = toDateTimeLocal(oneMonthBack);
  document.getElementById("endDate").value = toDateTimeLocal(now);

  // Set up event listeners
  document
    .getElementById("playerSummaryCheckbox")
    .addEventListener("change", fetchSummary);
  document
    .getElementById("playerSearch")
    .addEventListener("input", fetchSummary);

  // Initial fetch
  await fetchSummary();
}

function showSummarySection() {
  document.querySelectorAll(".section").forEach((sect) => {
    sect.style.display = "none";
  });
  document.getElementById("summarySection").style.display = "block";
  initSummarySection();
}
async function fetchSummary() {
  const startInput = document.getElementById("startDate").value;
  const endInput = document.getElementById("endDate").value;
  const playerSearch = document.getElementById("playerSearch").value.trim();
  const isPlayerSummary = document.getElementById(
    "playerSummaryCheckbox"
  ).checked;

  // Get the selected studio from the global variable (assuming it's set elsewhere)
  const studioFilter = window.selectedStudio || ""; // Use empty string for all studios if not set

  if (!startInput || !endInput) {
    alert("Please select both start and end date/time!");
    return;
  }

  const startDate = new Date(startInput);
  const endDate = new Date(endInput);
  const loadingEl = document.getElementById("loading");
  loadingEl.style.display = "block";

  try {
    const urls = [
      `/apis/data/frames/${Studio}`,
      `/apis/data/purchase/${Studio}`,
      `/apis/data/topup/${Studio}`,
      `/apis/data/adjustment/${Studio}`,
    ];

    const [framesData, purchasesData, topupsData, adjustmentsData] =
      await Promise.all(
        urls.map((url) => fetch(url).then((res) => res.json()))
      );

    const [frames, purchases, topups, adjustments] = [
      framesData[0],
      purchasesData[0],
      topupsData[0],
      adjustmentsData[0],
    ];

    const players = new Set();

    const tableMoney = new Map();
    const purchaseTotal = new Map();
    const topupCashTotal = new Map();
    const topupOnlineTotal = new Map();
    const adjustmentTotal = new Map();

    const inRange = (dateStr) => {
      const d = new Date(dateStr);
      return d >= startDate && d <= endDate;
    };

    frames.forEach((frame) => {
      if (!inRange(frame.StartTime)) return;
      if (studioFilter && frame.Studio !== studioFilter) return;

      ["P1", "P2", "P3", "P4", "P5", "P6"].forEach((p) => {
        if (frame[p]) players.add(frame[p]);
      });

      const share = parseFloat(frame.Share) || 0;
      [
        "LP01",
        "LP02",
        "LP03",
        "LP04",
        "LP05",
        "LP06",
        "LP07",
        "LP08",
        "LP09",
        "LP10",
      ].forEach((lp) => {
        const player = frame[lp];
        if (player) {
          tableMoney.set(player, (tableMoney.get(player) || 0) + share);
        }
      });
    });

    purchases.forEach(({ RecordDate, studio, UserName, amount }) => {
      if (!inRange(RecordDate)) return;
      if (studioFilter && studio !== studioFilter) return;
      const amt = parseFloat(amount) || 0;
      purchaseTotal.set(UserName, (purchaseTotal.get(UserName) || 0) + amt);
    });

    topups.forEach(({ RecordDate, studio, UserName, Amount, Mode }) => {
      if (!inRange(RecordDate)) return;
      if (studioFilter && studio !== studioFilter) return;
      const amt = parseFloat(Amount) || 0;
      const map =
        Mode?.toLowerCase() === "cash" ? topupCashTotal : topupOnlineTotal;
      map.set(UserName, (map.get(UserName) || 0) + amt);
    });

    adjustments.forEach(({ recordDate, studio, losser, winner, amount }) => {
      if (!inRange(recordDate)) return;
      if (studioFilter && studio !== studioFilter) return;
      const amt = parseFloat(amount) || 0;

      if (losser) {
        adjustmentTotal.set(losser, (adjustmentTotal.get(losser) || 0) + amt);
        players.add(losser);
      }

      if (winner) {
        adjustmentTotal.set(winner, (adjustmentTotal.get(winner) || 0) - amt);
        players.add(winner);
      }
    });

    if (isPlayerSummary && playerSearch) {
      await renderPlayerSummary(
        playerSearch,
        frames,
        purchases,
        topups,
        adjustments,
        startDate,
        endDate,
        studioFilter
      );
    } else {
      renderOverallSummary(
        players,
        Object.fromEntries(tableMoney),
        Object.fromEntries(purchaseTotal),
        Object.fromEntries(topupCashTotal),
        Object.fromEntries(topupOnlineTotal),
        Object.fromEntries(adjustmentTotal),
        playerSearch
      );
    }
  } catch (error) {
    console.error("Error fetching data:", error);
    alert("Failed to fetch data. Please try again later.");
  } finally {
    loadingEl.style.display = "none";
  }
}

function renderOverallSummary(
  players,
  tableMoney,
  purchaseTotal,
  topupCashTotal,
  topupOnlineTotal,
  adjustmentTotal,
  playerSearch
) {
  // Set table headers for overall mode with separate Adjustment column
  const headerRow = document.getElementById("tableHeader");
  headerRow.innerHTML = `
  <th onclick="sortTable(0)">Player Name ▲▼</th>
  <th onclick="sortTable(1)">Total Table Money ▲▼</th>
  <th onclick="sortTable(2)">Total Purchase ▲▼</th>
  <th onclick="sortTable(3)">Cash Top-Up ▲▼</th>
  <th onclick="sortTable(4)">Online Top-Up ▲▼</th>
  <th onclick="sortTable(5)">Total Top-Up ▲▼</th>
  <th onclick="sortTable(6)">Adjustment ▲▼</th>
  <th onclick="sortTable(7)">Final Amount ▲▼</th>
  <th onclick="sortTable(8)">Points ▲▼</th>
`;

  const tbody = document.querySelector("#summaryTable tbody");
  tbody.innerHTML = "";

  let totalTableMoney = 0,
    totalPurchase = 0,
    totalTopupCash = 0,
    totalTopupOnline = 0,
    totalAdjustment = 0,
    totalFinal = 0;

  players.forEach((player) => {
    if (
      playerSearch &&
      !player.toLowerCase().includes(playerSearch.toLowerCase())
    )
      return;

    const tMoney = tableMoney[player] || 0;
    const pur = purchaseTotal[player] || 0;
    const topCash = topupCashTotal[player] || 0;
    const topOnline = topupOnlineTotal[player] || 0;
    const adj = adjustmentTotal[player] || 0;
    const finalAmt = topCash + topOnline - (tMoney + pur) + adj;
    const totalTopup = topCash + topOnline;
    const denominator = tMoney + pur;
    const points = denominator > 0 ? totalTopup / denominator : 0;

    totalTableMoney += tMoney;
    totalPurchase += pur;
    totalTopupCash += topCash;
    totalTopupOnline += topOnline;
    totalAdjustment += adj;
    totalFinal += finalAmt;

    const row = document.createElement("tr");
    if (finalAmt > 0) row.classList.add("green-row");
    else if (finalAmt < -9) row.classList.add("red-row");

    row.innerHTML = `
  <td>${player}</td>
  <td>${tMoney.toFixed(2)}</td>
  <td>${pur.toFixed(2)}</td>
  <td>${topCash.toFixed(2)}</td>
  <td>${topOnline.toFixed(2)}</td>
  <td>${totalTopup.toFixed(2)}</td>
  <td>${adj.toFixed(2)}</td>
  <td>${finalAmt.toFixed(2)}</td>
  <td>${points.toFixed(2)}</td>
`;

    tbody.appendChild(row);
  });

  // Append total row at the bottom
  const totalRow = document.createElement("tr");
  totalRow.innerHTML = `
      <td><strong>Total</strong></td>
      <td><strong>${totalTableMoney.toFixed(2)}</strong></td>
      <td><strong>${totalPurchase.toFixed(2)}</strong></td>
      <td><strong>${totalTopupCash.toFixed(2)}</strong></td>
      <td><strong>${totalTopupOnline.toFixed(2)}</strong></td>
      <td><strong>${totalAdjustment.toFixed(2)}</strong></td>
      <td><strong>${totalFinal.toFixed(2)}</strong></td>
  `;
  tbody.appendChild(totalRow);
}

async function renderPlayerSummary(
  playerName,
  frames,
  purchases,
  topups,
  adjustments,
  startDate,
  endDate,
  studioFilter
) {
  // Set table headers for player summary mode with Adjustment column
  const headerRow = document.getElementById("tableHeader");
  headerRow.innerHTML = `
      <th>Date</th>
      <th>Table Money</th>
      <th>Purchase</th>
      <th>Cash Top-Up</th>
      <th>Online Top-Up</th>
      <th>Adjustment</th>
      <th>Final Amount</th>
  `;

  const tbody = document.querySelector("#summaryTable tbody");
  tbody.innerHTML = "";

  let dailySummary = {};
  const hasDateRange = startDate && endDate;

  // Define a local inRange function for this scope.
  const inRange = (dateStr) => {
    const d = new Date(dateStr);
    return d >= startDate && d <= endDate;
  };

  // Process frames for the player
  frames.forEach((frame) => {
    const frameTime = new Date(frame.StartTime);
    if (!hasDateRange || (frameTime >= startDate && frameTime <= endDate)) {
      if (!studioFilter || frame.Studio === studioFilter) {
        let appears = false;
        ["P1", "P2", "P3", "P4", "P5", "P6"].forEach((p) => {
          if (
            frame[p] &&
            typeof frame[p] === "string" &&
            frame[p].toLowerCase() === playerName.toLowerCase()
          ) {
            appears = true;
          }
        });
        if (appears) {
          const dateKey = frameTime.toISOString().split("T")[0];
          dailySummary[dateKey] = dailySummary[dateKey] || {
            tableMoney: 0,
            purchase: 0,
            topupCash: 0,
            topupOnline: 0,
            adjustment: 0,
          };
          const share = parseFloat(frame.Share) || 0;
          [
            "LP01",
            "LP02",
            "LP03",
            "LP04",
            "LP05",
            "LP06",
            "LP07",
            "LP08",
            "LP09",
            "LP10",
          ].forEach((lp) => {
            if (
              frame[lp] &&
              typeof frame[lp] === "string" &&
              frame[lp].toLowerCase() === playerName.toLowerCase()
            ) {
              dailySummary[dateKey].tableMoney += share;
            }
          });
        }
      }
    }
  });

  // Process purchases for the player
  purchases.forEach((purchase) => {
    const purchaseTime = new Date(purchase.RecordDate);
    if (
      !hasDateRange ||
      (purchaseTime >= startDate && purchaseTime <= endDate)
    ) {
      if (
        purchase.UserName &&
        typeof purchase.UserName === "string" &&
        purchase.UserName.toLowerCase() === playerName.toLowerCase() &&
        (!studioFilter || purchase.studio === studioFilter)
      ) {
        const dateKey = purchaseTime.toISOString().split("T")[0];
        dailySummary[dateKey] = dailySummary[dateKey] || {
          tableMoney: 0,
          purchase: 0,
          topupCash: 0,
          topupOnline: 0,
          adjustment: 0,
        };
        dailySummary[dateKey].purchase += parseFloat(purchase.amount) || 0;
      }
    }
  });

  // Process top-ups for the player
  topups.forEach((topup) => {
    const topupTime = new Date(topup.RecordDate);
    if (!hasDateRange || (topupTime >= startDate && topupTime <= endDate)) {
      if (
        topup.UserName &&
        typeof topup.UserName === "string" &&
        topup.UserName.toLowerCase() === playerName.toLowerCase() &&
        (!studioFilter || topup.studio === studioFilter)
      ) {
        const dateKey = topupTime.toISOString().split("T")[0];
        dailySummary[dateKey] = dailySummary[dateKey] || {
          tableMoney: 0,
          purchase: 0,
          topupCash: 0,
          topupOnline: 0,
          adjustment: 0,
        };
        const amt = parseFloat(topup.Amount) || 0;
        if (topup.Mode && topup.Mode.toLowerCase() === "cash") {
          dailySummary[dateKey].topupCash += amt;
        } else if (topup.Mode && topup.Mode.toLowerCase() === "online") {
          dailySummary[dateKey].topupOnline += amt;
        }
      }
    }
  });

  // Process adjustments for the player
  adjustments.forEach((adj) => {
    if (
      inRange(adj.recordDate) &&
      (!studioFilter || adj.studio === studioFilter)
    ) {
      const adjTime = new Date(adj.recordDate);
      if (!hasDateRange || (adjTime >= startDate && adjTime <= endDate)) {
        const dateKey = adjTime.toISOString().split("T")[0];
        dailySummary[dateKey] = dailySummary[dateKey] || {
          tableMoney: 0,
          purchase: 0,
          topupCash: 0,
          topupOnline: 0,
          adjustment: 0,
        };
        const amt = parseFloat(adj.amount) || 0;
        if (
          adj.losser &&
          typeof adj.losser === "string" &&
          adj.losser.toLowerCase() === playerName.toLowerCase()
        ) {
          dailySummary[dateKey].adjustment += amt;
        }
        if (
          adj.winner &&
          typeof adj.winner === "string" &&
          adj.winner.toLowerCase() === playerName.toLowerCase()
        ) {
          dailySummary[dateKey].adjustment -= amt;
        }
      }
    }
  });

  // Sort dates in ascending order
  const dates = Object.keys(dailySummary).sort();
  let totalTableMoney = 0,
    totalPurchase = 0,
    totalTopupCash = 0,
    totalTopupOnline = 0,
    totalAdjustment = 0,
    totalFinal = 0;

  dates.forEach((date) => {
    const { tableMoney, purchase, topupCash, topupOnline, adjustment } =
      dailySummary[date];
    const finalAmount =
      topupCash + topupOnline - (tableMoney + purchase) + adjustment;
    totalTableMoney += tableMoney;
    totalPurchase += purchase;
    totalTopupCash += topupCash;
    totalTopupOnline += topupOnline;
    totalAdjustment += adjustment;
    totalFinal += finalAmount;

    const row = document.createElement("tr");
    if (finalAmount > 0) row.classList.add("green-row");
    else if (finalAmount < -9) row.classList.add("red-row");

    row.innerHTML = `
      <td>${date}</td>
      <td>${tableMoney.toFixed(2)}</td>
      <td>${purchase.toFixed(2)}</td>
      <td>${topupCash.toFixed(2)}</td>
      <td>${topupOnline.toFixed(2)}</td>
      <td>${adjustment.toFixed(2)}</td>
      <td>${finalAmount.toFixed(2)}</td>
    `;
    tbody.appendChild(row);
  });

  // Append the totals row at the bottom
  const totalRow = document.createElement("tr");
  totalRow.innerHTML = `
      <td><strong>Total</strong></td>
      <td><strong>${totalTableMoney.toFixed(2)}</strong></td>
      <td><strong>${totalPurchase.toFixed(2)}</strong></td>
      <td><strong>${totalTopupCash.toFixed(2)}</strong></td>
      <td><strong>${totalTopupOnline.toFixed(2)}</strong></td>
      <td><strong>${totalAdjustment.toFixed(2)}</strong></td>
      <td><strong>${totalFinal.toFixed(2)}</strong></td>
  `;
  tbody.appendChild(totalRow);
}
let currentSortColumn = null;
let sortDirectionAsc = true;

function sortTable(columnIndex) {
  const table = document.getElementById("summaryTable");
  const tbody = table.querySelector("tbody");
  const rows = Array.from(tbody.querySelectorAll("tr"));

  // Skip total row
  const dataRows = rows.slice(0, -1);
  const totalRow = rows[rows.length - 1];

  if (currentSortColumn === columnIndex) {
    sortDirectionAsc = !sortDirectionAsc; // Toggle direction
  } else {
    currentSortColumn = columnIndex;
    sortDirectionAsc = true; // Default to ascending
  }

  dataRows.sort((a, b) => {
    const aText = a.children[columnIndex].textContent.trim();
    const bText = b.children[columnIndex].textContent.trim();

    const aNum = parseFloat(aText);
    const bNum = parseFloat(bText);

    // Check if sorting by number
    if (!isNaN(aNum) && !isNaN(bNum)) {
      return sortDirectionAsc ? aNum - bNum : bNum - aNum;
    }

    // Else sort as text
    return sortDirectionAsc
      ? aText.localeCompare(bText)
      : bText.localeCompare(aText);
  });

  // Re-append sorted rows
  tbody.innerHTML = "";
  dataRows.forEach((row) => tbody.appendChild(row));
  tbody.appendChild(totalRow); // Re-append total row at bottom
}

// Expense Section

async function setDateRangeExpense() {
  const today = new Date(); // Get current date in YYYY-MM-DD
  const startDateInput = document.getElementById("startDateExpense");
  const endDateInput = document.getElementById("endDateExpense");
  endDateInput.value = today.toISOString().split("T")[0];
  today.setDate(1);
  startDateInput.value = today.toISOString().split("T")[0];
}

async function createExpenseTable() {
  const response = await fetch(`/dash/dashData`);
  let expenseData = await response.json();
  expenseData = expenseData.expenseData;
  expenseData = expenseData.filter((expense) =>
    expense.action.startsWith("Expense")
  );

  const startDateInput = document.getElementById("startDateExpense");
  const endDateInput = document.getElementById("endDateExpense");
  const startDate = startDateInput.value;
  const endDate = endDateInput.value;

  const table = document.getElementById("expenseTable");
  const tbody = table.getElementsByTagName("tbody")[0];
  tbody.innerHTML = ""; // Clear previous table

  let totalExpense = 0;

  if (!expenseData || expenseData.length === 0) {
    const row = document.createElement("tr");
    const noDataCell = document.createElement("td");
    noDataCell.textContent = "No data available";
    noDataCell.colSpan = 3; // Ensures it spans across all columns
    row.appendChild(noDataCell);
    tbody.appendChild(row);
    return;
  }

  expenseData = expenseData.reverse();
  expenseData.forEach((expense) => {
    let date = toIST(expense.timestamp).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
    let [Date, time] = date.split(",");
    Date = Date.split("/").reverse().join("-");
    date = [Date, time].join(" ,");

    if (Date < startDate || Date > endDate) return;

    const row = tbody.insertRow();
    row.className = "ExpenseRow p-6 odd:bg-[#2A2E34]";
    const dateCell = row.insertCell(0);
    const purposeCell = row.insertCell(1);
    const amountCell = row.insertCell(2);
    const operatorCell = row.insertCell(3);

    [dateCell, purposeCell, amountCell, operatorCell].forEach((cell) => {
      cell.className = "p-4"; // Adjust padding as needed
    });

    dateCell.textContent = date;

    purposeCell.textContent = expense.details;

    let amount = parseInt(expense.action.split("Rs. ")[1]);
    amountCell.textContent = `Rs. ${amount}`;
    totalExpense += amount;

    operatorCell.textContent = expense.operatorName;
  });

  document.getElementById("totalExpense").textContent = `Rs. ${totalExpense}`;
}

async function initExpenseSection() {
  setDateRangeExpense();
  createExpenseTable();

  document
    .getElementById("startDateExpense")
    .addEventListener("change", createExpenseTable);
  document
    .getElementById("endDateExpense")
    .addEventListener("change", createExpenseTable);
}

// initExpenseSection();
function showExpenseSection() {
  document.querySelectorAll(".section").forEach((sect) => {
    sect.style.display = "none";
  });
  document.getElementById("expenseSection").style.display = "block";
  initExpenseSection();
}

document.querySelectorAll(".sideBarLink").forEach((item) => {
  item.addEventListener("click", function (event) {
    event.preventDefault();

    // Remove active classes from all sidebar links
    document.querySelectorAll(".sideBarLink").forEach((el) => {
      el.classList.remove("text-white", "bg-[#2a2e34]", "block");
    });

    // Add active classes to the clicked one
    this.classList.add("text-white", "bg-[#2a2e34]", "block");
    // this.classList.remove("hidden");

    // Call the function dynamically
    const functionName = this.getAttribute("data-function");
    if (functionName && typeof window[functionName] === "function") {
      window[functionName]();
    }
  });
});

function historyRedirect() {
  const record = document.getElementById("history").value;
  var studio = decodeURIComponent(getCookie("studio"));
  var security = getCookie("security");
  if (record) {
    window.open(
      `/record?studio=${studio}&security=${security}&history=${record}`,
      "_blank"
    );
  }
}
