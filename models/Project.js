const mongoose = require("mongoose");

const ProjectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please provide a name."],
      unique: true,
    },
    description: {
      type: String,
    },
    isDone: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: {
        values: ["onTrack", "atRisk", "offTrack"],
        message: "Status should be either onTrack, atRisk or offTrack.",
      },
    },
    dueDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Project", ProjectSchema);
