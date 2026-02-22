export default function FindingsList({ findings }) {
  if (!findings || findings.length === 0) {
    return (
      <div className="card">
        <h3>Findings</h3>
        <p className="muted">No strong phishing indicators were detected.</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h3>Findings</h3>
      <ul className="findings-list">
        {findings.map((f, idx) => (
          <li key={`${f.code}-${idx}`} className={`finding ${f.severity}`}>
            <div className="finding-header">
              <span className="badge">{f.severity}</span>
              <strong>{f.title}</strong>
            </div>
            <p className="finding-code">{f.code}</p>
            <p>{f.detail}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}