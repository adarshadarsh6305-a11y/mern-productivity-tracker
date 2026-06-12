import { useEffect, useState } from "react";
import axios from "axios";
import "./Dashboard.css";

function Dashboard() {
  const [report, setReport] = useState([]);
 const [blockedSites, setBlockedSites] = useState([]);
const [newSite, setNewSite] = useState("");
  useEffect(() => {
    fetchReport();
    fetchBlockedSites();
  }, []);

  const fetchReport = async () => {
    try {
      const res = await axios.get(
        "http://localhost:5000/report"
      );

      setReport(res.data);

    } catch (err) {
      console.log(err);
    }
  };


  const fetchBlockedSites = async () => {
  try {
    const res = await axios.get(
      "http://localhost:5000/blocked-sites"
    );

    setBlockedSites(res.data);

  } catch (err) {
    console.log(err);
  }
};

const addBlockedSite = async () => {
  if (!newSite.trim()) return;

  try {
    await axios.post(
      "http://localhost:5000/block-site",
      {
        website: newSite
      }
    );

    setNewSite("");

    fetchBlockedSites();

  } catch (err) {
    console.log(err);
  }
};

  const totalTime = report.reduce(
    (sum, site) => sum + site.totalTime,
    0
  );

  const productiveSites = [
  "leetcode.com",
  "github.com",
  "stackoverflow.com"
];

const productiveTime = report
  .filter(site =>
    productiveSites.includes(site._id)
  )
  .reduce(
    (sum, site) => sum + site.totalTime,
    0
  );

const productivityScore =
  totalTime === 0
    ? 0
    : Math.round(
        (productiveTime / totalTime) * 100
      );

  return (
    <div className="dashboard">

      <h1>🚀 Productivity Tracker</h1>

      <div className="stats-card">
        <h2>Total Time Tracked</h2>
        <p>{totalTime} sec</p>
      </div>

      <div className="stats-card">
  <h2>Productivity Score</h2>

  <p>{productivityScore}%</p>
</div>

<div className="stats-card">
  <h2>Blocked Websites</h2>

  <input
    type="text"
    placeholder="Enter website"
    value={newSite}
    onChange={(e) =>
      setNewSite(e.target.value)
    }
  />

  <button
    onClick={addBlockedSite}
  >
    Add
  </button>

  {blockedSites.map((site) => (
    <p key={site._id}>
      🚫 {site.website}
    </p>
  ))}
</div>

      <div className="report-section">
        <h2>Website Activity</h2>

        {report.map((site) => (
          <div
            className="site-card"
            key={site._id}
          >
            <span>{site._id}</span>

            <span>
              {site.totalTime} sec
            </span>
          </div>
        ))}
      </div>

    </div>
  );
}

export default Dashboard;