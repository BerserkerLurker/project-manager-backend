const mongoose = require("mongoose");

const TaskSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please provide a name."],
      unique: false,
    },
    description: {
      type: String,
    },
    isDone: {
      type: Boolean,
      default: false,
    },
    started: {
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
    priority: {
      type: String,
      enum: {
        values: ["low", "medium", "high"],
        message: "Priority should be either low, medium or high.",
      },
    },
    dueDate: {
      type: Date,
    },
    projectId: {
      type: mongoose.Types.ObjectId,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);
// Virtual populate
TaskSchema.virtual("userTasks", {
  ref: "UserTask",
  foreignField: "taskId",
  localField: "_id",
});
module.exports = mongoose.model("Task", TaskSchema);
