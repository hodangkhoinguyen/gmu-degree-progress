import { describe, it, expect } from "vitest";
import { isPassingGrade, gradePoint, isGpaEligible } from "../grades.js";

describe("isPassingGrade", () => {
  it("compares against the default D floor", () => {
    expect(isPassingGrade("C")).toBe(true);
    expect(isPassingGrade("F")).toBe(false);
    expect(isPassingGrade("W")).toBe(false);
  });

  it("enforces a stricter minGrade when given (e.g. graduate core courses)", () => {
    expect(isPassingGrade("B-", "B-")).toBe(true);
    expect(isPassingGrade("C+", "B-")).toBe(false);
  });

  it("treats a blank grade as taken (in-progress courses)", () => {
    expect(isPassingGrade("")).toBe(true);
    expect(isPassingGrade(undefined)).toBe(true);
  });

  it("treats S/P (satisfactory/pass) as passing regardless of minGrade", () => {
    expect(isPassingGrade("S", "B-")).toBe(true);
    expect(isPassingGrade("P")).toBe(true);
  });
});

describe("gradePoint / isGpaEligible", () => {
  it("maps standard letter grades to 4.0-scale points", () => {
    expect(gradePoint("A")).toBe(4.0);
    expect(gradePoint("A-")).toBe(3.67);
    expect(gradePoint("B+")).toBe(3.33);
    expect(gradePoint("F")).toBe(0.0);
  });

  it("excludes non-GPA grades like S/U/W from GPA eligibility", () => {
    expect(isGpaEligible("S")).toBe(false);
    expect(isGpaEligible("W")).toBe(false);
    expect(isGpaEligible("A")).toBe(true);
  });
});
