const express = require("express");
const router = express.Router();
const {
  getAllTeams,
  getTeam,
  createTeam,
  deleteTeam,
  updateTeam,
} = require("../controllers/teams");

router.route("/").get(getAllTeams).post(createTeam);
router.route("/:id").get(getTeam).delete(deleteTeam).patch(updateTeam);

module.exports = router;
