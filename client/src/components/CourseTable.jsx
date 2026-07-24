import { isValidCourseCodeFormat, normalizeCode } from "../lib/courseCodes.js";

const EMPTY_ROW = { code: "", title: "", grade: "", credits: "", term: "" };

function codeWarning(code, courseByCode) {
  if (!code.trim()) return null;
  if (!isValidCourseCodeFormat(code)) {
    return `Doesn't look like a course code — expected something like "CS 310"`;
  }
  if (courseByCode && courseByCode.size > 0 && !courseByCode.has(normalizeCode(code))) {
    return `Not found in the GMU catalog — double check it, or it may just be missing from our data`;
  }
  return null;
}

export default function CourseTable({ courses, onChange, courseByCode }) {
  function updateRow(index, field, value) {
    const next = courses.map((row, i) => (i === index ? { ...row, [field]: value } : row));
    onChange(next);
  }

  function removeRow(index) {
    onChange(courses.filter((_, i) => i !== index));
  }

  function addRow() {
    onChange([...courses, { ...EMPTY_ROW }]);
  }

  return (
    <div>
      <div style={{ overflowX: "auto" }}>
        <table>
          <thead>
            <tr>
              <th>Code</th>
              <th>Title</th>
              <th>Grade</th>
              <th>Credits</th>
              <th>Term</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {courses.map((row, i) => {
              const warning = codeWarning(row.code, courseByCode);
              return (
                <tr key={i}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                      <input
                        value={row.code}
                        onChange={(e) => updateRow(i, "code", e.target.value)}
                        style={{ width: "6.5rem", borderColor: warning ? "var(--danger)" : undefined }}
                      />
                      {warning && <span title={warning}>⚠</span>}
                    </div>
                  </td>
                  <td>
                    <input value={row.title || ""} onChange={(e) => updateRow(i, "title", e.target.value)} style={{ width: "100%" }} />
                  </td>
                  <td>
                    <input value={row.grade || ""} onChange={(e) => updateRow(i, "grade", e.target.value)} style={{ width: "3.5rem" }} />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={row.credits ?? ""}
                      onChange={(e) => updateRow(i, "credits", e.target.value === "" ? "" : Number(e.target.value))}
                      style={{ width: "4.5rem" }}
                    />
                  </td>
                  <td>
                    <input value={row.term || ""} onChange={(e) => updateRow(i, "term", e.target.value)} style={{ width: "7rem" }} />
                  </td>
                  <td>
                    <button onClick={() => removeRow(i)} aria-label="Remove row">
                      ✕
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <button onClick={addRow} style={{ marginTop: "0.75rem" }}>
        + Add course
      </button>
    </div>
  );
}
