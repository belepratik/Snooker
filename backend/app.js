const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const path = require("path");
const on_off_Router = require("./routes/on_off_Router");
const ggRouter = require("./routes/ggRouter");
const loginRouter = require("./routes/loginRouter");
const paymentRouter = require("./routes/paymentRouter");
const addPlayerRouter = require("./routes/addPlayerRouter");
const editPlayerRouter = require("./routes/editPlayerRouter");
const studioRouter = require("./routes/studioEditRouter");
const historyRouter = require("./routes/historyRouter");
const dataRouter = require("./routes/dataRouter");
const operatorRouter = require("./routes/operatorRouter");
const dashRoute = require("./routes/dashRoute");
const playerPaymentRouter = require("./routes/playerPaymentRouter");

const {restrictToLoggedIn} = require("./middlewares/sessionCheck");
const {removeCookie} = require("./middlewares/removeCookie");
const { dashData } = require("./controllers/dashDataCont");
const pool = require('./db/db');

const app = express();

app.use(express.static(path.join(__dirname, "..","frontend")));

app.use(cors());
app.use(bodyParser.json());
app.use(cookieParser());

// Parse URL-encoded bodies
app.use(bodyParser.urlencoded({ extended: true }));

// Serve Investor Dashboard at /invest (no login required)
app.get("/invest", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "frontend", "investor_dashboard.html"));
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "frontend", "index.html"));
});
app.get("/club",removeCookie, (req, res) => {
  res.sendFile(path.join(__dirname, "..", "frontend", "club_login.html"));
});
app.get("/dashboard",restrictToLoggedIn, (req, res) => {
  res.sendFile(path.join(__dirname, "..", "frontend", "dashb.html"));
});
app.get("/tvFrames",restrictToLoggedIn, (req, res) => {
  res.sendFile(path.join(__dirname, "..", "frontend", "tv.html"));
});

app.get("/frame", restrictToLoggedIn,(req, res) => {
  res.sendFile(path.join(__dirname, "..", "frontend", "clubframes.html"));
});
app.get("/markOn",  restrictToLoggedIn,(req, res) => {
  res.sendFile(path.join(__dirname, "..", "frontend", "updateactiveframe.html"));
});
app.get("/nfcOn", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "frontend", "onFrameNfc.html"));
});
app.get("/players", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "frontend", "clubplayers.html"));
});
app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "frontend", "playerinfo.html"));
});
app.get("/playerDashboard", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "frontend", "player_details.html"));
});
app.get("/record",  restrictToLoggedIn,(req, res) => {
  res.sendFile(path.join(__dirname, "..", "frontend", "clubHistory.html"));
});
// app.get("/dash",dashData);
app.get('/dbtest', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT 1 AS test');
    res.json({ success: true, result: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.use("/frames", on_off_Router);
app.use("/frames", ggRouter);
app.use("/login", loginRouter);
app.use("/player", paymentRouter);
app.use("/player", addPlayerRouter);
app.use("/player", editPlayerRouter);
app.use("/record", historyRouter);
app.use("/studio",studioRouter);
app.use("/apis", dataRouter);
app.use("/dash", dashRoute);
app.use("/operators", operatorRouter);
app.use("/payment", playerPaymentRouter);

exports.app = app;


