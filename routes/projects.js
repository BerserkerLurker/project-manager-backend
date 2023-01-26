const express = require("express");
const router = express.Router();
const {
  getAllProjects,
  getProject,
  createProject,
  deleteProject,
  updateProject,
  getProjectAssignees,
  assignUserToProject,
} = require("../controllers/projects");

router.route("/").post(createProject).get(getAllProjects);
router.route("/:id").get(getProject).delete(deleteProject).patch(updateProject);
router.route("/members/:id").get(getProjectAssignees).post(assignUserToProject);

module.exports = router;
