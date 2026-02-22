// import { useState } from 'react'
// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
// import './App.css'

// function App() {
//   const [count, setCount] = useState(0)

//   return (
//     <>
//       <div>
//         <a href="https://vite.dev" target="_blank">
//           <img src={viteLogo} className="logo" alt="Vite logo" />
//         </a>
//         <a href="https://react.dev" target="_blank">
//           <img src={reactLogo} className="logo react" alt="React logo" />
//         </a>
//       </div>
//       <h1>Vite + React</h1>
//       <div className="card">
//         <button onClick={() => setCount((count) => count + 1)}>
//           count is {count}
//         </button>
//         <p>
//           Edit <code>src/App.jsx</code> and save to test HMR
//         </p>
//       </div>
//       <p className="read-the-docs">
//         Click on the Vite and React logos to learn more
//       </p>
//     </>
//   )
// }

// export default App

import { useState } from "react";
import { analyzeText, analyzeEml } from "./api/client";
import AnalyzeTextForm from "./components/AnalyzeTextForm";
import AnalyzeEmlForm from "./components/AnalyzeEmlForm";
import ResultCard from "./components/ResultCard";
import RecentScans from "./components/RecentScans";
import { getScanById } from "./api/client";
import TrendsSummary from "./components/TrendsSummary";

export default function App() {
  const [result, setResult] = useState(null);
  const [loadingText, setLoadingText] = useState(false);
  const [loadingFile, setLoadingFile] = useState(false);
  const [error, setError] = useState("");
  const [selectedScanId, setSelectedScanId] = useState(null);
  const [loadingScan, setLoadingScan] = useState(false);
  

  async function handleAnalyzeText(text) {
    setError("");
    setLoadingText(true);
    try {
      const data = await analyzeText(text);
      setResult(data);
      setSelectedScanId(null);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoadingText(false);
    }
  }

  async function handleAnalyzeEml(file) {
    setError("");
    setLoadingFile(true);
    try {
      const data = await analyzeEml(file);
      setResult(data);
      setSelectedScanId(null);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoadingFile(false);
    }
  }
  async function handleSelectScan(scanId) {
    setError("");
    setLoadingScan(true);
    try {
      const data = await getScanById(scanId);
      setResult({
        risk_score: data.risk_score,
        verdict: data.verdict,
        findings: data.findings || [],
        extracted: data.extracted || {},
      });
      setSelectedScanId(scanId);
    } catch (err) {
      setError(err.message || "Failed to load saved scan.");
    } finally {
      setLoadingScan(false);
    }
  }

  return (
  <div className="app-shell">
    <header className="page-header">
      <h1>Phishing Detector</h1>
      <p className="muted">
        Analyze suspicious email text or .eml files and review phishing risk findings.
      </p>
    </header>

    <main className="layout">
      <section className="forms-column">
        <AnalyzeTextForm onAnalyze={handleAnalyzeText} loading={loadingText} />
        <AnalyzeEmlForm onAnalyze={handleAnalyzeEml} loading={loadingFile} />
        <RecentScans onSelectScan={handleSelectScan} selectedScanId={selectedScanId} />
        <TrendsSummary />
      </section>

      <section className="results-column">
        {error && <div className="error-box">{error}</div>}

        {loadingScan && (
          <div className="card">
            <p className="muted">Loading saved scan...</p>
          </div>
        )}

        <ResultCard result={result} />

        {!result && !error && !loadingScan && (
          <div className="card">
            <h2>No result yet</h2>
            <p className="muted">
              Submit pasted email text or upload an .eml file to see the analysis.
            </p>
          </div>
        )}
      </section>
    </main>
  </div>
);
}