const express = require("express");
const router = express.Router();
const {
  getAllTeams,
  getTeam,
  createTeam,
  deleteTeam,
  updateTeam,
  addTeamMember,
  removeTeamMember,
  updateTeamMember,
} = require("../controllers/teams");

router.route("/").get(getAllTeams).post(createTeam);
router.route("/:id").get(getTeam).delete(deleteTeam).patch(updateTeam);
router
  .route("/members/:id")
  .post(addTeamMember)
  .patch(updateTeamMember)
  .delete(removeTeamMember);

module.exports = router;
