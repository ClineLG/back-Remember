const User = require("../models/User");

const isAuthenticated = async (req, res, next) => {
  if (!req.headers.authorization) {
    return res.status(404).json({ error: "Missing Token" });
  }

  const tokenTotest = req.headers.authorization.replace("Bearer ", "");
  const isTokenToSomeOne = await User.findOne({ token: tokenTotest });
  if (!isTokenToSomeOne) {
    return res.status(400).json({ error: "Missing token" });
  }

  req.body.user = isTokenToSomeOne._id;
  next();
};

module.exports = isAuthenticated;
