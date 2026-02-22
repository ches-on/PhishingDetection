import { useState } from "react";

export default function AnalyzeEmlForm({ onAnalyze, loading }) {
  const [file, setFile] = useState(null);

  function handleSubmit(e) {
    e.preventDefault();
    if (!file) return;
    onAnalyze(file);
  }

  return (
    <form onSubmit={handleSubmit} className="card">
      <h2>Upload .eml File</h2>
      <p className="muted">
        Upload a saved email file for parsing and phishing risk analysis.
      </p>

      <input
        type="file"
        accept=".eml,message/rfc822"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />

      {file && (
        <p className="file-info">
          Selected: <strong>{file.name}</strong> ({Math.ceil(file.size / 1024)} KB)
        </p>
      )}

      <div className="actions">
        <button type="submit" disabled={loading || !file}>
          {loading ? "Analyzing..." : "Analyze .eml"}
        </button>
        <button
          type="button"
          className="secondary"
          onClick={() => setFile(null)}
          disabled={loading}
        >
          Reset
        </button>
      </div>
    </form>
  );
}