const mongoose = require("mongoose");

const TeamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please provide a name."],
    unique: true,
  },
});

module.exports = mongoose.model("Team", TeamSchema);
