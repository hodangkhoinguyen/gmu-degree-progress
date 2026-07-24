import { describe, it, expect } from "vitest";
import { normalizeCode, extractCourseCodes, isValidCourseCodeFormat } from "../courseCodes.js";

describe("normalizeCode", () => {
  it("uppercases and collapses whitespace", () => {
    expect(normalizeCode("cs  530")).toBe("CS 530");
    expect(normalizeCode(" Swe 619 ")).toBe("SWE 619");
  });
});

describe("extractCourseCodes", () => {
  it("finds every course-code-shaped token in free text", () => {
    expect(extractCourseCodes("Requires CS 310 and CS-211 before enrolling in CS330.")).toEqual([
      "CS 310",
      "CS 211",
      "CS 330",
    ]);
  });

  it("dedupes repeated codes and returns [] for text with none", () => {
    expect(extractCourseCodes("CS 310, then CS 310 again")).toEqual(["CS 310"]);
    expect(extractCourseCodes("no course codes here")).toEqual([]);
    expect(extractCourseCodes(null)).toEqual([]);
  });
});

describe("isValidCourseCodeFormat", () => {
  it("accepts subject + 3-digit number, loosely spaced/cased", () => {
    expect(isValidCourseCodeFormat("CS 310")).toBe(true);
    expect(isValidCourseCodeFormat("cs   310")).toBe(true);
    expect(isValidCourseCodeFormat("SWE 619")).toBe(true);
  });

  it("rejects typos, junk, and empty input", () => {
    expect(isValidCourseCodeFormat("CS31")).toBe(false);
    expect(isValidCourseCodeFormat("hello")).toBe(false);
    expect(isValidCourseCodeFormat("")).toBe(false);
    expect(isValidCourseCodeFormat(undefined)).toBe(false);
  });
});
