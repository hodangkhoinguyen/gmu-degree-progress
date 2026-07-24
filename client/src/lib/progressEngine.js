import { normalizeCode, extractCourseCodes } from "./courseCodes.js";
import { isPassingGrade, gradePoint, isGpaEligible } from "./grades.js";

function indexCompletedCourses(completedCourses) {
  const byCode = new Map();
  for (const course of completedCourses) {
    const code = normalizeCode(course.code);
    const existing = byCode.get(code);
    if (!existing) {
      byCode.set(code, { ...course, code });
      continue;
    }
    const existingPoint = gradePoint(existing.grade) ?? -1;
    const newPoint = gradePoint(course.grade) ?? -1;
    if (newPoint >= existingPoint) byCode.set(code, { ...course, code });
  }
  return byCode;
}

function isSatisfiedCode(code, byCode, minGrade) {
  const rec = byCode.get(normalizeCode(code));
  return !!rec && isPassingGrade(rec.grade, minGrade);
}

function creditsOf(code, byCode, courseCreditLookup) {
  const rec = byCode.get(normalizeCode(code));
  if (rec?.credits != null) return Number(rec.credits) || 0;
  return courseCreditLookup?.(code) ?? 0;
}

function evaluateFlatGroup(group, byCode, courseCreditLookup) {
  const minGrade = group.minGrade || "D";
  const pool = group.courseCodes || [];
  const matched = pool.filter((c) => isSatisfiedCode(c, byCode, minGrade));
  const missingOptions = pool.filter((c) => !matched.includes(c));

  if (group.type === "all-of") {
    return {
      satisfied: matched.length === pool.length && pool.length > 0,
      matched,
      missingOptions,
      progressLabel: `${matched.length}/${pool.length} courses`,
    };
  }

  if (group.type === "choose-n-credits") {
    const earned = matched.reduce((sum, c) => sum + creditsOf(c, byCode, courseCreditLookup), 0);
    return {
      satisfied: earned >= group.minCredits,
      matched,
      missingOptions,
      creditsEarned: earned,
      creditsRequired: group.minCredits,
      progressLabel: `${earned}/${group.minCredits} credits`,
    };
  }

  // default: choose-n-courses
  const minCourses = group.minCourses ?? pool.length;
  return {
    satisfied: matched.length >= minCourses,
    matched,
    missingOptions,
    progressLabel: `${matched.length}/${minCourses} courses`,
  };
}

function evaluateAreaGroup(group, byCode, courseCreditLookup) {
  const minGrade = group.minGrade || "D";
  const requiredMatched = (group.requiredCourseCodes || []).filter((c) =>
    isSatisfiedCode(c, byCode, minGrade)
  );
  const requiredMissing = (group.requiredCourseCodes || []).filter(
    (c) => !requiredMatched.includes(c)
  );

  const areaResults = (group.areas || []).map((area) => {
    const matched = area.courseCodes.filter((c) => isSatisfiedCode(c, byCode, minGrade));
    return {
      name: area.name,
      satisfied: matched.length > 0,
      matched,
      options: area.courseCodes.filter((c) => !matched.includes(c)),
    };
  });

  const satisfiedAreaCount = areaResults.filter((a) => a.satisfied).length;
  const minAreas = group.minAreas ?? areaResults.length;
  const requiredOk = requiredMissing.length === 0;
  const areasOk = satisfiedAreaCount >= minAreas;

  // Optional combined "N courses / N credits across the matched areas" rule
  // (e.g. MS CS advanced electives: 4 courses / 12 credits spanning >=2 areas).
  const allAreaMatched = [...new Set(areaResults.flatMap((a) => a.matched))];
  const areaCoursesOk = group.minCourses == null || allAreaMatched.length >= group.minCourses;
  const areaCreditsEarned = allAreaMatched.reduce(
    (sum, c) => sum + creditsOf(c, byCode, courseCreditLookup),
    0
  );
  const areaCreditsOk = group.minCredits == null || areaCreditsEarned >= group.minCredits;

  return {
    satisfied: requiredOk && areasOk && areaCoursesOk && areaCreditsOk,
    matched: requiredMatched,
    missingOptions: requiredMissing,
    areas: areaResults,
    ...(group.minCourses != null && { areaCoursesMatched: allAreaMatched.length }),
    ...(group.minCredits != null && { areaCreditsEarned }),
    progressLabel: [
      group.requiredCourseCodes?.length ? `${requiredMatched.length}/${group.requiredCourseCodes.length} required` : null,
      `${satisfiedAreaCount}/${minAreas} areas`,
      group.minCourses != null ? `${allAreaMatched.length}/${group.minCourses} courses` : null,
    ]
      .filter(Boolean)
      .join(", "),
  };
}

function evaluateGroup(group, byCode, courseCreditLookup) {
  const base =
    group.type === "area-constrained"
      ? evaluateAreaGroup(group, byCode, courseCreditLookup)
      : evaluateFlatGroup(group, byCode, courseCreditLookup);
  return { key: group.key, label: group.label, type: group.type, ...base };
}

/** Flags missing required courses whose prerequisites (parsed from catalog text)
 * also aren't completed yet, so the user sees the real next step. Best-effort:
 * courses without parseable prerequisite text are simply skipped, not guessed at. */
function attachPrereqFlags(groups, byCode, courseByCode) {
  for (const group of groups) {
    const codes = [...(group.missingOptions || [])];
    group.blockedByPrereq = {};
    for (const code of codes) {
      const course = courseByCode?.get(normalizeCode(code));
      const prereqCodes = extractCourseCodes(course?.prerequisitesRaw);
      const unmet = prereqCodes.filter((p) => !isSatisfiedCode(p, byCode, "D"));
      if (unmet.length > 0) group.blockedByPrereq[code] = unmet;
    }
  }
}

export function evaluateProgress(program, concentrationKey, completedCourses, courseCatalog = []) {
  const byCode = indexCompletedCourses(completedCourses);
  const courseByCode = new Map(courseCatalog.map((c) => [normalizeCode(c.code), c]));
  const courseCreditLookup = (code) => courseByCode.get(normalizeCode(code))?.credits ?? 0;

  const programGroups = (program.requirementGroups || []).map((g) =>
    evaluateGroup(g, byCode, courseCreditLookup)
  );

  const concentration = concentrationKey
    ? program.concentrations?.find((c) => c.key === concentrationKey)
    : null;
  const concentrationGroups = (concentration?.requirementGroups || []).map((g) =>
    evaluateGroup(g, byCode, courseCreditLookup)
  );

  attachPrereqFlags(programGroups, byCode, courseByCode);
  attachPrereqFlags(concentrationGroups, byCode, courseByCode);

  const allGroups = [...programGroups, ...concentrationGroups];
  const overallSatisfied = allGroups.every((g) => g.satisfied);

  // Credits earned toward the program: sum credits for every completed course
  // that appears anywhere in the program's or concentration's course pools.
  const programCourseCodes = new Set(
    collectAllCourseCodes(program).concat(collectAllCourseCodes(concentration))
  );
  let creditsEarned = 0;
  for (const code of programCourseCodes) {
    const rec = byCode.get(normalizeCode(code));
    if (rec && isPassingGrade(rec.grade)) creditsEarned += creditsOf(code, byCode, courseCreditLookup);
  }

  const gpa = computeGpa(completedCourses, programCourseCodes);

  return {
    programId: program.id,
    programName: program.name,
    concentrationKey: concentration?.key || null,
    concentrationName: concentration?.name || null,
    overallSatisfied,
    creditsEarned,
    creditsRequired: program.totalCredits ?? null,
    programGroups,
    concentrationGroups,
    gpa,
  };
}

function collectAllCourseCodes(entity) {
  if (!entity) return [];
  const codes = [];
  for (const group of entity.requirementGroups || []) {
    codes.push(...(group.courseCodes || []));
    codes.push(...(group.requiredCourseCodes || []));
    for (const area of group.areas || []) codes.push(...area.courseCodes);
  }
  return codes;
}

function computeGpa(completedCourses, majorCourseCodeSet) {
  let overallPoints = 0;
  let overallCredits = 0;
  let majorPoints = 0;
  let majorCredits = 0;

  for (const course of completedCourses) {
    if (!isGpaEligible(course.grade)) continue;
    const pts = gradePoint(course.grade);
    const credits = Number(course.credits) || 0;
    overallPoints += pts * credits;
    overallCredits += credits;
    if (majorCourseCodeSet.has(normalizeCode(course.code))) {
      majorPoints += pts * credits;
      majorCredits += credits;
    }
  }

  return {
    overall: overallCredits > 0 ? round2(overallPoints / overallCredits) : null,
    major: majorCredits > 0 ? round2(majorPoints / majorCredits) : null,
    overallCredits,
    majorCredits,
  };
}

function round2(n) {
  return Math.round(n * 100) / 100;
}
