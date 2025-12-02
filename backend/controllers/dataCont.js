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
  if (validTable.includes(tableName.toLowerCase())) {
    return true;
  }
  return false;
};

const frameData = async (req, res) => {
  try {
    // const uid = req.cookies.uid ;
    const studio = "Studio 111";
    const limit = req.query.limit;

    var sql;

    if (limit) {
      sql = `SELECT FrameId, Edited, StartTime, OffTime, TableId, tableName, Duration, TotalMoney, Share, fixedCharge, Status, 
                    P1, P2, P3, P4, P5, P6,LP01, LP02, LP03, LP04, LP05, LP06, LP07, LP08, LP09, LP010
                    FROM frames WHERE studio = "${studio}" ORDER BY FrameId DESC LIMIT ${limit}`;
    } else {
      sql = `SELECT FrameId, Edited, StartTime, OffTime, TableId, tableName, Duration, TotalMoney, Share, fixedCharge, Status, 
                    P1, P2, P3, P4, P5, P6,LP01, LP02, LP03, LP04, LP05, LP06, LP07, LP08, LP09, LP10 FROM frames WHERE studio = "${studio}"`;
    }

    data = await pool.query(sql);

    res.status(200).json(data);
  } catch (error) {
    console.log("error", error.message);
    res.status(400).json({ success: "failed", msg: error.message });
  }
};

const studioData = async (req, res) => {
  try {
    // console.log('req.params', req.params)
    const table = req.params.table;
    const studio = req.params.studio;
    const limit = req.query.limit;

    if (!isVAlidTAbleName(table)) {
      return res.status(400).send("Invalid Table Name");
    }
    let data;
    if (studio) {
      if (limit) {
        sql = `SELECT * FROM ${table} WHERE FIND_IN_SET("${studio}", studio)>0  ORDER BY FrameId DESC LIMIT ${limit}`;
      } else {
        sql = `SELECT * FROM ${table} WHERE FIND_IN_SET("${studio}", studio)>0 `;
      }
      data = await pool.query(sql);
    } else {
      sql = `SELECT * FROM ${table} `;
      data = await pool.query(sql);
    }
    // console.log(data)

    res.status(200).json(data);
  } catch (error) {
    console.log("error", error.message);
    res.status(400).json({ success: "failed", msg: error.message });
  }
};
const leaderboardData = async (req, res) => {
  try {
    const table = req.params.table;

    if (!isVAlidTAbleName(table)) {
      return res.status(400).send("Invalid Table Name");
    }
    let data;
    sql = `SELECT * FROM ${table} order by Coins DESC`;
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
  tvData
};
