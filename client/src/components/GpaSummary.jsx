export default function GpaSummary({ gpa }) {
  return (
    <div className="card" style={{ display: "flex", gap: "2rem" }}>
      <div>
        <div style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Overall GPA</div>
        <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>{gpa.overall ?? "—"}</div>
        <div style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>{gpa.overallCredits} GPA credits</div>
      </div>
      <div>
        <div style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Major GPA</div>
        <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>{gpa.major ?? "—"}</div>
        <div style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>{gpa.majorCredits} GPA credits</div>
      </div>
    </div>
  );
}
