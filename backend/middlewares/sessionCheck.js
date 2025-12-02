const { getUser } = require("../utils/authUtil");

async function restrictToLoggedIn(req, res, next) {
  const token = req.cookies?.uid;
  if (!token) {
    return res.redirect("/club");
  }

  try {
    const user = getUser(token);

    if (!user) {
      console.log("no user");
      return res.redirect("/club");
    }

    req.user = user;
    next();
  } catch (error) {
    console.log(error);
    return res.redirect("/club");
  }
}

module.exports = { restrictToLoggedIn };
