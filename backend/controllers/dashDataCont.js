const pool = require("../db/db");
const { getUser } = require("../utils/authUtil");

function convertToIST(date) {
  // IST is UTC+5:30
  return new Date(date.getTime() + 5.5 * 60 * 60000);
}

const dashData = async (req, res) => {
  const uid = req.cookies.uid;
  let user = getUser(uid);
  let studio = user.Studio;

  const table = req.params.table;
  try {
    const tableQuery = `SELECT f.studio, DATE(f.StartTime) AS day, SUM(f.TotalMoney2) AS total_tableMoney, SUM(TIMESTAMPDIFF(MINUTE, f.StartTime, f.OffTime)) AS total_duration
                        FROM frames f
                        where studio = ?
                        GROUP BY DATE(f.StartTime)
                        ORDER BY f.studio, day;
                      `;
    const [tableData] = await pool.query(tableQuery, [studio]);

    const topupQuery = `SELECT 
                  DATE(RecordDate) AS topup_date, 
                  SUM(amount) AS total_topup, 
                  SUM(CASE WHEN mode = 'online' THEN amount ELSE 0 END) AS online_topup, 
                  SUM(CASE WHEN mode = 'Cash' THEN amount ELSE 0 END) AS cash_topup,
                  Studio 
              FROM topup
              where  Studio = "${studio}"
              GROUP BY DATE(RecordDate)  ,Studio
              ORDER BY topup_date ;
    `;

    const [topupData] = await pool.query(topupQuery);

    const purchaseQuery = `SELECT  DATE(RecordDate) AS purchase_date, SUM(amount) AS total_purchase,Studio
                            FROM purchase
                            WHERE Studio = "${studio}" GROUP BY DATE(RecordDate), Studio ORDER BY purchase_date;`;

    const [purchaseData] = await pool.query(purchaseQuery);

    const expenseQuery = `SELECT id,action, details, timestamp, operatorName FROM operatorLogs 
                          WHERE Studio = "${studio}";
`;
    const [expenseData] = await pool.query(expenseQuery);

    res.json({ tableData, topupData, purchaseData, expenseData });
  } catch (err) {
    console.error("Error fetching frame data:", err.message);
    res.status(400).json({ success: "failed", msg: err.message });
  }
};

const tableData = async (req, res) => {
  const month = req.query.month;
  // console.log('monthPerf', month)
  let year = 2025;
  let startDate = `2025-${month}-01`;
  const endDate = new Date(year, parseInt(month), 0)
    .toISOString()
    .split("T")[0];
  // console.log('startDate', startDate)
  // console.log('endDate', endDate)

  const uid = req.cookies.uid;
  let user = getUser(uid);
  let studio = user.Studio;

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    let durationSql = `WITH LatestStatus AS (
  SELECT f.TableId, f.Status
  FROM frames f
  JOIN (
    SELECT TableId, MAX(StartTime) AS LatestStart
    FROM frames
    WHERE Studio = ?
      AND DATE(StartTime) BETWEEN ? AND ?
    GROUP BY TableId
  ) latest ON f.TableId = latest.TableId AND f.StartTime = latest.LatestStart
  WHERE f.Studio = ?
),
TotalDurations AS (
  SELECT TableId, SUM(Duration) AS TotalDuration
  FROM frames
  WHERE Studio = ?
    AND DATE(StartTime) BETWEEN ? AND ?
  GROUP BY TableId
)
SELECT td.TableId, ls.Status, td.TotalDuration
FROM TotalDurations td
JOIN LatestStatus ls ON td.TableId = ls.TableId
ORDER BY td.TableId;`;

    let durationData = await connection.query(durationSql, [
      studio,
      startDate,
      endDate,
      studio,
      studio,
      startDate,
      endDate,
    ]);

    console.log("durationData", durationData[0]);

    res.json({ success: true, data: durationData[0] });
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    console.error("Error fetching table data:", error.message);
    res.status(400).json({ success: "failed", msg: error.message });
  } finally {
    connection.release();
  }
};

const peakData = async (req, res) => {
  const uid = req.cookies.uid;
  let user = getUser(uid);
  if (!uid || !user || user.role !== "admin") {
    return res.status(401).json({ error: "Unauthorized Access" });
  }

  console.log("user", user);
  let studio = user.Studio;

  // const studio =;
  // console.log("params",req.params);

  const month = req.query.month;
  console.log("month", month);

  if (!studio || !month) {
    return res.status(400).json({ error: "Missing studio or month" });
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    let dataSql = "Select StartTime, Duration from frames where Studio = ? ";
    let data = await connection.query(dataSql, [studio]);
    // console.log("data", data[0]);
    let rawData = data[0];
    const hourTotals = new Array(24).fill(0);

    rawData.forEach((record) => {
      const startTimeIST = new Date(record.StartTime);
      // const startTimeIST = convertToIST(startTimeUTC);
      // console.log("startTimeIST", startTimeIST);

      if (month) {
        const recordMonth = startTimeIST.getMonth() + 1; // getMonth() is 0-indexed
        if (recordMonth !== parseInt(month)) return;
      }

      const endTimeIST = new Date(
        startTimeIST.getTime() + record.Duration * 60000
      );
      let currentTime = new Date(startTimeIST);

      while (currentTime < endTimeIST) {
        const currentHour = currentTime.getHours(); // IST local hour
        let endOfHour = new Date(currentTime);
        endOfHour.setHours(currentHour + 1, 0, 0, 0);

        const segmentEnd = endTimeIST < endOfHour ? endTimeIST : endOfHour;
        const minutesInSegment = (segmentEnd - currentTime) / 60000;
        hourTotals[currentHour] += minutesInSegment;

        currentTime = segmentEnd;
      }
    });

    res.json(hourTotals);
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    console.error("Error in backend processing:", error);
    res.status(500).json({ error: "Server error" });
  } finally {
    connection.release();
  }
};

module.exports = { dashData, tableData, peakData };
