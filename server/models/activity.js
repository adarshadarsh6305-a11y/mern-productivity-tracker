const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema({
  website: {
    type: String,
    required: true,
  },

  timeSpent: {
    type: Number,
    required: true,
  },

  date: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Activity", activitySchema);