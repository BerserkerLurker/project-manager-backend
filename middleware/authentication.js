const jwt = require("jsonwebtoken");
const { UnauthenticatedError } = require("../errors");

const auth = async (req, res, next) => {
  const authHeader = req.headers.authorization || req.auth.token;
  if (!authHeader || !authHeader.startsWith("Bearer")) {
    return next(new UnauthenticatedError("Authentication invalid"));
  }
  const token = authHeader.split(" ")[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    // const payload = jwt.decode(token, process.env.JWT_SECRET);
    req.user = { userId: payload.userId, isAdmin: payload.isAdmin };
    // console.log(payload);
    next();
  } catch (error) {
    next(new UnauthenticatedError("Authentication invalid."));
  }
};

module.exports = auth;
