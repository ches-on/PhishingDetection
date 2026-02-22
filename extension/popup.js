const API_BASE = "http://127.0.0.1:8000/api";

// Tabs
const modeTextBtn = document.getElementById("modeTextBtn");
const modeEmlBtn = document.getElementById("modeEmlBtn");
const textPanel = document.getElementById("textPanel");
const emlPanel = document.getElementById("emlPanel");

// Text inputs
const emailTextEl = document.getElementById("emailText");
const analyzeBtn = document.getElementById("analyzeBtn");
const clearBtn = document.getElementById("clearBtn");

// EML inputs
const emlFileEl = document.getElementById("emlFile");
const fileInfoEl = document.getElementById("fileInfo");
const analyzeEmlBtn = document.getElementById("analyzeEmlBtn");
const resetFileBtn = document.getElementById("resetFileBtn");

// Shared UI
const errorBox = document.getElementById("errorBox");
const loadingBox = document.getElementById("loadingBox");
const resultCard = document.getElementById("resultCard");

const riskScoreEl = document.getElementById("riskScore");
const verdictEl = document.getElementById("verdict");

const subjectVal = document.getElementById("subjectVal");
const fromVal = document.getElementById("fromVal");
const replyToVal = document.getElementById("replyToVal");
const toVal = document.getElementById("toVal");

const urlList = document.getElementById("urlList");
const noUrls = document.getElementById("noUrls");

const findingsList = document.getElementById("findingsList");
const noFindings = document.getElementById("noFindings");

// --- Mode switching ---
modeTextBtn.addEventListener("click", () => setMode("text"));
modeEmlBtn.addEventListener("click", () => setMode("eml"));

function setMode(mode) {
  const isText = mode === "text";

  textPanel.classList.toggle("d-none", !isText);
  emlPanel.classList.toggle("d-none", isText);

  setModeButtonState(modeTextBtn, isText);
  setModeButtonState(modeEmlBtn, !isText);

  hideError();
}

function setModeButtonState(button, isActive) {
  button.classList.toggle("active", isActive);
  button.classList.toggle("btn-primary", isActive);
  button.classList.toggle("btn-outline-primary", !isActive);
}

// Default mode
setMode("text");

// --- Other events ---
analyzeBtn.addEventListener("click", handleAnalyzeText);
clearBtn.addEventListener("click", handleClearText);

emlFileEl.addEventListener("change", handleFileChange);
analyzeEmlBtn.addEventListener("click", handleAnalyzeEml);
resetFileBtn.addEventListener("click", handleResetFile);

async function handleAnalyzeText() {
  const text = emailTextEl.value.trim();

  hideError();
  hideResult();

  if (!text) {
    showError("Please paste email text first.");
    return;
  }

  setLoading(true);

  try {
    const res = await fetch(`${API_BASE}/analyze/text`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ raw_email_text: text })
    });

    const data = await safeParseJson(res);

    if (!res.ok) {
      throw new Error(data?.detail || "Failed to analyze email text.");
    }

    renderResult(data);
  } catch (err) {
    showError(err.message || "Something went wrong.");
  } finally {
    setLoading(false);
  }
}

async function handleAnalyzeEml() {
  hideError();
  hideResult();

  const file = emlFileEl.files && emlFileEl.files[0];
  if (!file) {
    showError("Please choose an .eml file first.");
    return;
  }

  if (!String(file.name || "").toLowerCase().endsWith(".eml")) {
    showError("Please select a valid .eml file.");
    return;
  }

  setLoading(true);

  try {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`${API_BASE}/analyze/eml`, {
      method: "POST",
      body: formData
    });

    const data = await safeParseJson(res);

    if (!res.ok) {
      throw new Error(data?.detail || "Failed to analyze .eml file.");
    }

    renderResult(data);
  } catch (err) {
    showError(err.message || "Something went wrong.");
  } finally {
    setLoading(false);
  }
}

function handleClearText() {
  emailTextEl.value = "";
  hideError();
  hideResult();
}

function handleFileChange() {
  const file = emlFileEl.files && emlFileEl.files[0];

  if (!file) {
    fileInfoEl.textContent = "";
    fileInfoEl.classList.add("d-none");
    return;
  }

  const sizeKb = Math.max(1, Math.ceil(file.size / 1024));
  fileInfoEl.textContent = `Selected: ${file.name} (${sizeKb} KB)`;
  fileInfoEl.classList.remove("d-none");
}

function handleResetFile() {
  emlFileEl.value = "";
  fileInfoEl.textContent = "";
  fileInfoEl.classList.add("d-none");
  hideError();
  hideResult();
}

function renderResult(data) {
  const riskScore = data?.risk_score ?? 0;
  const verdict = String(data?.verdict || "low").toLowerCase();
  const extracted = data?.extracted || {};
  const findings = Array.isArray(data?.findings) ? data.findings : [];
  const urls = Array.isArray(extracted.urls) ? extracted.urls : [];

  riskScoreEl.textContent = `${riskScore}/100`;
  verdictEl.textContent = verdict.toUpperCase();
  setVerdictBadgeStyle(verdict);

  subjectVal.textContent = extracted.subject || "N/A";
  fromVal.textContent = extracted.from || "N/A";
  replyToVal.textContent = extracted.reply_to || "N/A";
  toVal.textContent = extracted.to || "N/A";

  urlList.innerHTML = "";
  if (urls.length > 0) {
    noUrls.classList.add("d-none");
    urls.forEach((url) => {
      const li = document.createElement("li");
      li.className = "list-group-item small text-wrap-break";
      li.textContent = url;
      urlList.appendChild(li);
    });
  } else {
    noUrls.classList.remove("d-none");
  }

  findingsList.innerHTML = "";
  if (findings.length > 0) {
    noFindings.classList.add("d-none");
    findings.forEach((f) => {
      const li = document.createElement("li");
      li.className = `finding-item ${f.severity || "low"}`;

      const title = document.createElement("div");
      title.className = "finding-title";
      title.textContent = `${f.title || "Finding"} (${String(f.severity || "low").toUpperCase()})`;

      const code = document.createElement("div");
      code.className = "finding-code";
      code.textContent = f.code || "";

      const detail = document.createElement("div");
      detail.className = "finding-detail";
      detail.textContent = f.detail || "";

      li.appendChild(title);
      li.appendChild(code);
      li.appendChild(detail);
      findingsList.appendChild(li);
    });
  } else {
    noFindings.classList.remove("d-none");
  }

  resultCard.classList.remove("d-none");
}

function setVerdictBadgeStyle(verdict) {
  verdictEl.className = "badge verdict-badge";

  if (verdict === "high") {
    verdictEl.classList.add("bg-danger-subtle", "text-danger-emphasis");
  } else if (verdict === "medium") {
    verdictEl.classList.add("bg-warning-subtle", "text-warning-emphasis");
  } else {
    verdictEl.classList.add("bg-success-subtle", "text-success-emphasis");
  }
}

function setLoading(isLoading) {
  loadingBox.classList.toggle("d-none", !isLoading);

  modeTextBtn.disabled = isLoading;
  modeEmlBtn.disabled = isLoading;

  analyzeBtn.disabled = isLoading;
  clearBtn.disabled = isLoading;

  analyzeEmlBtn.disabled = isLoading;
  resetFileBtn.disabled = isLoading;
  emlFileEl.disabled = isLoading;
}

function showError(message) {
  errorBox.textContent = message;
  errorBox.classList.remove("d-none");
}

function hideError() {
  errorBox.textContent = "";
  errorBox.classList.add("d-none");
}

function hideResult() {
  resultCard.classList.add("d-none");
}

async function safeParseJson(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}