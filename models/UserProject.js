const mongoose = require("mongoose");

const UserProjectSchema = new mongoose.Schema({
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

module.exports = mongoose.model("UserProject", UserProjectSchema);
