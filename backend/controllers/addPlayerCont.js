const { add } = require("nodemon/lib/rules");
var pool = require("../db/db");
var { getUser } = require("../utils/authUtil");

const addPlayer = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    let user = getUser(req.cookies.uid);

    let studio = user.Studio;
    let role = user.role;
    let operatorName = user.name;

    const { mobile, name} = req.body;

    // Check if mobile already exists in the same studio
    const mobileSql = `SELECT 1 FROM masterplayer WHERE MobileNo = ? AND Studio = ?`;
    const [mobileResult] = await connection.query(mobileSql, [mobile, studio]);

    if (mobileResult.length > 0) {
      await connection.rollback();
      return res
        .status(409)
        .json({
          success: false,
          msg: "Mobile number already exists in this club",
        });
    }

    // Check if name already exists in the same studio
    const nameSql = `SELECT 1 FROM masterplayer WHERE players = ? AND Studio = ?`;
    const [nameResult] = await connection.query(nameSql, [name, studio]);

    if (nameResult.length > 0) {
      await connection.rollback();
      return res
        .status(409)
        .json({ success: false, msg: "Name already exists in this club" });
    }

    // Get city from studio
    const citySql = `SELECT city FROM masterstudio WHERE studio = ?`;
    const [cityValue] = await connection.query(citySql, [studio]);
    const city = cityValue[0]?.city || "";
    const now = new Date();

    let addedBy = role== "admin" ? "admin" : operatorName;
    console.log('addedBy', addedBy)
    // Insert into masterplayer
    const insertPlayerSql = `INSERT INTO masterplayer (total, players, MobileNo, Studio, city, Registration_Date,added_by)
                         VALUES (?, ?, ?, ?, ?, ?,?)`;
    await connection.query(insertPlayerSql, [
      0,
      name,
      mobile,
      studio,
      city,
      now,
      addedBy,
    ]);

    // Insert into leaderboard
    const leaderboardSql = `INSERT INTO leaderboard (players, Matches_On, Matches_Off, Total_Frame, studio, city) VALUES (?, ?, ?, ?, ?, ?)`;
    await connection.query(leaderboardSql, [name, 0, 0, 0, studio, city]);

    await connection.commit();
    return res.json({ success: true, msg: "Player added successfully" });
  } catch (error) {
    console.error("Error adding player:", error);
    await connection.rollback();
    return res
      .status(500)
      .json({ success: false, error: "Failed to add player" });
  } finally {
    connection.release();
  }
};

exports.addPlayer = addPlayer;
