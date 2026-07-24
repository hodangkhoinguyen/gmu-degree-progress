import { describe, it, expect } from "vitest";
import { parseTranscriptText } from "../transcriptParser.js";

describe("parseTranscriptText", () => {
  it("parses a simple graded course line under a term header", () => {
    const { courses } = parseTranscriptText(`
Fall 2024
CS 310 GR Data Structures A- 3.000 11.01
`);
    expect(courses).toEqual([
      { code: "CS 310", title: "Data Structures", grade: "A-", credits: 3, term: "Fall 2024" },
    ]);
  });

  it("tracks the current term across multiple periods", () => {
    const { courses } = parseTranscriptText(`
Period: Fall 2024
CS 530 GR Mathematical Foundations of Computer Science A 3.000 12.00
Period: Spring 2025
CS 531 GR Computer Systems B+ 3.000 9.99
`);
    expect(courses.map((c) => c.term)).toEqual(["Fall 2024", "Spring 2025"]);
  });

  // Regression test: PDF text extraction can split a wrapped course title
  // onto its own line, with the grade/credits ending up on that continuation
  // line rather than the line with the course code — e.g. a real transcript
  // rendered "SWE 619 GR Obj Orient Sftware Specif/" and "Cons A+ 3.000 12.00"
  // as two separate lines. The parser must still recover the full row.
  it("recovers a course row whose title wraps onto a second line", () => {
    const { courses } = parseTranscriptText(`
Fall 2025
CS 800 GR Computer Science
Colloquium S 0.000 0.00
SWE 619 GR Obj Orient Sftware Specif/
Cons A+ 3.000 12.00
`);
    expect(courses).toEqual([
      { code: "CS 800", title: "Computer Science Colloquium", grade: "S", credits: 0, term: "Fall 2025" },
      { code: "SWE 619", title: "Obj Orient Sftware Specif/ Cons", grade: "A+", credits: 3, term: "Fall 2025" },
    ]);
  });

  // Regression test: the "Course(s) In Progress" section has no Grade
  // column at all (Subject / Course / Level / Title / Credit Hours only).
  it("parses in-progress courses that have no grade yet", () => {
    const { courses } = parseTranscriptText(`
COURSE(S) IN PROGRESS
Term: Fall 2026
Subject Course Level Title Credit Hours
CS 688 GR Machine Learning 3.000
CS 747 GR Deep Learning 3.000
`);
    expect(courses).toEqual([
      { code: "CS 688", title: "Machine Learning", grade: "", credits: 3, term: "Fall 2026" },
      { code: "CS 747", title: "Deep Learning", grade: "", credits: 3, term: "Fall 2026" },
    ]);
  });

  it("does not merge totals/summary rows into course rows", () => {
    const { courses } = parseTranscriptText(`
Fall 2024
CS 530 GR Mathematical Foundations of Computer Science A 3.000 12.00
Period Totals
(Graduate)
Attempt Hours Passed Hours Earned Hours GPA Hours Quality Points GPA
Current Period 3.000 3.000 3.000 3.000 12.00 4.00
`);
    expect(courses).toHaveLength(1);
    expect(courses[0].code).toBe("CS 530");
  });

  it("returns a warning and no courses for text with no recognizable rows", () => {
    const { courses, warnings } = parseTranscriptText("not a transcript, just some prose.");
    expect(courses).toEqual([]);
    expect(warnings.length).toBeGreaterThan(0);
  });
});
