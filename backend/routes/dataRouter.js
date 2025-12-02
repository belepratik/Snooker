const express = require("express");
const router = express.Router();

const {studioData,playerData ,framesData,frameData, leaderboardData,tvData } = require("../controllers/dataCont");

router.get("/data/tv",tvData)
router.get("/playerData/:table/:player",playerData);
router.get("/framesData/:table/:frameId",framesData);
router.get("/frameData",frameData);
router.get("/LeaderboardData/:table",leaderboardData);

router.get("/data/:table",studioData);
router.get("/data/:table/:studio",studioData);


module.exports = router;