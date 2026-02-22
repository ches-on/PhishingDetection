import { useEffect, useState } from "react";
import { getTrends } from "../api/client";

export default function TrendsSummary() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadTrends() {
    setLoading(true);
    setError("");
    try {
      const res = await getTrends(200);
      setData(res);
    } catch (err) {
      setError(err.message || "Failed to load trends.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTrends();
  }, []);

  const topLinkDomains = Array.isArray(data?.top_link_domains)
    ? data.top_link_domains
    : [];

  const topFindingCodes = Array.isArray(data?.top_finding_codes)
    ? data.top_finding_codes
    : [];

  return (
    <div className="card">
      <div className="card-header-row">
        <h2>Scan Trends</h2>
        <button
          type="button"
          className="secondary"
          onClick={loadTrends}
          disabled={loading}
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {error && <div className="error-box small">{error}</div>}

      {loading && <p className="muted">Loading trends...</p>}

      {!loading && !error && !data && (
        <p className="muted">No trends available yet.</p>
      )}

      {data && !loading && (
        <>
          <div className="summary-grid">
            <div className="summary-box">
              <span className="label">Sample Size</span>
              <span className="value">{data.sample_size ?? 0}</span>
            </div>
            <div className="summary-box">
              <span className="label">Average Risk</span>
              <span className="value">{data.average_score ?? 0}</span>
            </div>
          </div>

          <div className="trends-grid">
            <div className="trend-card">
              <h3>Verdict Counts</h3>
              <ul>
                <li>Low: {data.verdict_counts?.low ?? 0}</li>
                <li>Medium: {data.verdict_counts?.medium ?? 0}</li>
                <li>High: {data.verdict_counts?.high ?? 0}</li>
              </ul>
            </div>

            <div className="trend-card">
              <h3>Top Link Domains</h3>
              {topLinkDomains.length ? (
                <ul>
                  {topLinkDomains.map(([domain, count], idx) => (
                    <li key={`${domain}-${idx}`}>
                      <code>{domain}</code> ({count})
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="muted">No domains yet.</p>
              )}
            </div>

            <div className="trend-card">
              <h3>Top Finding Codes</h3>
              {topFindingCodes.length ? (
                <ul>
                  {topFindingCodes.map(([code, count], idx) => (
                    <li key={`${code}-${idx}`}>
                      <code>{code}</code> ({count})
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="muted">No findings yet.</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
