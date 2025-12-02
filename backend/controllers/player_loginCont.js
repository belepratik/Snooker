const pool = require("../db/db");
const { setUser } = require("../utils/authUtil");

const player_login = async (req, res) => {
  try {
    // 1. Destructure and validate input
    const { name, pin } = req.body;
    if (!name || !pin) {
      return res.status(400).json({ error: "Name and PIN are required" });
    }

    // 2. Get all query parameters
    const { rank, studio_id, studio_name } = req.query;

    // 3. Database query with improved error handling
    let playerDets;
    try {
      const [results] = await pool.query(
        `SELECT * FROM masterplayer WHERE Players = ? AND pin = ?`,
        [name, pin]
      );
      playerDets = results;
    } catch (dbError) {
      console.error("Database error:", dbError);
      return res.status(500).json({ error: "Database operation failed" });
    }

    // 4. Check if player exists
    if (!playerDets || !playerDets[0] || !playerDets[0].Players) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // 5. Create session
    const sessionID = setUser(playerDets[0]);
    if (!sessionID) {
      throw new Error("Session creation failed");
    }

    // 6. Build redirect URL with all parameters
    const queryParams = new URLSearchParams();
    queryParams.append('player', name);
    if (rank) queryParams.append('rank', rank);
    if (studio_id) queryParams.append('studio_id', studio_id);
    if (studio_name) queryParams.append('studio_name', studio_name);

    // 7. Set cookie
    res.cookie("uid", sessionID, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // true in production
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000, // 1 day
      path: '/'
    });

    // 8. Redirect with all parameters
    return res.redirect(`/playerDashboard?${queryParams.toString()}`);

  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ 
      error: "Login failed",
      message: error.message 
    });
  }
};

module.exports = { player_login };