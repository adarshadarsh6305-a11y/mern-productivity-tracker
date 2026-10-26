import { useEffect, useState } from "react";
import axios from "axios";
import "./Dashboard.css";

const API_BASE_URL = "http://localhost:5000";

const PRODUCTIVE_SITES = [
  "leetcode.com",
  "github.com",
  "stackoverflow.com",
];

function normalizeDomain(domain) {
  return String(domain || "")
    .trim()
    .toLowerCase()
    .replace(/^www\./, "");
}

function formatTime(totalSeconds) {
  const seconds = Math.max(0, Math.floor(totalSeconds || 0));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${remainingSeconds}s`;
  return `${remainingSeconds}s`;
}

function getLocalDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getDateRange(period, selectedDate) {
  const selected = new Date(`${selectedDate}T12:00:00`);
  let start;
  let end;

  if (period === "daily") {
    start = new Date(selected);
    end = new Date(selected);
  } else if (period === "weekly") {
    start = new Date(selected);
    const dayOfWeek = (start.getDay() + 6) % 7;
    start.setDate(start.getDate() - dayOfWeek);

    end = new Date(start);
    end.setDate(end.getDate() + 6);
  } else {
    end = new Date(selected);
    start = new Date(selected);
    start.setDate(start.getDate() - 27);
  }

  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  return {
    startDate: start.toISOString(),
    endDate: end.toISOString(),
  };
}

function Dashboard() {
  const [report, setReport] = useState([]);
  const [blockedSites, setBlockedSites] = useState([]);
  const [newSite, setNewSite] = useState("");

  const [period, setPeriod] = useState("daily");
  const [selectedDate, setSelectedDate] = useState(
    getLocalDateString(new Date())
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchBlockedSites();
  }, []);

  useEffect(() => {
    fetchReport();
  }, [period, selectedDate]);

  async function fetchReport() {
    setLoading(true);
    setError("");

    try {
      const { startDate, endDate } = getDateRange(
        period,
        selectedDate
      );

      const response = await axios.get(`${API_BASE_URL}/report`, {
        params: { startDate, endDate },
      });

      setReport(
        Array.isArray(response.data) ? response.data : []
      );
    } catch (err) {
      console.error("Failed to load report:", err);
      setError("Unable to load activity. Check the backend.");
    } finally {
      setLoading(false);
    }
  }

  async function fetchBlockedSites() {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/blocked-sites`
      );

      setBlockedSites(
        Array.isArray(response.data) ? response.data : []
      );
    } catch (err) {
      console.error("Failed to load blocked sites:", err);
    }
  }

  async function addBlockedSite(event) {
    event.preventDefault();

    const website = normalizeDomain(newSite);

    if (!website) {
      setMessage("Please enter a website domain.");
      return;
    }

    if (
      blockedSites.some(
        (site) => normalizeDomain(site.website) === website
      )
    ) {
      setMessage("This website is already in the blocklist.");
      return;
    }

    try {
      await axios.post(`${API_BASE_URL}/block-site`, {
        website,
      });

      setNewSite("");
      setMessage("Website added to the blocklist.");
      await fetchBlockedSites();
    } catch (err) {
      console.error("Failed to add blocked website:", err);
      setMessage("Unable to add website.");
    }
  }

  const totalTime = report.reduce(
    (sum, site) => sum + (Number(site.totalTime) || 0),
    0
  );

  const productiveTime = report
    .filter((site) =>
      PRODUCTIVE_SITES.includes(normalizeDomain(site._id))
    )
    .reduce(
      (sum, site) => sum + (Number(site.totalTime) || 0),
      0
    );

  const otherTime = Math.max(0, totalTime - productiveTime);

  const productivityScore =
    totalTime > 0
      ? Math.round((productiveTime / totalTime) * 100)
      : 0;

  function changePeriod(nextPeriod) {
    setPeriod(nextPeriod);
  }

  function changeDate(offset) {
    const date = new Date(`${selectedDate}T12:00:00`);

    if (period === "daily") {
      date.setDate(date.getDate() + offset);
    } else if (period === "weekly") {
      date.setDate(date.getDate() + offset * 7);
    } else {
      date.setDate(date.getDate() + offset * 28);
    }

    setSelectedDate(getLocalDateString(date));
  }

  const today = getLocalDateString(new Date());

  return (
    <main className="dashboard">
      <h1>FocusFlow</h1>

      <p className="dashboard-subtitle">
        Understand your browsing habits and make time for what matters.
      </p>

      <section className="dashboard-section">
        <h2>Activity Overview</h2>

        <div className="period-controls">
          <button
            className={period === "daily" ? "active-period" : ""}
            onClick={() => changePeriod("daily")}
          >
            Daily
          </button>

          <button
            className={period === "weekly" ? "active-period" : ""}
            onClick={() => changePeriod("weekly")}
          >
            Weekly
          </button>

          <button
            className={period === "history" ? "active-period" : ""}
            onClick={() => changePeriod("history")}
          >
            28-Day History
          </button>
        </div>

        <div className="date-controls">
          <button onClick={() => changeDate(-1)}>
            ← Previous
          </button>

          <label>
            Select date:{" "}
            <input
              type="date"
              value={selectedDate}
              max={today}
              onChange={(event) =>
                setSelectedDate(event.target.value)
              }
            />
          </label>

          <button
            onClick={() => changeDate(1)}
            disabled={
              period === "daily"
                ? selectedDate >= today
                : false
            }
          >
            Next →
          </button>
        </div>

        <p className="status-message">
          {period === "daily" && "Showing one day's activity."}
          {period === "weekly" && "Showing Monday through Sunday."}
          {period === "history" && "Showing a rolling 28-day period."}
        </p>
      </section>

      {loading && (
        <p className="status-message">Loading activity...</p>
      )}

      {error && (
        <p className="status-message error-message">{error}</p>
      )}

      {!loading && !error && (
        <>
          <section className="stats-grid">
            <article className="stats-card">
              <h2>Total Active Time</h2>
              <p>{formatTime(totalTime)}</p>
            </article>

            <article className="stats-card">
              <h2>Productive Time</h2>
              <p>{formatTime(productiveTime)}</p>
            </article>

            <article className="stats-card">
              <h2>Other Time</h2>
              <p>{formatTime(otherTime)}</p>
            </article>

            <article className="stats-card">
              <h2>Productivity Score</h2>
              <p>{totalTime > 0 ? `${productivityScore}%` : "—"}</p>

              <div
                className="productivity-bar"
                role="progressbar"
                aria-label="Productivity score"
                aria-valuemin="0"
                aria-valuemax="100"
                aria-valuenow={productivityScore}
              >
                <div
                  className="productivity-bar-fill"
                  style={{ width: `${productivityScore}%` }}
                />
              </div>
            </article>
          </section>

          <section className="dashboard-section report-section">
            <h2>Website Activity</h2>

            {report.length === 0 ? (
              <p className="status-message">
                No activity recorded for this period.
              </p>
            ) : (
              [...report]
                .sort(
                  (a, b) =>
                    (Number(b.totalTime) || 0) -
                    (Number(a.totalTime) || 0)
                )
                .map((site) => (
                  <div className="site-card" key={site._id}>
                    <span className="site-name">{site._id}</span>
                    <span className="site-time">
                      {formatTime(site.totalTime)}
                    </span>
                  </div>
                ))
            )}
          </section>

          <section className="dashboard-section">
            <h2>Blocked Websites</h2>

            <form
              className="blocked-site-form"
              onSubmit={addBlockedSite}
            >
              <input
                type="text"
                placeholder="Example: youtube.com"
                value={newSite}
                onChange={(event) =>
                  setNewSite(event.target.value)
                }
                aria-label="Website to block"
              />

              <button type="submit">Add Website</button>
            </form>

            {message && (
              <p className="status-message">{message}</p>
            )}

            {blockedSites.length === 0 ? (
              <p className="status-message">
                No blocked websites configured.
              </p>
            ) : (
              blockedSites.map((site) => (
                <div className="blocked-site-item" key={site._id}>
                  🚫 {site.website}
                </div>
              ))
            )}
          </section>

          <button
            type="button"
            onClick={fetchReport}
            disabled={loading}
          >
            Refresh Report
          </button>
        </>
      )}
    </main>
  );
}

export default Dashboard;
