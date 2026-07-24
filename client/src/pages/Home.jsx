import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAppState } from "../state/AppStateContext.jsx";
import { loadCatalog } from "../lib/loadPrograms.js";

export default function Home() {
  const { transcript, selectedProgramId, selectedConcentrationKey } = useAppState();
  const [program, setProgram] = useState(null);

  useEffect(() => {
    if (!selectedProgramId) return;
    loadCatalog().then((c) => setProgram(c.programs.find((p) => p.id === selectedProgramId) || null));
  }, [selectedProgramId]);

  const hasTranscript = transcript?.courses?.length > 0;

  return (
    <div>
      <h2>GMU Degree Progress Checker</h2>
      <p style={{ color: "var(--text-muted)" }}>
        Track what's left for your GMU degree: paste your transcript, pick a program, see what's satisfied
        and what's still missing.
      </p>

      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <strong>1. Transcript</strong>
            <div style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
              {hasTranscript ? `${transcript.courses.length} courses saved` : "Not added yet"}
            </div>
          </div>
          <Link to="/transcript">
            <button className={hasTranscript ? "" : "primary"}>{hasTranscript ? "Edit" : "Add transcript"}</button>
          </Link>
        </div>
      </div>

      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <strong>2. Degree</strong>
            <div style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
              {program ? `${program.name} (${program.degreeType})${selectedConcentrationKey ? ` — ${selectedConcentrationKey}` : ""}` : "Not selected yet"}
            </div>
          </div>
          <Link to="/programs">
            <button className={program ? "" : "primary"}>{program ? "Change" : "Choose degree"}</button>
          </Link>
        </div>
      </div>

      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <strong>3. Progress report</strong>
            <div style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
              {hasTranscript && program ? "Ready to view" : "Complete steps 1 and 2 first"}
            </div>
          </div>
          {hasTranscript && program ? (
            <Link to="/report">
              <button className="primary">View report</button>
            </Link>
          ) : (
            <button className="primary" disabled>
              View report
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
