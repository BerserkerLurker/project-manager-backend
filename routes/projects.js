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
  unassignUserFromProject,
} = require("../controllers/projects");

router.route("/").post(createProject).get(getAllProjects);
router.route("/:id").get(getProject).delete(deleteProject).patch(updateProject);
router
  .route("/members/:id")
  .get(getProjectAssignees)
  .post(assignUserToProject)
  .delete(unassignUserFromProject);

module.exports = router;
