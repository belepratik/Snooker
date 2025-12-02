function minutes(timeString) {
  const [hours, minutes, seconds] = timeString.split(":").map(Number);
  const totalMinutes = hours * 60 + minutes;
  return totalMinutes;
}

function timeDiff(startTime, endTime) {
  const startMinutes = minutes(startTime);
  const endMinutes = minutes(endTime);
  let diffMinutes = endMinutes - startMinutes;
  if (diffMinutes < 0) {
    diffMinutes += 24 * 60;
  }
  return diffMinutes;
}

module.exports = { timeDiff };