const { StatusCodes } = require("http-status-codes");
const { User } = require("../models");
const validateEmail = require("../utils/validate");

const register = async (req, res) => {
  const user = await User.create({ ...req.body });
  const token = user.createJWT();
  res.status(StatusCodes.CREATED).json({ user: { name: user.name }, token });
};

const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new Error("Please provide email and password.");
  }
  const user = await User.findOne({ email });

  if (!user) {
    throw new Error("Invalid Credentials.");
  }
  const isPasswordCorrect = await user.comparePassword(password);

  if (!isPasswordCorrect) {
    throw new Error("Invalid Credentials.");
  }

  const token = user.createJWT();

  res
    .status(StatusCodes.OK)
    .json({ user: { email: user.email, name: user.name }, token });
};

const updateUser = async (req, res) => {
  const { email, name } = req.body;
  if (!validateEmail(email) || !name.trim()) {
    throw new Error("Invalid values.");
  }

  const user = await User.findOne({ _id: req.user.userId });
  user.email = email;
  user.name = name;
  await user.save();

  const token = user.createJWT();
  console.log(user);
  res
    .status(StatusCodes.OK)
    .send({ user: { email: user.email, name: user.name }, token });
};

module.exports = { register, login, updateUser };
