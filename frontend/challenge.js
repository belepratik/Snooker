document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const challengerName = urlParams.get('name');
    const challengerInput = document.getElementById('challenger-name');
    const challengerNameDisplay = document.getElementById('challenger-name-display');

    if (challengerName && challengerInput) {
        challengerInput.value = challengerName;
        challengerNameDisplay.textContent = challengerName;
    }

    fetchPlayerList(); // Fetch the player list for the datalist
    fetchIncomingChallenges(challengerName); // Fetch incoming challenges

    const form = document.getElementById('challenge-form');
    form.addEventListener('submit', function(event) {
        event.preventDefault();
        const opponent = document.getElementById('opponent-name').value;
        const matchType = document.getElementById('match-type').value;
        submitChallenge(challengerName, opponent, matchType);
    });
});

function fetchPlayerList() {
    // ... (fetch player list and populate datalist as described in the previous response)
}

function fetchIncomingChallenges(challengerName) {
    // ... (fetch incoming challenges and display them)
}

function submitChallenge(challenger, opponent, matchType) {
    // Correct web app URL from your Google Apps Script deployment
    const webAppUrl = 'https://script.google.com/macros/s/AKfycbxtyT4Ts7KHV7_XXoNFqBMxfsNdCVN2m3Kg05ZtQMUJDRupMbqRF3lQNjaqH-kpUQOx/exec';

    fetch(webAppUrl, {
        method: 'POST',
        mode: 'no-cors',
        cache: 'no-cache',
        redirect: 'follow',
        referrerPolicy: 'no-referrer',
        body: JSON.stringify({ challenger, opponent, matchType })
    })
    .then(response => {
        console.log('Challenge submitted successfully');
        // You can redirect the user or display a success message here
    })
    .catch(error => {
        console.error('Error:', error);
        // You can display an error message to the user here
    });
}
