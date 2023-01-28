const { StatusCodes } = require("http-status-codes");
const { BadRequestError, UnauthenticatedError } = require("../errors");
const { User } = require("../models");
const validateEmail = require("../utils/validate");
const jwt = require("jsonwebtoken");

const register = async (req, res) => {
  const user = await User.create({ ...req.body });
  const accessToken = user.createJWT();
  const refreshToken = user.createRefreshToken();

  res
    .status(StatusCodes.CREATED)
    .cookie("jwt", refreshToken, {
      httpOnly: true,
      sameSite: "None",
      secure: true,
      signed: true,
      maxAge: 30 * 24 * 60 * 60 * 1000,
    })
    .json({
      user: {
        userId: user._id,
        email: user.email,
        name: user.name,
        isAdmin: user.isAdmin,
        role: user.role,
        team: user.team,
      },
      accessToken,
    });
};

const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new BadRequestError("Please provide email and password.");
  }
  const user = await User.findOne({ email });

  if (!user) {
    throw new UnauthenticatedError("Invalid Credentials.");
  }
  const isPasswordCorrect = await user.comparePassword(password);

  if (!isPasswordCorrect) {
    throw new UnauthenticatedError("Invalid Credentials.");
  }

  const accessToken = user.createJWT();
  const refreshToken = user.createRefreshToken();

  res
    .status(StatusCodes.OK)
    .cookie("jwt", refreshToken, {
      httpOnly: true,
      sameSite: "None",
      secure: true,
      signed: true,
      maxAge: 30 * 24 * 60 * 60 * 1000,
    })
    .json({
      user: {
        userId: user._id,
        email: user.email,
        name: user.name,
        isAdmin: user.isAdmin,
        role: user.role,
        team: user.team,
      },
      accessToken,
    });
};

const refresh = async (req, res) => {
  if (req.signedCookies?.jwt) {
    const refreshToken = req.signedCookies.jwt;
    try {
      const payload = jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET
      );
      const user = await User.findOne({ _id: payload.userId });
      const accessToken = user.createJWT();

      res.status(StatusCodes.OK).json({ accessToken });
    } catch (error) {
      throw new UnauthenticatedError("Bad Refresh Token.");
    }
  } else {
    throw new UnauthenticatedError("No Refresh Token Was Provided.");
  }
};

const logout = async (req, res) => {
  res
    .status(StatusCodes.OK)
    .clearCookie("jwt", {
      httpOnly: true,
      sameSite: "None",
      secure: true,
      signed: true,
    })
    .send("Logged out");
};

const updateUser = async (req, res) => {
  const { email, name, password, role, team } = req.body;
  if (!validateEmail(email) || !name.trim() || !password.trim()) {
    throw new BadRequestError("Invalid values.");
  }

  const user = await User.findOne({ _id: req.user.userId });
  user.email = email;
  user.name = name;
  user.password = password;
  user.role = role;
  user.team = team;
  await user.save();

  const accessToken = user.createJWT();
  res.status(StatusCodes.OK).send({
    user: {
      userId: user._id,
      email: user.email,
      name: user.name,
      isAdmin: user.isAdmin,
      role: user.role,
      team: user.team,
    },
    accessToken,
  });
};

const deleteUser = async (req, res) => {
  const { userId, isAdmin } = req.user;
  console.log(userId, isAdmin);

  const deletedUser = User.findByIdAndRemove(userId);
  res.status(StatusCodes.OK).send("Delete user");
};

const checkEmail = async (req, res) => {
  const { userId } = req.user;
  const { email } = req.body;

  if (!validateEmail(email)) {
    throw new BadRequestError("Invalid email.");
  }

  const user = await User.findOne({ email });
  console.log(user);

  if (!user) {
    return res.status(StatusCodes.OK).json({ email: email, exists: false });
  } else {
    return res.status(StatusCodes.OK).json({ email: email, exists: true });
  }
};

module.exports = {
  register,
  login,
  refresh,
  logout,
  updateUser,
  deleteUser,
  checkEmail,
};
