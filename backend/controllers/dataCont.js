// Fetch club info (logo, name) by studio
const clubInfo = async (req, res) => {
  try {
    const studio = req.query.studio;
    if (!studio) {
      return res.status(400).json({ success: false, msg: "Missing studio parameter" });
    }
    // Adjust column names as per your DB schema
    const sql = `SELECT Studio, Studio_name, bannerImg FROM masterstudio WHERE Studio = ? LIMIT 1`;
    const [rows] = await pool.query(sql, [studio]);
    if (!rows.length) {
      return res.status(404).json({ success: false, msg: "Studio not found" });
    }
    const club = rows[0];
    res.status(200).json({
      success: true,
      studio: club.Studio,
      clubName: club.Studio_name,
      logo: club.bannerImg // or use the correct column for logo
    });
  } catch (error) {
    console.log("clubInfo error", error.message);
    res.status(500).json({ success: false, msg: error.message });
  }
};
const pool = require("../db/db");

const isVAlidTAbleName = (tableName) => {
  const validTable = [
    "masterplayer",
    "purchase",
    "expense",
    "operatorlogs",
    "frames",
    "masteritem",
    "tabledets",
    "studiodaily",
    "leaderboard",
    "adjustment",
    "masterstudio",
    "tabledets",
    "topup",
  ];
  const lower = (tableName || "").toLowerCase();
  const isValid = validTable.includes(lower);
  if (!isValid) {
    console.log("isVAlidTAbleName check failed for table:", tableName, "(lower:", lower, ")");
  }
  return isValid;
};

const frameData = async (req, res) => {
  try {
    // const uid = req.cookies.uid ;
    const studio = req.query.studio;
    const limit = req.query.limit;

      console.log('[frameData] Requested studio:', studio);
    var sql;

    if (limit) {
      sql = `SELECT FrameId, Edited, StartTime, OffTime, TableId, tableName, Duration, TotalMoney, Share, fixedCharge, Status, 
                    P1, P2, P3, P4, P5, P6,LP01, LP02, LP03, LP04, LP05, LP06, LP07, LP08, LP09, LP010
                    FROM frames WHERE Studio = "${studio}" ORDER BY FrameId DESC LIMIT ${limit}`;
    } else {
      sql = `SELECT FrameId, Edited, StartTime, OffTime, TableId, tableName, Duration, TotalMoney, Share, fixedCharge, Status, 
                    P1, P2, P3, P4, P5, P6,LP01, LP02, LP03, LP04, LP05, LP06, LP07, LP08, LP09, LP10 FROM frames WHERE Studio = "${studio}"`;
    }

      console.log('[frameData] SQL:', sql);
    data = await pool.query(sql);
    // Always return an array for consistency
    if (Array.isArray(data)) {
      res.status(200).json(data);
    } else if (data) {
      res.status(200).json([data]);
    } else {
      res.status(200).json([]);
    }
  } catch (error) {
    console.log("error", error.message);
    res.status(400).json({ success: "failed", msg: error.message });
  }
};

const studioData = async (req, res) => {
  try {
    const table = req.params.table;
    const studio = req.query.studio;
    const limit = req.query.limit;
    const onlyActive = req.query.active === '1' || req.query.active === 'true';
    if (!isVAlidTAbleName(table)) {
      return res.status(400).send("Invalid Table Name");
    }
    let sql = `SELECT * FROM ${table}`;
    const params = [];
    const where = [];
    if (studio) {
      // Use correct case for frames table
      if (table.toLowerCase() === 'frames') {
        where.push('FIND_IN_SET(?, Studio)>0');
      } else {
        where.push('FIND_IN_SET(?, studio)>0');
      }
      params.push(studio);
    }
    if (onlyActive) {
      where.push('(Coins > 0 OR coins > 0)');
    }
    if (where.length) {
      sql += ' WHERE ' + where.join(' AND ');
    }
    // Use correct ORDER BY for each table
    if (table.toLowerCase() === 'leaderboard') {
      sql += ' ORDER BY coins DESC';
    } else if (table.toLowerCase() === 'frames') {
      sql += ' ORDER BY FrameId DESC';
    }
    if (limit) {
      sql += ' LIMIT ?';
      params.push(Number(limit));
    }
    console.log('studioData SQL:', sql);
    console.log('studioData params:', params);
    const [rows] = await pool.query(sql, params);
    console.log('studioData result:', rows);
    res.status(200).json(rows);
  } catch (error) {
    console.log("error", error);
    res.status(400).json({ success: "failed", msg: error.message, error });
  }
};
const leaderboardData = async (req, res) => {
  try {
    const table = req.params.table;

    if (!isVAlidTAbleName(table)) {
      return res.status(400).send("Invalid Table Name");
    }
    let data;
    sql = `SELECT * FROM ${table} order by coins DESC`;
    data = await pool.query(sql);
    // console.log(sql)

    res.status(200).json(data);
  } catch (error) {
    console.log("error", error.message);
    res.status(400).json({ success: "failed", msg: error.message });
  }
};

const playerData = async (req, res) => {
  try {
    const player = req.params.player;
    const table = req.params.table;
    const studio = req.query.studio;
    if (!isVAlidTAbleName(table)) {
      return res.status(400).send("Invalid Table Name");
    }

    sql = `SELECT * FROM ${table} WHERE players = '${player}' `;
    let [data] = await pool.query(sql);
    // console.log(sql,data[0])

    res.status(200).json(data);
  } catch (error) {
    console.log("error", error.message);
    res.status(400).json({ success: "failed", msg: error.message });
  }
};
const framesData = async (req, res) => {
  try {
    const frameId = req.params.frameId;
    const table = req.params.table;
    const studio = req.query.studio;
    if (!isVAlidTAbleName(table)) {
      return res.status(400).send("Invalid Table Name");
    }

    sql = `SELECT * FROM ${table} WHERE FrameId = '${frameId}' `;
    let [data] = await pool.query(sql);
    // console.log(sql,data[0])

    res.status(200).json(data);
  } catch (error) {
    console.log("error", error.message);
    res.status(400).json({ success: "failed", msg: error.message });
  }
};

const tvData = async (req, res) => {
  try {
    let studio = req.cookies.studio;

    let tableSql = `SELECT table_id,table_name FROM tabledets WHERE studio = ?`;
    let tableData = await pool.query(tableSql, [studio]);
    tableData = tableData[0];
    
    let frameSql =
      "Select FrameId ,StartTime,TableID,P1,P2,P3,P4,P5,P6 from frames where studio = ? and status= 'ON';";
    let frameData = await pool.query(frameSql, [studio]);
    frameData = frameData[0];

    // Assuming tableData and frameData are arrays returned from DB
    let tables = tableData.map((table) => {
      // Find matching frame by table_id
      let matchingFrame = frameData.find(
        (frame) => frame.TableID?.trim() === table.table_id.trim()
      );

      if (matchingFrame) {
        return {
          table_id: table.table_id,
          table_name: table.table_name,
          players: [
            matchingFrame.P1,
            matchingFrame.P2,
            matchingFrame.P3,
            matchingFrame.P4,
            matchingFrame.P5,
            matchingFrame.P6,
          ].filter(Boolean),
          frameId: matchingFrame.FrameId,
          startTime: matchingFrame.StartTime,
          isOccupied: true,
        };
      } else {
        return {
          table_id: table.table_id,
          table_name: table.table_name,
          isOccupied: false,
            players: [],
        };
      }
    });
    res.status(200).json({success: "success", data: tables});   
  } catch (error) {
    console.log("error", error.message);
    res.status(400).json({ success: "failed", msg: error.message });
  }
};

module.exports = {
  studioData,
  playerData,
  frameData,
  framesData,
  leaderboardData,
  tvData,
  clubInfo
};
