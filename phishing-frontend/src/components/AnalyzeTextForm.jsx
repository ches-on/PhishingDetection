import { useState } from "react";

export default function AnalyzeTextForm({ onAnalyze, loading }) {
  const [text, setText] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    if (!text.trim()) return;
    onAnalyze(text);
  }

  return (
    <form onSubmit={handleSubmit} className="card">
      <h2>Paste Email Text</h2>
      <p className="muted">
        Paste full email content or plain suspicious message text.
      </p>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={`Subject: Urgent action required
From: Support <support@example.com>
Reply-To: help@another-domain.com>

Please verify your account immediately: http://192.168.1.10/login`}
        rows={12}
      />

      <div className="actions">
        <button type="submit" disabled={loading || !text.trim()}>
          {loading ? "Analyzing..." : "Analyze Text"}
        </button>
        <button
          type="button"
          className="secondary"
          onClick={() => setText("")}
          disabled={loading}
        >
          Clear
        </button>
      </div>
    </form>
  );
}