const mongoose = require("mongoose");

const UserTaskSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Types.ObjectId,
    ref: "User",
  },
  taskId: {
    type: mongoose.Types.ObjectId,
    ref: "Task",
  },
  isOwner: {
    type: Boolean,
  },
});

module.exports = mongoose.model("UserTask", UserTaskSchema);
