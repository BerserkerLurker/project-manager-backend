const mongoose = require("mongoose");

const UserTaskSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Types.ObjectId,
  },
  taskId: {
    type: mongoose.Types.ObjectId,
  },
  isOwner: {
    type: Boolean,
  },
});

module.exports = mongoose.model("UserTask", UserTaskSchema);
