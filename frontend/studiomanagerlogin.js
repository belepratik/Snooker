document.addEventListener('DOMContentLoaded', () => {
  
// Google Sheets ID
 

    document.getElementById('studioManagerLoginForm').addEventListener('submit', function(e) {
        e.preventDefault();
        login();
    });

    function login() {
        const studioName = document.getElementById('studioName').value;
        const pin = document.getElementById('pin').value;

        if (!studioName || !pin) {
            alert('Please enter studio name and PIN');
            return;
        }

        fetchStudioInfo(studioName, pin);
    }

    function fetchStudioInfo(studioName, pin) {
        fetch(`api/sheet/Studios`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok: ' + response.statusText);
                }
                return response.json();
            })
            .then(data => {
                const studioRow = data.values.find(row => row[5] === studioName && row[3] === pin);
                if (studioRow) {
                    const securityKey = studioRow[4]; // Security key is in column E
                    window.location.href = `clubframes.html?studio=${encodeURIComponent(studioName)}&security=${securityKey}`;
                } else {
                    alert('Invalid studio name or PIN. Please try again.');
                }
            })
            .catch(error => {
                console.error('Error fetching data:', error);
                alert('There was an error fetching the studio information.');
            });
    }
});


