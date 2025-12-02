document.addEventListener('DOMContentLoaded', () => {
    function getQueryParam(param) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(param);
    }

    const rank = getQueryParam("rank");
    const playerNameParam = getQueryParam('player');
    const studioIdParam = getQueryParam('studio_id');
    const studioNameParam = getQueryParam('studio_name');

    const form = document.getElementById("playerInfoForm");
    
    // Build the URL with all parameters
    const params = new URLSearchParams();
    if (rank) params.append('rank', rank);
    if (playerNameParam) params.append('player', playerNameParam);
    if (studioIdParam) params.append('studio_id', studioIdParam);
    if (studioNameParam) params.append('studio_name', studioNameParam);
    
    form.action = `/login/player_login?${params.toString()}`;

    if (playerNameParam) {
        document.getElementById('name').value = decodeURIComponent(playerNameParam);
    }

    if (studioNameParam) {
        document.getElementById('club').value = decodeURIComponent(studioNameParam);
    }
});