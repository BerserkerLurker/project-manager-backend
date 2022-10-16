const User = require("../models/User");
const jwt = require("jsonwebtoken");

const auth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer")) {
    throw new Error("Authentication invalid.");
  }
  const token = authHeader.split(" ")[1];

  try {
    const payload = jwt.decode(token, process.env.JWT_SECRET);
    req.user = { userId: payload.userId };
    console.log(payload);
    next();
  } catch (error) {
    throw new Error("Authentication invalid.");
  }
};

module.exports = auth;
