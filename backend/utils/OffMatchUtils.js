
const formatDateTime = (dateObj) => {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const day = String(dateObj.getDate()).padStart(2, "0");
    const time = dateObj.toTimeString().split(" ")[0];
    return {
        date: `${year}-${month}-${day}`,
        time,
        dateTime: `${year}-${month}-${day} ${time}`
    };
};

const calLoserStake = (loserCoins) => {
    if (loserCoins < 10) {
        return 0;
    } else if (loserCoins > 70) {
        return 7;
    } else {
        return loserCoins * 0.1;
    }
}

const applyMinDurationRules = (studio, table, duration) => {
    if (studio === "Studio 141") {
        if (table === "T3Studio 141" && duration < 60) return 60;
        if (["T1Studio 141", "T2Studio 141"].includes(table) && duration < 30) return 30;
    }
    if (studio === "Studio 616" && duration < 20) return 20;
    return duration;
};

const calculateWinnerAndLoser = async (connection , player, players, roaster, studio) => {
    if (roaster >= 3) return { winner: null, loser: null, loserCoins: 0, loserStake: 0 };

    const [p1, p2] = player;
    if (p1 === p2) return { winner: null, loser: null, loserCoins: 0, loserStake: 0 };

    const counts = players.reduce((acc, p) => {
        if (p === p1) acc.p1++;
        else if (p === p2) acc.p2++;
        return acc;
    }, { p1: 0, p2: 0 });

    if (counts.p1 === counts.p2) return { winner: "tie", loser: null, loserCoins: 0, loserStake: 0 };

    const winner = counts.p1 < counts.p2 ? p1 : p2;
    const winnerCount = Math.max(counts.p1, counts.p2);
    const loser = counts.p1 > counts.p2 ? p1 : p2;
    const loserCount = Math.min(counts.p1, counts.p2);

    const [loserData] = await connection.query(
        `SELECT coins FROM leaderboard WHERE Players = ? AND studio = ?`,
        [loser, studio]
    );

    let loserCoins = loserData.length ? loserData[0].coins : 0;
    let loserStake = loserCoins > 0 ? calLoserStake(loserCoins) * Math.abs(counts.p2 - counts.p1) : 0;
    return { winner, loser, loserCoins, loserStake, winnerCount, loserCount, totalPlays: players.length };
};

module.exports = { formatDateTime, calLoserStake, applyMinDurationRules, calculateWinnerAndLoser };
