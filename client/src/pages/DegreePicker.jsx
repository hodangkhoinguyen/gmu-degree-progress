import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppState } from "../state/AppStateContext.jsx";
import { loadCatalog } from "../lib/loadPrograms.js";
import CourseChip from "../components/CourseChip.jsx";

const LEVELS = ["Bachelor's", "Master's", "Doctoral", "Certificate", "Minor"];

export default function DegreePicker() {
  const { selectedProgramId, setSelectedProgramId, selectedConcentrationKey, setSelectedConcentrationKey } =
    useAppState();
  const [catalog, setCatalog] = useState(null);
  const [level, setLevel] = useState("Master's");
  const [query, setQuery] = useState("");
  const [compareMode, setCompareMode] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadCatalog().then(setCatalog);
  }, []);

  const programs = useMemo(() => {
    if (!catalog) return [];
    let list = catalog.programs.filter((p) => p.level === level);
    if (query.trim()) {
      const needle = query.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(needle) ||
          p.department?.toLowerCase().includes(needle) ||
          p.college?.toLowerCase().includes(needle)
      );
    }
    return list.sort((a, b) => a.name.localeCompare(b.name));
  }, [catalog, level, query]);

  const selectedProgram = catalog?.programs.find((p) => p.id === selectedProgramId) || null;
  const courseByCode = useMemo(() => {
    const map = new Map();
    for (const c of catalog?.courses || []) map.set(c.code, c);
    return map;
  }, [catalog]);

  function pickProgram(id) {
    setSelectedProgramId(id);
    setCompareMode(false);
  }

  function goToReport() {
    navigate("/report");
  }

  return (
    <div>
      <h2>Choose a degree</h2>

      <div className="card">
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.75rem" }}>
          {LEVELS.map((l) => (
            <button key={l} className={l === level ? "primary" : ""} onClick={() => setLevel(l)}>
              {l}
            </button>
          ))}
        </div>
        <input
          placeholder="Search by program, department, or college..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ width: "100%" }}
        />
      </div>

      {!catalog && <p>Loading catalog…</p>}

      {catalog && (
        <div className="card" style={{ maxHeight: "22rem", overflowY: "auto" }}>
          {programs.length === 0 && <p style={{ color: "var(--text-muted)" }}>No programs match.</p>}
          {programs.map((p) => (
            <div
              key={p.id}
              onClick={() => pickProgram(p.id)}
              style={{
                padding: "0.5rem 0.25rem",
                borderBottom: "1px solid var(--border)",
                cursor: "pointer",
                background: p.id === selectedProgramId ? "var(--accent-bg, rgba(31,111,235,0.08))" : "transparent",
              }}
            >
              <strong>{p.name}</strong> <span style={{ color: "var(--text-muted)" }}>({p.degreeType})</span>
              {p.needsReview && <span className="badge warning" style={{ marginLeft: "0.5rem" }}>verify</span>}
              <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>{p.department || p.college}</div>
            </div>
          ))}
        </div>
      )}

      {selectedProgram && (
        <div className="card">
          <h3>
            {selectedProgram.name} ({selectedProgram.degreeType})
          </h3>
          {selectedProgram.totalCredits && <p>{selectedProgram.totalCredits} total credits</p>}

          {selectedProgram.concentrations?.length > 0 && (
            <>
              <p style={{ fontWeight: 600 }}>This program has {selectedProgram.concentrations.length} concentrations:</p>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.75rem" }}>
                <button
                  className={!selectedConcentrationKey && !compareMode ? "primary" : ""}
                  onClick={() => {
                    setSelectedConcentrationKey(null);
                    setCompareMode(false);
                  }}
                >
                  No concentration
                </button>
                {selectedProgram.concentrations.map((c) => (
                  <button
                    key={c.key}
                    className={selectedConcentrationKey === c.key ? "primary" : ""}
                    onClick={() => {
                      setSelectedConcentrationKey(c.key);
                      setCompareMode(false);
                    }}
                  >
                    {c.name}
                  </button>
                ))}
                <button onClick={() => setCompareMode((v) => !v)}>{compareMode ? "Hide comparison" : "Compare all"}</button>
              </div>

              {compareMode && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  {selectedProgram.concentrations.map((c) => (
                    <div key={c.key} className="card">
                      <strong>{c.name}</strong>
                      {c.requirementGroups.map((g) => (
                        <div key={g.key} style={{ marginTop: "0.5rem" }}>
                          <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>{g.label}</div>
                          <div>
                            {g.courseCodes.map((code) => (
                              <CourseChip key={code} code={code} done={false} courseByCode={courseByCode} />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          <button className="primary" style={{ marginTop: "1rem" }} onClick={goToReport}>
            View progress report →
          </button>
        </div>
      )}
    </div>
  );
}
