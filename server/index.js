const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const Activity = require("./models/activity");
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
const { website, timeSpent, date } = req.body;


if (typeof website !== "string" || !website.trim()) {
  return res.status(400).json({
    success: false,
    message: "A valid website is required.",
  });
}

if (
  typeof timeSpent !== "number" ||
  !Number.isInteger(timeSpent) ||
  timeSpent <= 0 ||
  timeSpent > 86400
) {
  return res.status(400).json({
    success: false,
    message: "timeSpent must be a positive integer no greater than 86400.",
  });
}

if (
  date !== undefined &&
  (typeof date !== "string" || Number.isNaN(Date.parse(date)))
) {
  return res.status(400).json({
    success: false,
    message: "date must be a valid date string.",
  });
}

const activity = new Activity({
  website: website.trim(),
  timeSpent,
  ...(date !== undefined && { date: new Date(date) }),
});

await activity.save();

return res.status(201).json({
  success: true,
  message: "Activity saved successfully.",
  activity,
});


} catch (error) {
console.error("Error saving activity:", error);


return res.status(500).json({
  success: false,
  message: "Unable to save activity.",
});


}
});


// Get productivity report
// Get website activity for a selected date range
app.get("/report", async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const matchStage = {};

    if (startDate || endDate) {
      matchStage.date = {};

      if (startDate) {
        const start = new Date(startDate);

        if (Number.isNaN(start.getTime())) {
          return res.status(400).json({
            message: "Invalid startDate",
          });
        }

        matchStage.date.$gte = start;
      }

      if (endDate) {
        const end = new Date(endDate);

        if (Number.isNaN(end.getTime())) {
          return res.status(400).json({
            message: "Invalid endDate",
          });
        }

        matchStage.date.$lte = end;
      }
    }

    const pipeline = [];

    if (Object.keys(matchStage).length > 0) {
      pipeline.push({ $match: matchStage });
    }

    pipeline.push(
      {
        $group: {
          _id: "$website",
          totalTime: {
            $sum: "$timeSpent",
          },
        },
      },
      {
        $sort: {
          totalTime: -1,
        },
      }
    );

    const data = await Activity.aggregate(pipeline);

    return res.json(data);
  } catch (error) {
    console.error("Error generating report:", error);

    return res.status(500).json({
      message: "Unable to generate activity report.",
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
