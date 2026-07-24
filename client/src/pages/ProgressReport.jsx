import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAppState } from "../state/AppStateContext.jsx";
import { loadCatalog } from "../lib/loadPrograms.js";
import { evaluateProgress } from "../lib/progressEngine.js";
import RequirementGroupCard from "../components/RequirementGroupCard.jsx";
import GpaSummary from "../components/GpaSummary.jsx";
import Disclaimer from "../components/Disclaimer.jsx";

export default function ProgressReport() {
  const { transcript, selectedProgramId, selectedConcentrationKey } = useAppState();
  const [catalog, setCatalog] = useState(null);

  useEffect(() => {
    loadCatalog().then(setCatalog);
  }, []);

  const program = catalog?.programs.find((p) => p.id === selectedProgramId) || null;
  const courseByCode = useMemo(() => {
    const map = new Map();
    for (const c of catalog?.courses || []) map.set(c.code, c);
    return map;
  }, [catalog]);

  const report = useMemo(() => {
    if (!program || !transcript) return null;
    return evaluateProgress(program, selectedConcentrationKey, transcript.courses, catalog?.courses || []);
  }, [program, selectedConcentrationKey, transcript, catalog]);

  if (!transcript || transcript.courses.length === 0) {
    return (
      <div className="card">
        <p>Add your transcript first.</p>
        <Link to="/transcript">
          <button className="primary">Go to Transcript</button>
        </Link>
      </div>
    );
  }

  if (!selectedProgramId) {
    return (
      <div className="card">
        <p>Pick a degree first.</p>
        <Link to="/programs">
          <button className="primary">Choose a degree</button>
        </Link>
      </div>
    );
  }

  if (!catalog || !report) return <p>Loading…</p>;

  const pct = report.creditsRequired ? Math.min(100, Math.round((report.creditsEarned / report.creditsRequired) * 100)) : null;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <h2>
          {report.programName}
          {report.concentrationName ? ` — ${report.concentrationName}` : ""}
        </h2>
        <button className="no-print" onClick={() => window.print()}>
          Print / Export
        </button>
      </div>

      <Disclaimer sourceUrl={program.sourceUrl} />

      {program.notes?.length > 0 && (
        <div className="card">
          <strong>Notes from the catalog</strong>
          <ul>
            {program.notes.map((n, i) => (
              <li key={i} style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>
                {n}
              </li>
            ))}
          </ul>
        </div>
      )}

      {report.creditsRequired && (
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
            <strong>Credits toward degree</strong>
            <span>
              {report.creditsEarned} / {report.creditsRequired}
            </span>
          </div>
          <div className="progress-bar">
            <div style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}

      <GpaSummary gpa={report.gpa} />

      <h3>Program requirements</h3>
      {report.programGroups.map((g) => (
        <RequirementGroupCard key={g.key} group={g} courseByCode={courseByCode} />
      ))}

      {report.concentrationGroups.length > 0 && (
        <>
          <h3>{report.concentrationName} requirements</h3>
          {report.concentrationGroups.map((g) => (
            <RequirementGroupCard key={g.key} group={g} courseByCode={courseByCode} />
          ))}
        </>
      )}

      <p style={{ color: report.overallSatisfied ? "var(--success)" : "var(--text-muted)", fontWeight: 600 }}>
        {report.overallSatisfied ? "All tracked requirements satisfied 🎉" : "Requirements remaining — see ⬜ items above."}
      </p>
    </div>
  );
}
