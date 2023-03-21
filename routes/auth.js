const express = require("express");
const router = express.Router();

const {
  register,
  login,
  refresh,
  logout,
  updateUser,
  deleteUser,
  checkEmail,
  verifyEmail,
} = require("../controllers/auth");

router.get("/verify/:userId/:token", verifyEmail);
router.post("/register", register);
router.post("/login", login);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.post("/checkemail", checkEmail);
router.patch("/updateuser", updateUser);
router.delete("/deleteuser", deleteUser);

module.exports = router;
