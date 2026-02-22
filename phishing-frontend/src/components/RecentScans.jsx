import { useEffect, useState } from "react";
import { getRecentScans } from "../api/client";

export default function RecentScans({ onSelectScan, selectedScanId }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadScans() {
    setLoading(true);
    setError("");
    try {
      const data = await getRecentScans(20);
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to load recent scans.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadScans();
  }, []);

  return (
    <div className="card">
      <div className="card-header-row">
        <h2>Recent Scans</h2>
        <button
          type="button"
          className="secondary"
          onClick={loadScans}
          disabled={loading}
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {error && <div className="error-box small">{error}</div>}

      {!loading && items.length === 0 && !error && (
        <p className="muted">No scans yet. Analyze an email to populate history.</p>
      )}

      {items.length > 0 && (
        <div className="recent-scans-list">
          {items.map((scan) => (
            <button
                key={scan.id}
                type="button"
                className={`recent-scan-item ${scan.verdict} ${selectedScanId === scan.id ? "active" : ""}`}
                onClick={() => onSelectScan?.(scan.id)}
            >
                <div className="recent-scan-top">
                <span className={`mini-badge ${scan.verdict}`}>
                    {String(scan.verdict || "").toUpperCase()}
                </span>
                <strong>{scan.risk_score}/100</strong>
                </div>

                <p className="recent-subject">
                {scan.subject?.trim() || "(No subject)"}
                </p>

                <p className="recent-meta">
                <span>{scan.from || "Unknown sender"}</span>
                </p>

                <p className="recent-time">
                {formatDate(scan.created_at)}
                </p>
            </button>
            
          ))}
        </div>
      )}
    </div>
  );
}

function formatDate(value) {
  if (!value) return "Unknown time";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString();
}