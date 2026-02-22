const API_BASE = "http://127.0.0.1:8000/api";
const ADMIN_API_KEY = "phish-admin-2026-dev-key"; // match your backend .env

export async function analyzeText(rawEmailText) {
  const res = await fetch(`${API_BASE}/analyze/text`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ raw_email_text: rawEmailText }),
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(data?.detail || "Failed to analyze email text.");
  }

  return data;
}

export async function analyzeEml(file) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_BASE}/analyze/eml`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const err = await safeParseJson(res);
    throw new Error(err?.detail || "Failed to analyze .eml file.");
  }

  return res.json();
}

export async function getRecentScans(limit = 20) {
  const res = await fetch(`${API_BASE}/scans/recent?limit=${limit}`, {
    headers: {
      "X-API-Key": ADMIN_API_KEY,
    },
  });

  if (!res.ok) {
    const err = await safeParseJson(res);
    throw new Error(err?.detail || "Failed to fetch recent scans.");
  }

  return res.json();
}

export async function getScanById(scanId) {
  const res = await fetch(`${API_BASE}/scans/${scanId}`, {
    headers: {
      "X-API-Key": ADMIN_API_KEY,
    },
  });

  if (!res.ok) {
    const err = await safeParseJson(res);
    throw new Error(err?.detail || "Failed to fetch scan details.");
  }

  return res.json();
}

export async function getTrends(limit = 200) {
  const res = await fetch(`${API_BASE}/scans/trends?limit=${limit}`, {
    headers: {
      "X-API-Key": ADMIN_API_KEY,
    },
  });

  if (!res.ok) {
    const err = await safeParseJson(res);
    throw new Error(err?.detail || "Failed to fetch scan trends.");
  }

  return res.json();
}

async function safeParseJson(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}