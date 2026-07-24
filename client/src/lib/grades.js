const GRADE_POINTS = {
  "A+": 4.0, A: 4.0, "A-": 3.67,
  "B+": 3.33, B: 3.0, "B-": 2.67,
  "C+": 2.33, C: 2.0, "C-": 1.67,
  D: 1.0, F: 0.0,
};

const NON_PASSING = new Set(["F", "W", "WF", "IP", "I", "NR", "AU", "U"]);

export function isInProgress(grade) {
  if (!grade) return true;
  return grade.trim().toUpperCase() === "IP";
}

export function isPassingGrade(grade, minGrade = "D") {
  if (isInProgress(grade)) return false; // not done yet — tracked separately as in-progress
  const g = grade.trim().toUpperCase();
  if (NON_PASSING.has(g)) return false;
  if (g === "S" || g === "P") return true; // satisfactory/pass, no GPA value
  if (!(g in GRADE_POINTS)) return true; // unrecognized grade code, don't block on it
  return GRADE_POINTS[g] >= (GRADE_POINTS[minGrade.toUpperCase()] ?? 1.0);
}

export function gradePoint(grade) {
  if (!grade) return null;
  const g = grade.trim().toUpperCase();
  return g in GRADE_POINTS ? GRADE_POINTS[g] : null;
}

export function isGpaEligible(grade) {
  return gradePoint(grade) !== null;
}
