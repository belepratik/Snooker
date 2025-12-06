const { timeDiff } = require('./timeDiffUtil.js');

async function getSlotsForSession(connection, startTime, endTime) {
    console.log(`Getting slots for session from ${startTime} to ${endTime}`);
    
    console.log(`⚡ Slot Calc: from ${startTime} to ${endTime}`);

    // Fix seconds drift
    startTime = normalize(startTime);
    endTime = normalize(endTime);

    let slotsUsed = [];
    let current = startTime;
    let iteration = 0;
    const MAX_ITER = 20; // Prevent infinite loop

    while (iteration++ < MAX_ITER) {
      // ⭐ NEW SQL: Perfect slot detection, works for previous slots too
      let [rows] = await connection.query(
        `SELECT slot, end 
         FROM slots
         WHERE TIME(?) BETWEEN TIME(Start) AND 
               TIME(CASE WHEN end = '00:00:00' THEN '23:59:59' ELSE end END)
         LIMIT 1`,
        [current]
      );

      // No slot found → break cleanly
      if (!rows.length) break;

      const { slot, end } = rows[0];

      let slotEnd =
        end === "00:00:00"
          ? "23:59:59"
          : end;

      // Calculate durations
      const slotRemaining = timeDiff(current, slotEnd);
      const sessionRemaining = timeDiff(current, endTime);

      // If session ends inside this slot
      if (sessionRemaining <= slotRemaining) {
        if (sessionRemaining > 0) {
          slotsUsed.push({
            slot,
            from: current,
            to: endTime,
            duration: sessionRemaining,
          });
        }
        break;
      }

      // Session continues into next slot
      if (slotRemaining > 0) {
        slotsUsed.push({
          slot,
          from: current,
          to: slotEnd,
          duration: slotRemaining,
        });
      }

      // Move to next slot boundary
      current = slotEnd;

      // Stop if we've passed endTime
      if (current >= endTime) break;
    }

    if (iteration >= MAX_ITER) {
      console.warn('Slot calculation reached max iterations, possible data error.');
    }

    return slotsUsed;



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