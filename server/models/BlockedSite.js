const mongoose = require("mongoose");

const blockedSiteSchema = new mongoose.Schema({
  website: {
    type: String,
    required: true,
    unique: true,
  },
});

module.exports = mongoose.model(
  "BlockedSite",
  blockedSiteSchema
);