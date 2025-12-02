let getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return null;
};

const clubname = decodeURIComponent(getCookie("clubName"));
document.getElementById("clubName").innerHTML = clubname;

const addOperatorBtn = document.getElementById("addOperatorBtn");
const addOperatorModal = document.getElementById("addOperatorModal");
const modal_dialog = document.getElementById("modal-dialog");
const close = document.getElementById("close");

addOperatorBtn.addEventListener("click", (e) => {
  addOperatorModal.style.display = "block";
  e.stopPropagation();
});

close.addEventListener("click",()=>{
  if(addOperatorModal){
    addOperatorModal.style.display = "none";
  }
})
document.addEventListener("click",(e )=>{
  if(addOperatorModal.style.display != "none"){
    console.log(addOperatorModal.style.display);
    addOperatorModal.style.display = "none";
  }
  
})

modal_dialog.addEventListener("click",(e)=>{
  e.stopPropagation();
})

async function fetchData(table, Studio) {
  const url = `/apis/data/${table}/${Studio}`;
  // console.log("Fetching data from:", url);

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    console.log("Fetched data:", data);

    return data[0]; // Flatten the nested arrays into a single array
  } catch (error) {
    console.error("Error fetching data:", error);
    return []; // Return an empty array or handle the error as needed
  }
}

const Studio = getCookie("studio");
var data;

async function init() {
  try {
    // Fetch data from the API
    data = {
      framesData: await fetchData("frames", Studio), // Fetch frames data
      topupData: await fetchData("topup", Studio), // Fetch topup data (changed from 'frames' to 'topup')
    };

    // Call subsequent initialization functions with the fetched data
    // init1(data.framesData, data.topupData);
    init2(data.topupData);
    init3(data.framesData);
  } catch (error) {
    console.error("Error fetching data:", error); // Error handling for failed fetches
  }
}

window.onload = init;
// console.log('data', data)
