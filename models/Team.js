const mongoose = require("mongoose");

const TeamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please provide a name."],
    unique: true,
  },
  members: [
    new mongoose.Schema({
      memberId: { type: mongoose.Types.ObjectId, ref: "User" },
      status: {
        type: String,
        enum: {
          values: ["notMember", "rejected", "pending", "accepted"],
          message:
            "Status should be either notMember, rejected, pending or accepted.",
        },
      },
    }),
  ],
});

module.exports = mongoose.model("Team", TeamSchema);
