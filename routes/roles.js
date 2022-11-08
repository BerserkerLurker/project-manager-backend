const express = require("express");
const router = express.Router();
const {
  getAllRoles,
  getRole,
  createRole,
  deleteRole,
  updateRole,
} = require("../controllers/roles");

router.route("/").get(getAllRoles).post(createRole);
router.route("/:id").get(getRole).delete(deleteRole).patch(updateRole);

module.exports = router;
