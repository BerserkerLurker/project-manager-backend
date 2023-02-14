const express = require("express");
const router = express.Router();
const {
  getAllTasks,
  getTask,
  createTask,
  deleteTask,
  updateTask,
  assignUserToTask,
  getTaskAssignees,
  unassignUserFromTask,
} = require("../controllers/tasks");

router.route("/").post(createTask).get(getAllTasks);
router.route("/:id").get(getTask).delete(deleteTask).patch(updateTask);
router
  .route("/assignees/:id")
  .get(getTaskAssignees)
  .post(assignUserToTask)
  .delete(unassignUserFromTask);

module.exports = router;
