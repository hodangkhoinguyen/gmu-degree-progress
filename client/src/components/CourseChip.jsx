export default function CourseChip({ code, done, courseByCode, blockedBy }) {
  const course = courseByCode.get(code);
  return (
    <span className="course-chip-wrap" tabIndex={0}>
      <span className={`course-chip ${done ? "done" : "todo"}`}>
        {code}
        {blockedBy?.length > 0 && <span title={`Prerequisite not yet completed: ${blockedBy.join(", ")}`}> ⚠</span>}
      </span>
      <span className="course-chip-tooltip" role="tooltip">
        <span className="code">{code}</span>
        {course?.title || "No title on file — check the catalog"}
        {course?.credits != null && (
          <div className="credits">
            {course.credits} credit{course.credits === 1 ? "" : "s"}
          </div>
        )}
      </span>
    </span>
  );
}
