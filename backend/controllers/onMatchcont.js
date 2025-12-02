/**
 * @function onMatchCore
 * @description Core business logic for starting or updating a match frame.
 * @sideeffects
 *   - Updates tabledets table to mark table as occupied.
 *   - May release an old table if editing an existing frame.
 *   - Updates leaderboard status for participating players.
 *   - Inserts or updates frame details in frames table.
 *   - Commits or rolls back an active database transaction.
 * @param {Object} params - Parameters for starting/updating a frame.
 * @param {import('mysql2/promise').PoolConnection} params.connection - MySQL connection object with an active transaction.
 * @param {boolean} params.mark - If true, insert a new frame; otherwise, edit an existing frame.
 * @param {number} params.frameID - ID of the frame to update (only required if editing).
 * @param {string} params.startTime - The start time of the match in HH:mm:ss or full datetime format.
 * @param {string} params.studio - Studio identifier.
 * @param {string} params.table - Table ID (unique table code in tabledets).
 * @param {string} params.tableName - Human-readable table name.
 * @param {boolean|number} params.fixed - Whether the frame uses fixed charge rates (1 or 0).
 * @param {string[]} params.players - Array of player IDs or names (max length: 6).
 * @returns {Promise<Object>} Resolves to `{ success: true }` if operation succeeds.
 * @throws Will throw an error if the DB transaction fails, rolling back all changes.
 */

/**
 * @function onMatch
 * @description HTTP request handler for starting or updating a match frame via Express.
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @returns {Promise<void>} Sends JSON response to client with success or error status.
 * @sideeffects
 *   - Calls onMatchCore to perform DB updates.
 *   - Starts and commits/rolls back a DB transaction.
 *   - Sends HTTP JSON response.
 */

var pool = require("../db/db");
const fetch = require("node-fetch");

// Core function (independent of HTTP request/response)
async function onMatchCore({
  connection,
  mark,
  frameID,
  startTime,
  studio,
  table,
  tableName,
  fixed,
  players,
}) {
  try {
    const fixedRate = fixed ? 1 : 0;
    const roaster = players.length;
    const P = [...players, ...Array(6 - players.length).fill(null)];

    // Update table status
    await connection.query(
      `UPDATE tabledets SET status = 1 WHERE table_id = ?`,
      [table]
    );

    // Handle table release when editing
    if (!mark) {
      const [[{ TableId: oldTable }]] = await connection.query(
        `SELECT TableId FROM frames WHERE frameid = ?`,
        [frameID]
      );
      if (oldTable && oldTable !== table) {
        await connection.query(
          `UPDATE tabledets SET status = 0 WHERE table_id = ?`,
          [oldTable]
        );

        const oldDeviceSql =
          "SELECT device_id FROM tabledets WHERE table_id = ?";
        const oldDeviceRes = await connection.query(oldDeviceSql, [oldTable]);
        if (oldDeviceRes[0].length > 0) {
          const oldDeviceId = oldDeviceRes[0][0].device_id;
          const iftttOffUrl = `https://maker.ifttt.com/trigger/${oldDeviceId}_off/with/key/bhUkMYpY3lMdecsq2ZOW6z`;
          try {
            await fetch(iftttOffUrl, { method: "POST" });
          } catch (err) {
            console.error(
              `Failed to trigger IFTTT OFF for device_id: ${oldDeviceId}`,
              err
            );
          }
        }

        // Turn on new table light using IFTTT
        const newDeviceSql =
          "SELECT device_id FROM tabledets WHERE table_id = ?";
        const newDeviceRes = await connection.query(newDeviceSql, [table]);
        if (newDeviceRes[0].length > 0) {
          const newDeviceId = newDeviceRes[0][0].device_id;
          const iftttOnUrl = `https://maker.ifttt.com/trigger/${newDeviceId}_on/with/key/bhUkMYpY3lMdecsq2ZOW6z`;
          try {
            await fetch(iftttOnUrl, { method: "POST" });
          } catch (err) {
            console.error(
              `Failed to trigger IFTTT ON for device_id: ${newDeviceId}`,
              err
            );
          }
        }
      }
    }

    // Batch update leaderboard
    if (players.length > 0) {
      const placeholders = players.map(() => "?").join(",");
      await connection.query(
        `UPDATE leaderboard
         SET Status = 1
         WHERE studio = ?
         AND Players IN (${placeholders})`,
        [studio, ...players]
      );
    }

    // Insert or update frame
    if (mark) {
      await connection.query(
        `INSERT INTO frames
          (StartTime, Studio, TableId, tableName, fixedRate, Format, Status,
           P1, P2, P3, P4, P5, P6, Roaster)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          startTime,
          studio,
          table,
          tableName,
          fixedRate,
          roaster > 2 ? "Rummy" : "Dual",
          "ON",
          ...P,
          roaster,
        ]
      );
    } else {
      await connection.query(
        `UPDATE frames
         SET Edited = 'Yes', StartTime = ?, TableId = ?, tableName = ?,
             fixedRate = ?, Format = ?, Status = ?,
             P1 = ?, P2 = ?, P3 = ?, P4 = ?, P5 = ?, P6 = ?, Roaster = ?
         WHERE FrameId = ?`,
        [
          startTime,
          table,
          tableName,
          fixedRate,
          roaster > 2 ? "Rummy" : "Dual",
          "ON",
          ...P,
          roaster,
          frameID,
        ]
      );
    }

    const deviceIdSql = "select device_id from tabledets where table_id = ?";
    const device = await connection.query(deviceIdSql, table);
    if (device[0].length > 0) {
      console.log(device[0][0].device_id);

      const deviceId = device[0][0].device_id;
      const iftttUrl = `https://maker.ifttt.com/trigger/${deviceId}_on/with/key/bhUkMYpY3lMdecsq2ZOW6z`;

      try {
        await fetch(iftttUrl, { method: "POST" });
        // console.log(`Triggered IFTTT ON for device_id: ${deviceId}`);
      } catch (err) {
        console.error(
          `Failed to trigger IFTTT ON for device_id: ${deviceId}`,
          err
        );
      }
    }

    await connection.commit();
    return { success: true };
  } catch (error) {
    await connection.rollback();
    console.error("Error on frame:", error);
    throw error;
  } finally {
    connection.release();
  }
}

// HTTP handler (uses the core function)
async function onMatch(req, res) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { mark } = req.query;
    const {
      frameId,
      startTime,
      studio,
      tableNo: table,
      tableName,
      fixed,
      players,
    } = req.body;

    const result = await onMatchCore({
      connection,
      mark,
      frameID: parseInt(frameId),
      startTime,
      studio,
      table,
      tableName,
      fixed: parseInt(fixed),
      players,
    });

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to on frame" });
  }
}

module.exports = { onMatchCore, onMatch };

var mobileCheck = async (req, res) => {
  let connection = await pool.getConnection();

  try {
    let mobile = req.query.mobile;
    let studio = req.query.studio;

    let sql = `SELECT * FROM masterplayer WHERE mobile = ? AND studio = ?`;
  } catch (error) {
    console.error("Error on frame:", error);
    res.status(500).json({ success: false, error: "Failed to on frame" });
  }
};

module.exports = { onMatch, onMatchCore, mobileCheck };
