const mongoose = require("mongoose");

module.exports = function connectDB(uri) {
  mongoose.set('strictQuery', false);
  return mongoose.connect(uri);
};
