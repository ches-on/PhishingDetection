import FindingsList from "./FindingsList";

export default function ResultCard({ result }) {
  if (!result) return null;

  const { risk_score, verdict, findings, extracted } = result;

  return (
    <section className="results-section">
      <div className="card">
        <h2>Analysis Result</h2>

        <div className="summary-grid">
          <div className="summary-box">
            <span className="label">Risk Score</span>
            <span className="value">{risk_score}/100</span>
          </div>

          <div className="summary-box">
            <span className="label">Verdict</span>
            <span className={`value verdict ${verdict}`}>{verdict.toUpperCase()}</span>
          </div>
        </div>

        <div className="extracted">
          <h3>Extracted Details</h3>
          <div className="extracted-grid">
            <div>
              <span className="label">Subject</span>
              <p>{extracted?.subject || "N/A"}</p>
            </div>
            <div>
              <span className="label">From</span>
              <p>{extracted?.from || "N/A"}</p>
            </div>
            <div>
              <span className="label">Reply-To</span>
              <p>{extracted?.reply_to || "N/A"}</p>
            </div>
            <div>
              <span className="label">To</span>
              <p>{extracted?.to || "N/A"}</p>
            </div>
          </div>

          <div className="urls-block">
            <span className="label">URLs</span>
            {extracted?.urls?.length ? (
              <ul>
                {extracted.urls.map((url, i) => (
                  <li key={`${url}-${i}`}>
                    <code>{url}</code>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted">No URLs extracted.</p>
            )}
          </div>
        </div>
      </div>

      <FindingsList findings={findings} />
    </section>
  );
}