/**
 * @function offMatch
 * @description
 * Turns off an ongoing frame in the system, updates the database with results,
 * calculates charges, updates player balances, leaderboard, and table status.
 * Optionally triggers a rematch if requested.
 * 
 * @param {Object} req - Express request object
 * @param {Object} req.body
 * @param {Array} req.body.players - List of Lost player names (max 10)
 * @param {number} req.body.frameID - ID of the frame to be turned off
 * @param {number} [req.body.bet=0] - Bet amount (optional)
 * @param {string} req.body.studio - Studio name or ID
 * @param {boolean} [req.body.rematch=false] - If true, triggers rematch creation
 * 
 * @param {Object} res - Express response object
 * 
 * @returns {JSON} success or error message
 * 
 * @sideeffects
 * - Updates `frames`, `masterplayer`, `leaderboard`, `tabledets` tables
 * - Commits/rolls back MySQL transaction
 * - Logs important actions
 */


const pool = require("../db/db");
const { getSlotsForSession } = require("../utils/getSlotData");
const { formatDateTime, calLoserStake, applyMinDurationRules, calculateWinnerAndLoser } = require("../utils/OffMatchUtils");
const { onMatchCore } = require("./onMatchcont");
const fetch = require("node-fetch");


const offMatch = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // ---- Step 1: Prepare date/time ----
    const now = new Date();
    const { dateTime: timeOff, time } = formatDateTime(now);

    // ---- Step 2: Read request data ----
    let { players, frameID, bet = 0, studio , rematch } = req.body;

    const P = Array(10).fill(null);
    players.forEach((p, i) => { if (i < 10) P[i] = p; });

    // ---- Step 3: Fetch frame details ----
    const [Frames] = await connection.query(
      `SELECT StartTime,tableName, TableId, fixedRate, P1, P2,P3,P4,P5,P6, Roaster, pauseTime, resumeTime, durationBkp, totalMoney2 
       FROM frames WHERE FrameId = ?`, [frameID]
    );

    const frame = Frames[0];

    const starttime = frame.resumeTime
      ? new Date(frame.resumeTime).toTimeString().split(" ")[0]
      : new Date(frame.StartTime).toTimeString().split(" ")[0];

    const table = frame.TableId;
    const tableName = frame.tableName;
    const fixedCharge = parseInt(frame.fixedRate);
    const roaster = frame.Roaster;
    const stp = `S${studio[7]}${studio[8]}table${table[1]},${roaster}`;
    const prePausedDuration = frame.durationBkp || 0;
    const prePausedCharge = parseFloat(frame.totalMoney2 || 0);

    const playedPlayers = [frame.P1, frame.P2, frame.P3, frame.P4, frame.P5, frame.P6].filter(Boolean);

    // ---- Step 4: Get slots ----
    const slots = await getSlotsForSession(connection, starttime, time);

    // ---- Step 5: Get tournament status ----
    const [leader] = await connection.query(
      `SELECT In_Tournament FROM tabledets WHERE table_id = ?`, [table]
    );
    const In_Tournament = leader[0].In_Tournament;

    // ---- Step 6: Winner/Loser calculation ----
    const { winner, loser, loserCoins, loserStake, winnerCount, loserCount, totalPlays } =
      await calculateWinnerAndLoser(connection, [frame.P1, frame.P2], players, roaster, studio);


    let split =  players.length;
    if(split<1){
      res.status(400).json({ success: false, error: "No players provided" });
    }
    // ---- Step 7: Duration & Charge Calculation ----
    let computedDuration = prePausedDuration + slots.reduce((sum, s) => sum + parseFloat(s.duration), 0);
    let adjustedDuration = applyMinDurationRules(studio, table, computedDuration);
    let charge = prePausedCharge || 0;

    if (!fixedCharge) { // Only calculate slot-based charges if not fixed
      for (const slotDet of slots) {
        const slotNo = slotDet.slot;
        const [amount] = await connection.query(`SELECT ${slotNo} FROM charges WHERE STP = ?`, [stp]);
        const charges = amount[0][slotNo];
        // Apply charge for the actual duration in this slot
        charge += charges * slotDet.duration;
      }
    }

    let total = charge;
    if (fixedCharge) {
      const [rate] = await connection.query(`SELECT fixedRate FROM charges WHERE STP = ?`, [stp]);
      total = rate[0].fixedRate * computedDuration;
    }

    // ---- Step 8: Frame update ----
    if (fixedCharge) {
      const [rate] = await connection.query(`SELECT fixedRate FROM charges WHERE STP = ?`, [stp]);
      await connection.query(
        `UPDATE frames SET Winner=?, Status='OFF', Plus=?, OffTime=?, fixedCharge=?, totalMoney2=?, split=?, 
         LP01=?, LP02=?, LP03=?, LP04=?, LP05=?, LP06=?, LP07=?, LP08=?, LP09=?, LP10=?, 
         Looser=?, LooserCoins=?, LooserStake=? WHERE FrameId=?`,
        [winner, bet, timeOff, rate[0].fixedRate, total, split, ...P,
          loser, loserCoins, loserStake, frameID]
      );
    } else {
      await connection.query(
        `UPDATE frames SET durationBkp=?, Winner=?, Status='OFF', Plus=?, OffTime=?, totalMoney2=?, split=?, 
         LP01=?, LP02=?, LP03=?, LP04=?, LP05=?, LP06=?, LP07=?, LP08=?, LP09=?, LP10=?, 
         Looser=?, LooserCoins=?, LooserStake=? WHERE FrameId=?`,
        [computedDuration, winner, bet, timeOff, total, split, ...P,
          loser, loserCoins, loserStake, frameID]
      );
    }

    if(roaster < 3 && loser !== null) {
      // winner
      await connection.query("UPDATE leaderboard SET `Matches_On` = `Matches_On` + 1, `Matches_Off` = `Matches_Off` + ?, `Total_Frame` = `Total_Frame` + ?, `coins` = `coins` + ?, `My_win` = COALESCE(`My_win`, 0) + ? WHERE players = ? AND studio = ?",[winnerCount,totalPlays,loserStake,loserStake,winner,studio]);

      // loser
      await connection.query("UPDATE leaderboard SET `Matches_On` = `Matches_On` + 1, `Matches_Off` = `Matches_Off` + ?, `Total_Frame` = `Total_Frame` + ?, `coins` = `coins` - ?, `My_loss` = COALESCE(`My_loss`, 0) + ? WHERE players = ? AND studio = ?",[loserCount,totalPlays,loserStake,loserStake,loser,studio]);
    }

    // ---- Step 9: Bet handling ----
    if (roaster < 3 && bet > 0) {
      // winner 
      await connection.query(`UPDATE masterplayer SET total = total - ? WHERE players=? AND studio=?`, [bet, winner, studio]);

      // loser
      await connection.query(`UPDATE masterplayer SET total = total + ? WHERE players=? AND studio=?`, [bet, loser, studio]);
    }

    // ---- Step 10: Share distribution ----
    const shares = Math.round(total / split);

    for (const player of players) {
      await connection.query(
        `UPDATE masterplayer SET tablemoney = COALESCE(tablemoney, 0) + ?, total = total + ? WHERE players=? AND studio=?`,
        [shares, shares, player, studio]
      );
      await connection.query(`UPDATE leaderboard SET Status=0 WHERE Players=? AND studio=?`, [player, studio]);
    }

    const playid = playedPlayers.map(p => '?').join(',');

    await connection.query(`UPDATE leaderboard SET status = 0 WHERE Players IN (${playid}) and studio = ?`, [...playedPlayers, studio]);

    // turn table status off 
    await connection.query(`UPDATE tabledets SET status = 0 WHERE table_id = ?`, [table]);
    let mark = true; 
    let fId = null ; 
    if (rematch) {
      let rematch = await onMatchCore({
        connection , 
        mark,
        frameID: fId,
        startTime : timeOff,
        studio,
        table,
        tableName,
        fixed: parseInt(fixedCharge),
        players : playedPlayers
      });
    }

    const deviceIdSql = "select device_id from tabledets where table_id = ?";
    const device = await connection.query(deviceIdSql, table);
    if (device[0].length > 0) {
      console.log(device[0][0].device_id);

      const deviceId = device[0][0].device_id;
      const iftttUrl = `https://maker.ifttt.com/trigger/${deviceId}_off/with/key/bhUkMYpY3lMdecsq2ZOW6z`;

      try {
        await fetch(iftttUrl, { method: "POST" });
        // console.log(`Triggered IFTTT OFF for device_id: ${deviceId}`);
      } catch (err) {
        console.error(
          `Failed to trigger IFTTT OFF for device_id: ${deviceId}`,
          err
        );
      }
    }

    await connection.commit();
    res.status(200).json({ success: true });

  } catch (error) {
    console.error("Error turning off frame:", error);
    await connection.rollback();
    res.status(500).json({ success: false, error: "Failed to off frame" });
  } finally {
    connection.release();
  }

};

exports.offMatch = offMatch;
