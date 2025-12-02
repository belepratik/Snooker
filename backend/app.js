const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const path = require("path");
const on_off_Router = require("./routes/on_off_Router");
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

const app = express();

app.use(express.static(path.join(__dirname, "..","frontend")));

app.use(cors());
app.use(bodyParser.json());
app.use(cookieParser());

// Parse URL-encoded bodies
app.use(bodyParser.urlencoded({ extended: true }));

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

app.use("/frames", on_off_Router);
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


