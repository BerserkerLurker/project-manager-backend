const express = require("express");
const router = express.Router();
const {
  getAllTeams,
  getTeam,
  createTeam,
  deleteTeam,
  updateTeam,
  addTeamMember,
} = require("../controllers/teams");

router.route("/").get(getAllTeams).post(createTeam);
router.route("/:id").get(getTeam).delete(deleteTeam).patch(updateTeam);
router.route("/addmember/:id").post(addTeamMember);

module.exports = router;
