const { StatusCodes } = require("http-status-codes");

const register = (req, res) => {
  console.log(req.body);
  res.status(StatusCodes.CREATED).send("register");
};

const login = (req, res) => {
  console.log(req.body);
  res.status(StatusCodes.OK).send("login");
};

const updateUser = (req, res) => {
  console.log(req.body);
  res.status(StatusCodes.OK).send("updateUser");
};

module.exports = { register, login, updateUser };
