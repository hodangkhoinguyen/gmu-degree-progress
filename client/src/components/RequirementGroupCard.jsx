import CourseChip from "./CourseChip.jsx";

function AreaBreakdown({ areas, courseByCode }) {
  return (
    <div style={{ marginTop: "0.5rem" }}>
      {areas.map((area) => (
        <div key={area.name} style={{ marginBottom: "0.4rem" }}>
          <div style={{ fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <span
              aria-hidden="true"
              style={{
                width: "0.7rem",
                height: "0.7rem",
                borderRadius: "3px",
                display: "inline-block",
                background: area.satisfied ? "var(--success)" : "transparent",
                border: `1px solid ${area.satisfied ? "var(--success)" : "var(--border)"}`,
              }}
            />
            <strong>{area.name}</strong>
          </div>
          <div>
            {area.matched.map((c) => (
              <CourseChip key={c} code={c} status="done" courseByCode={courseByCode} />
            ))}
            {area.inProgress.map((c) => (
              <CourseChip key={c} code={c} status="in-progress" courseByCode={courseByCode} />
            ))}
            {!area.satisfied &&
              area.options.slice(0, 12).map((c) => <CourseChip key={c} code={c} status="todo" courseByCode={courseByCode} />)}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function RequirementGroupCard({ group, courseByCode }) {
  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "0.5rem" }}>
        <strong>{group.label}</strong>
        <span className={`badge ${group.satisfied ? "success" : "neutral"}`}>
          {group.satisfied ? "Satisfied" : group.progressLabel}
        </span>
      </div>

      {group.type === "area-constrained" ? (
        <AreaBreakdown areas={group.areas} courseByCode={courseByCode} />
      ) : (
        <div style={{ marginTop: "0.5rem" }}>
          {group.matched.map((c) => (
            <CourseChip key={c} code={c} status="done" courseByCode={courseByCode} />
          ))}
          {group.inProgress.map((c) => (
            <CourseChip key={c} code={c} status="in-progress" courseByCode={courseByCode} />
          ))}
          {!group.satisfied &&
            group.missingOptions.map((c) => (
              <CourseChip
                key={c}
                code={c}
                status="todo"
                courseByCode={courseByCode}
                blockedBy={group.blockedByPrereq?.[c]}
              />
            ))}
        </div>
      )}
    </div>
  );
}
