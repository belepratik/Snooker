const pool = require("../db/db");
const { setUser } = require("../utils/authUtil");

const club_login = async (req, res) => {
  try {
    const { username, password, role, mode } = req.body;

    if (!username || !password || !role) {
      return res.status(400).json({ success: false, message: "Missing credentials." });
    }

    if (role !== "admin" && role !== "operator") {
      return res.status(401).json({ success: false, message: "Invalid role specified." });
    }

    const trimmedUsername = username.trim();
    const trimmedPassword = password.trim();

    let studio, securityKey, clubName, store ,clubLogo;

    if (role === "admin") {
      const [studioDets] = await pool.query(
        "SELECT * FROM masterstudio WHERE Studio = ? AND ownerPass = ?",
        [trimmedUsername, trimmedPassword]
      );

      if (!studioDets.length) {
        return res.status(401).json({ success: false, message: "Invalid admin credentials." });
      }

      const studioData = studioDets[0];
      studio = studioData.Studio;
      securityKey = studioData.SecurityKey;
      clubName = studioData.Studio_name;
      clubLogo = studioData.clublogo;


      store = { Studio: studio, role, mode, securityKey };

    } else if (role === "operator") {
      const [studioDets] = await pool.query(
        "SELECT * FROM operators WHERE Operator_name = ? AND password = ?",
        [trimmedUsername, trimmedPassword]
      );

      if (!studioDets.length) {
        return res.status(401).json({ success: false, message: "Invalid operator credentials." });
      }

      const clubLogoQuery = await pool.query(
        "SELECT clublogo FROM masterstudio WHERE Studio = ?",
        [studioDets[0].Studio]
      );

      if (clubLogoQuery[0].length > 0) {
        clubLogo = clubLogoQuery[0][0].clublogo;
      }

      const studioData = studioDets[0];
      studio = studioData.Studio;
      clubName = studioData.clubName;
      securityKey = studioData.SecurityKey;

      store = {
        Studio: studio,
        role,
        name: trimmedUsername,
        operatorId: studioData.Sno,
        mode,
      };
    }

    if (!studio || !securityKey) {
      return res.status(401).json({ success: false, message: "Login failed. Studio not found." });
    }

    // Clear existing relevant cookies
    const cookiesToClear = ["uid", "studio", "clubName", "security"];
    cookiesToClear.forEach((cookie) => {
      res.clearCookie(cookie, { path: "/" });
    });

    // Set session and cookies
    const sessionID = setUser(store);

    res.cookie("uid", sessionID, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Enable secure flag in prod
      sameSite: "Strict",
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.cookie("studio", studio);
    res.cookie("clubName", clubName);
    res.cookie("security", securityKey);
    res.cookie("clubLogo", clubLogo|| '');

    // Determine redirect path
    const nfcStudios = ["Studio 111", "Studio 313", "Studio 056", "Studio 212"];
    const redirectPath =
      mode === "manual" || !nfcStudios.includes(studio)
        ? role === "admin"
          ? "/dashboard"
          : "/frame"
        : "/tvFrames";

    return res.redirect(redirectPath);

  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
};

exports.club_login = club_login;
