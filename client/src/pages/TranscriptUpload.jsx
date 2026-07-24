import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppState } from "../state/AppStateContext.jsx";
import { parseTranscriptText } from "../lib/transcriptParser.js";
import { extractPdfText } from "../lib/pdfText.js";
import CourseTable from "../components/CourseTable.jsx";

export default function TranscriptUpload() {
  const { transcript, setTranscript } = useAppState();
  const [rawText, setRawText] = useState(transcript?.rawText || "");
  const [courses, setCourses] = useState(transcript?.courses || []);
  const [warnings, setWarnings] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  function parseAndReview(text) {
    const { courses: parsed, warnings: w } = parseTranscriptText(text);
    setCourses(parsed);
    setWarnings(w);
  }

  function handleParsePaste() {
    if (!rawText.trim()) return;
    parseAndReview(rawText);
  }

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setBusy(true);
    try {
      const text = await extractPdfText(file);
      setRawText(text);
      parseAndReview(text);
    } catch (err) {
      setError(`Couldn't read that PDF: ${err.message}`);
    } finally {
      setBusy(false);
    }
  }

  function handleSave() {
    setTranscript({ uploadedAt: new Date().toISOString(), rawText, courses });
    navigate("/programs");
  }

  return (
    <div>
      <h2>Your transcript</h2>
      <p style={{ color: "var(--text-muted)" }}>
        Paste the text of your unofficial transcript from Patriot Web, or upload it as a PDF. Nothing is
        sent anywhere — parsing happens in your browser and is saved only to this browser's local storage.
      </p>

      <div className="card">
        <textarea
          rows={10}
          style={{ width: "100%" }}
          placeholder="Paste your unofficial transcript text here..."
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
        />
        <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.75rem", alignItems: "center" }}>
          <button className="primary" onClick={handleParsePaste} disabled={!rawText.trim()}>
            Parse pasted text
          </button>
          <span style={{ color: "var(--text-muted)" }}>or</span>
          <input type="file" accept="application/pdf" onChange={handleFile} disabled={busy} />
        </div>
        {busy && <p>Reading PDF…</p>}
        {error && <p style={{ color: "var(--danger)" }}>{error}</p>}
      </div>

      {warnings.length > 0 && (
        <div className="disclaimer">
          {warnings.map((w, i) => (
            <p key={i}>{w}</p>
          ))}
        </div>
      )}

      {courses.length > 0 && (
        <div className="card">
          <h3>Review parsed courses</h3>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
            Fix anything that parsed wrong, remove rows that don't belong, or add missing courses by hand.
          </p>
          <CourseTable courses={courses} onChange={setCourses} />
          <button className="primary" style={{ marginTop: "1rem" }} onClick={handleSave}>
            Save & choose a degree →
          </button>
        </div>
      )}

      {courses.length === 0 && transcript?.courses?.length > 0 && (
        <div className="card">
          <p>You already have a saved transcript with {transcript.courses.length} courses.</p>
          <button onClick={() => { setRawText(transcript.rawText || ""); setCourses(transcript.courses); }}>
            Edit saved transcript
          </button>
        </div>
      )}
    </div>
  );
}
