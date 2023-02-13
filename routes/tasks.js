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
} = require("../controllers/tasks");

router.route("/").post(createTask).get(getAllTasks);
router
  .route("/:id")
  .get(getTask)
  .post(assignUserToTask)
  .delete(deleteTask)
  .patch(updateTask);
router.route("/assignees/:id").get(getTaskAssignees);

module.exports = router;
