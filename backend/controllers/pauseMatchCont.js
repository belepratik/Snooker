const pool = require("../db/db");
const { getUser } = require("../utils/authUtil");
const { getSlotsForSession } = require("../utils/getSlotData");
const fetch = require("node-fetch");

const pauseMatch = async (req, res) => {
  console.log("Pause match request received:", req.body.data);

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const date = `${year}-${month}-${day}`;
  const time = now.toTimeString().split(" ")[0];
  const timeOff = date + " " + time;

  let { frameId, startTime, table, roaster } = req.body.data;
  let uid = req.cookies.uid;

  const user = getUser(uid);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const studio = user.Studio;
  if (!studio) {
    return res.status(404).json({ error: "Studio not found" });
  }

  let stp = `S${studio[7]}${studio[8]}table${table[1]},${roaster}`;

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Get current frame data to check for previous pause/resume cycles
    const [frameData] = await connection.query(
      'SELECT resumeTime, durationBkp, totalMoney2 FROM frames WHERE FrameId = ?', 
      [frameId]
    );
    
    const frame = frameData[0];
    const effectiveStartTime = frame.resumeTime ? 
      new Date(frame.resumeTime).toTimeString().split(" ")[0] : 
      startTime;
    const previousDuration = frame.durationBkp || 0;
    const previousCharge = frame.totalMoney2 || 0;

    let slotsUsed = await getSlotsForSession(connection, effectiveStartTime, time);

    var charge = 0;
    var totalDuration = 0;
    for (const slot of slotsUsed) {
      let slotNo = slot.slot;
      let duration = parseFloat(slot.duration); // Use parseFloat instead of parseInt

      console.log("stp", stp);
      let amountSql = `Select ${slotNo} from charges where STP = ?  `;
      let [amount] = await connection.query(amountSql, [stp]);
      let charges = amount[0][slotNo];
      // console.log("amount",amount);

      totalDuration += duration;
      charge += charges * duration;
    }

    // Accumulate with previous duration and charge instead of overwriting
    const accumulatedDuration = previousDuration + totalDuration;
    const accumulatedCharge = previousCharge + charge;

    let pauseSql = `UPDATE frames SET status = 'paused',durationBkp = ?,pauseTime = ?,totalMoney2 = ? WHERE FrameId = ? `;
    let pausevalue = [accumulatedDuration, timeOff, accumulatedCharge, frameId];
    await connection.query(pauseSql, pausevalue);

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
    connection.release();
    res.status(200).json({ message: "Match paused successfully" });
  } catch (error) {
    console.error("Error pausing match:", error);
    await connection.rollback();
    connection.release();
    return res.status(500).json({ error: "Failed to pause match" });
  }
};


const resumeMatch = async (req, res) => {
  let frameId = req.body.frameId;

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const date = `${year}-${month}-${day}`;
  const time = now.toTimeString().split(" ")[0];
  const timeOff = date + " " + time;

  let connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    let tabledets = await connection.query(
      "SELECT Studio,TableId FROM frames WHERE FrameId = ?",
      [frameId]
    );
    let studio = tabledets[0][0].Studio;
    let table = tabledets[0][0].TableId;

    let resumeSql = `UPDATE frames SET status = 'resumed',resumeTime = ? WHERE FrameId = ? `;
    let resumeValue = [timeOff, frameId];
    await connection.query(resumeSql, resumeValue);

    const deviceIdSql = "select device_id from tabledets where table_id = ?";
    const device = await connection.query(deviceIdSql, table);
    // console.log({ device });
    if (device[0].length > 0) {
      console.log(device[0][0].device_id);

      const deviceId = device[0][0].device_id;
      // console.log("deviceId :>> ", deviceId);
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
    connection.release();
    res.status(200).json({ message: "Match resumed successfully" });
  } catch (error) {
    console.error("Error resuming match:", error);
    await connection.rollback();
    connection.release();
    res.status(500).json({ error: "Failed to resume match" });
  }
};

module.exports = { pauseMatch, resumeMatch };
