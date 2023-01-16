const express = require("express");
const router = express.Router();

const {
  register,
  login,
  refresh,
  logout,
  updateUser,
  deleteUser,
} = require("../controllers/auth");

router.post("/register", register);
router.post("/login", login);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.patch("/updateuser", updateUser);
router.delete("/deleteuser", deleteUser);

module.exports = router;
