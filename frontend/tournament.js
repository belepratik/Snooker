document.addEventListener('DOMContentLoaded', function () {
    const API_KEY = 'AIzaSyC8Vuysinrwm5ww5WPM5W-GxBnGm1pOUr8';
    const SHEET_ID = '18Op0z2LfDIHV_o2vUNZxI1jMjZRvKQaiymMRNLzVrG4';
    const SHEET_NAME = 'Leaderboard';

    async function fetchData(round) {
        range = "A:I";
        const url = `api/sheet/${SHEET_NAME}/${range}`;
        const response = await fetch(url);
        const data = await response.json();
        return data.values.slice(1).filter(match => match[1].trim().toLowerCase() === round.toLowerCase());
    }

    window.changeRound = async function(round) {
        const data = await fetchData(round);
        const matchesContainer = document.getElementById('matchesContainer');
        matchesContainer.innerHTML = '';
        data.forEach(match => {
            const matchCard = createMatchCard(match, round);
            matchesContainer.appendChild(matchCard);
        });
        updateCurrentRoundIndicator(round);
        updateRoundSelectorColor(round);
    }

    function createMatchCard(match, round) {
    const roundClass = `round-${round.replace(/\s+/g, '').toLowerCase()}`; // Create a class based on the round
    const card = document.createElement('div');
    card.className = `card mb-3 ${roundClass}`; // Apply the round-specific class
    card.innerHTML = `
        <div class="card-body">
            <h5 class="card-title">${match[2]} vs ${match[3]}</h5>
            <p class="card-text">Table: ${match[4]}</p>
            <p class="card-text">Date & Time: ${match[5]}, ${match[6]}</p>
            <p class="card-text">Winner: ${match[7]}</p>
            <a href="${match[8]}" class="card-link" target="_blank">Match Link</a>
        </div>
    `;
    return card;
}


    function updateCurrentRoundIndicator(round) {
        document.getElementById('currentRoundText').textContent = round;
    }

   function updateRoundSelectorColor(round) {
    const colors = {
        'Group Stage': '#28a745', // Green
        'Knockout': '#964b00', // Brown
        'Quarter Finals': '#0000ff', // Blue
        'Semi Finals': '#ff69b4', // Pink
        'Finals': '#000000' // Black
    };
    // Ensure the round name matches exactly as it appears in the HTML and Sheets
    const color = colors[round];
    if (color) {
        document.getElementById('roundSelector').style.backgroundColor = color;
    } else {
        console.error('Round color not found:', round);
    }
}


    document.getElementById('roundSelector').addEventListener('click', function() {
        const dropdownContent = document.getElementById('dropdownContent');
        dropdownContent.style.display = dropdownContent.style.display === 'block' ? 'none' : 'block';
    });

    changeRound('Group Stage');
});
