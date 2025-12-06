const pool = require("../db/db");

// Send GG API
const sendGG = async (req, res) => {
  try {
    const { frame_id, from_player, to_player } = req.body;
    if (!frame_id || !from_player || !to_player) {
      return res.status(400).json({ success: false, msg: "Missing parameters" });
    }

    // Fetch frame
    const [frames] = await pool.query("SELECT P1, P2, gg1, gg2 FROM frames WHERE FrameId = ?", [frame_id]);
    if (!frames.length) {
      return res.status(404).json({ success: false, msg: "Frame not found" });
    }
    const frame = frames[0];
    let updateField = null;
    let alreadySent = false;

    if (frame.P1 === from_player) {
      if (frame.gg1 === from_player) alreadySent = true;
      updateField = "gg1";
    } else if (frame.P2 === from_player) {
      if (frame.gg2 === from_player) alreadySent = true;
      updateField = "gg2";
    } else {
      return res.status(400).json({ success: false, msg: "Sender not in frame" });
    }

    if (alreadySent) {
      return res.status(200).json({ success: false, msg: "Already sent" });
    }

    // Update gg1/gg2 in frames
    await pool.query(`UPDATE frames SET ${updateField} = ? WHERE FrameId = ?`, [from_player, frame_id]);
    // Increment gg_count for to_player in leaderboard
    await pool.query(`UPDATE leaderboard SET gg_count = gg_count + 1 WHERE players = ?`, [to_player]);

    // Fetch updated gg1, gg2
    const [updated] = await pool.query("SELECT gg1, gg2 FROM frames WHERE FrameId = ?", [frame_id]);
    res.status(200).json({ success: true, frame_id, gg1: updated[0].gg1, gg2: updated[0].gg2 });
  } catch (error) {
    console.log("sendGG error", error.message);
    res.status(500).json({ success: false, msg: error.message });
  }
};

module.exports = { sendGG };