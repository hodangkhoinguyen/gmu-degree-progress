import { describe, it, expect, beforeAll } from "vitest";
import { evaluateProgress } from "../progressEngine.js";
import { findProgram } from "./fixtures.js";

// Integration tests against the real, hand-verified MS Computer Science
// requirement data (see importer/src/seed/csPrograms.js). These exist to
// catch two kinds of regression: bugs in progressEngine's matching logic,
// and accidental data-entry mistakes in the CS MS seed itself (wrong course
// code, wrong area, wrong minGrade, etc).
describe("CS MS progress evaluation", () => {
  let csMs;

  beforeAll(() => {
    csMs = findProgram({ name: "Computer Science", degreeType: "MS" });
  });

  it("is hand-verified and not flagged for review", () => {
    expect(csMs.handVerified).toBe(true);
    expect(csMs.needsReview).toBe(false);
    expect(csMs.totalCredits).toBe(30);
    expect(csMs.concentrations.map((c) => c.key).sort()).toEqual(["cysc", "ml"]);
  });

  it("with no completed courses, nothing is satisfied and 0 credits are earned", () => {
    const report = evaluateProgress(csMs, null, []);
    expect(report.creditsEarned).toBe(0);
    expect(report.overallSatisfied).toBe(false);
    expect(report.programGroups.every((g) => !g.satisfied)).toBe(true);
  });

  it("foundation courses require CS 530 + CS 531 at B- or better", () => {
    const report = evaluateProgress(csMs, null, [
      { code: "CS 530", grade: "B-", credits: 3 },
      { code: "CS 531", grade: "C+", credits: 3 }, // below the B- floor
    ]);
    const foundation = report.programGroups.find((g) => g.key === "foundation-courses");
    expect(foundation.satisfied).toBe(false);
    expect(foundation.matched).toEqual(["CS 530"]);
    expect(foundation.missingOptions).toEqual(["CS 531"]);
  });

  it("a course with no grade yet (currently in progress) is tracked separately, not as done or missing", () => {
    const report = evaluateProgress(csMs, null, [
      { code: "CS 530", grade: "A", credits: 3 },
      { code: "CS 531", grade: "", credits: 3 }, // enrolled this term, no grade posted yet
    ]);
    const foundation = report.programGroups.find((g) => g.key === "foundation-courses");
    expect(foundation.satisfied).toBe(false); // not done until it has a real grade
    expect(foundation.matched).toEqual(["CS 530"]);
    expect(foundation.inProgress).toEqual(["CS 531"]);
    expect(foundation.missingOptions).toEqual([]); // not "missing" either — it's in progress
    // in-progress credits shouldn't count as earned yet
    expect(report.creditsEarned).toBe(3);
  });

  it("core-by-area needs CS 583 plus 2 different other areas, not just 2 courses", () => {
    const oneArea = evaluateProgress(csMs, null, [
      { code: "CS 583", grade: "A", credits: 3 },
      { code: "CS 550", grade: "B+", credits: 3 },
      { code: "CS 584", grade: "B+", credits: 3 }, // same area (AI & Databases) as CS 550
    ]);
    expect(oneArea.programGroups.find((g) => g.key === "core-by-area").satisfied).toBe(false);

    const twoAreas = evaluateProgress(csMs, null, [
      { code: "CS 583", grade: "A", credits: 3 },
      { code: "CS 550", grade: "B+", credits: 3 }, // AI & Databases
      { code: "CS 555", grade: "A-", credits: 3 }, // Systems and Networks
    ]);
    expect(twoAreas.programGroups.find((g) => g.key === "core-by-area").satisfied).toBe(true);
  });

  it("core-by-area is not satisfied without CS 583, even with 2+ areas covered", () => {
    const report = evaluateProgress(csMs, null, [
      { code: "CS 550", grade: "A", credits: 3 },
      { code: "CS 555", grade: "A", credits: 3 },
    ]);
    const core = report.programGroups.find((g) => g.key === "core-by-area");
    expect(core.satisfied).toBe(false);
    expect(core.missingOptions).toEqual(["CS 583"]);
  });

  it("advanced electives need 4 courses AND at least 2 different areas", () => {
    const fourCoursesOneArea = evaluateProgress(csMs, null, [
      { code: "CS 650", grade: "A", credits: 3 },
      { code: "CS 657", grade: "A", credits: 3 },
      { code: "CS 661", grade: "A", credits: 3 },
      { code: "CS 678", grade: "A", credits: 3 }, // all 4 are Artificial Intelligence and Databases
    ]);
    expect(fourCoursesOneArea.programGroups.find((g) => g.key === "advanced-electives").satisfied).toBe(false);

    const spanningTwoAreas = evaluateProgress(csMs, null, [
      { code: "CS 650", grade: "A", credits: 3 },
      { code: "CS 657", grade: "A", credits: 3 },
      { code: "CS 661", grade: "A", credits: 3 },
      { code: "CS 600", grade: "A", credits: 3 }, // Theoretical Computer Science
    ]);
    expect(spanningTwoAreas.programGroups.find((g) => g.key === "advanced-electives").satisfied).toBe(true);
  });

  it("only counts credits for courses that are actually part of the program's pools", () => {
    const report = evaluateProgress(csMs, null, [
      { code: "CS 530", grade: "A", credits: 3 },
      { code: "CS 531", grade: "A", credits: 3 },
      { code: "PHIL 100", grade: "A", credits: 3 }, // unrelated course
    ]);
    expect(report.creditsEarned).toBe(6);
  });

  it("Machine Learning concentration: required + electives + related", () => {
    const report = evaluateProgress(csMs, "ml", [
      { code: "CS 584", grade: "A", credits: 3 },
      { code: "CS 688", grade: "A", credits: 3 }, // ml-required
      { code: "CS 657", grade: "A", credits: 3 },
      { code: "CS 661", grade: "A", credits: 3 }, // 2 ml electives
    ]);
    expect(report.concentrationName).toBe("Machine Learning");
    expect(report.concentrationGroups.find((g) => g.key === "ml-required").satisfied).toBe(true);
    expect(report.concentrationGroups.find((g) => g.key === "ml-electives").satisfied).toBe(true);
    expect(report.concentrationGroups.find((g) => g.key === "ml-related").satisfied).toBe(true); // min 0, trivial
  });

  it("Cyber Security concentration requirements aren't satisfied by ML coursework", () => {
    const report = evaluateProgress(csMs, "cysc", [
      { code: "CS 584", grade: "A", credits: 3 },
      { code: "CS 688", grade: "A", credits: 3 },
    ]);
    const required = report.concentrationGroups.find((g) => g.key === "cysc-required");
    expect(required.satisfied).toBe(false);
    expect(required.missingOptions.sort()).toEqual(["ISA 562", "ISA 656"]);
  });

  it("GPA counts only GPA-eligible grades, and major GPA only counts in-pool courses", () => {
    const report = evaluateProgress(csMs, null, [
      { code: "CS 530", grade: "A", credits: 3 }, // 4.0, in the MS CS pool
      { code: "CS 800", grade: "S", credits: 0 }, // satisfactory/non-GPA grade, excluded
      { code: "PHIL 100", grade: "B", credits: 3 }, // 3.0, not in the MS CS pool
    ]);
    expect(report.gpa.overallCredits).toBe(6);
    expect(report.gpa.overall).toBeCloseTo((4.0 * 3 + 3.0 * 3) / 6, 2);
    expect(report.gpa.majorCredits).toBe(3);
    expect(report.gpa.major).toBe(4.0);
  });

  it("a course load satisfying every group marks the whole program satisfied", () => {
    const report = evaluateProgress(csMs, "ml", [
      { code: "CS 530", grade: "B-", credits: 3 },
      { code: "CS 531", grade: "B-", credits: 3 },
      { code: "CS 583", grade: "A", credits: 3 },
      { code: "CS 550", grade: "A", credits: 3 }, // core area 1
      { code: "CS 555", grade: "A", credits: 3 }, // core area 2
      { code: "CS 650", grade: "A", credits: 3 }, // advanced: AI & Databases
      { code: "CS 600", grade: "A", credits: 3 }, // advanced: Theoretical CS
      { code: "CS 584", grade: "A", credits: 3 }, // ml-required + constrained elective
      { code: "CS 688", grade: "A", credits: 3 }, // advanced (AI&DB) + ml-required
      { code: "CS 657", grade: "A", credits: 3 }, // advanced (AI&DB) + ml-elective 1
      { code: "CS 661", grade: "A", credits: 3 }, // advanced (AI&DB) + ml-elective 2
    ]);
    expect(report.overallSatisfied).toBe(true);
  });
});
