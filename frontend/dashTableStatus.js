async function fetchData(table, studio) {
    const url = `/apis/data/${table}/${studio}`;
    const response = await fetch(url);
    const data = await response.json();
    return data[0];
  }
    
  async function createTableWisePerformanceGraph() {
    //const clubName = getParameterByNameSt("clubname");
    const studio = getCookie("studio");
    const data = await fetchData("tabledets", studio);
  
    const tables = data.map((row) => row.table_id);
    const occupancy = data.map((row) => row.total_duration);
    const tableStatus = data.map((row) => row.status);
  
    // Set bar colors based on table status
    const barColors = tableStatus.map((status) =>
      status === 1 ? "#01AB7A" : "#CCCCCC"
    );
    // console.log(barColors);
    
    createGraph(
      occupancy,
      tables,
      "tableWisePerformanceChart",
      "Table's Performance",
      barColors
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
  
  createTableWisePerformanceGraph();