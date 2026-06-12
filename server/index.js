const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const Activity = require("./models/Activity");
const BlockedSite = require("./models/BlockedSite");

const app = express();

app.use(cors());
app.use(express.json());

mongoose
  .connect(process.env.Mongo_Db_Url)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log(err));


// Save tracked website activity
app.post("/track", async (req, res) => {
  try {
    const activity = new Activity(req.body);

    await activity.save();

    res.json({
      success: true,
      message: "Activity Saved",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});


// Get productivity report
app.get("/report", async (req, res) => {
  try {
    const data = await Activity.aggregate([
      {
        $group: {
          _id: "$website",
          totalTime: { $sum: "$timeSpent" }
        }
      }
    ]);

    res.json(data);

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
});


// Add blocked site
app.post("/block-site", async (req, res) => {
  try {
    const blockedSite = new BlockedSite(req.body);

    await blockedSite.save();

    res.json({
      success: true,
      message: "Site Blocked",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});


// Get blocked sites
app.get("/blocked-sites", async (req, res) => {
  try {
    const sites = await BlockedSite.find();

    res.json(sites);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});


app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});