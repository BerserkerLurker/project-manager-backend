const mongoose = require("mongoose");

const UserProjectSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Types.ObjectId,
    ref: "User",
  },
  projectId: {
    type: mongoose.Types.ObjectId,
    ref: "Project",
  },
  isOwner: {
    type: Boolean,
  },
});

module.exports = mongoose.model("UserProject", UserProjectSchema);
