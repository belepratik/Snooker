const { timeDiff } = require('./timeDiffUtil.js');

async function getSlotsForSession(connection, startTime, endTime) {
    console.log(`Getting slots for session from ${startTime} to ${endTime}`);
    
  let slotsUsed = [];
  let currentTime = startTime;

  while (true) {
    // console.log(`Current time: ${currentTime}, End time: ${endTime}`);
    // Get the slot for current time
    let [rows] = await connection.query(
      `SELECT slot, end FROM slots WHERE ? >= Start AND (? < end OR end = '00:00:00')`,
      [currentTime, currentTime]
    );

    if (!rows.length) break;

    const { slot, end } = rows[0];
    const cleanSlot = slot;
    const slotRemaining = timeDiff(currentTime, end);

    const sessionRemaining = timeDiff(currentTime, endTime);

    if (sessionRemaining <= slotRemaining) {
      // Session ends within this slot
      slotsUsed.push({
        slot: cleanSlot,
        from: currentTime,
        to: endTime,
        duration: sessionRemaining,
      });
      break;
    } else {
      // Session continues beyond this slot
      slotsUsed.push({
        slot: cleanSlot,
        from: currentTime,
        to: end,
        duration: slotRemaining,
      });
      currentTime = end; // Move to next slot
    }
  }

  return slotsUsed;



}


module.exports = {getSlotsForSession};