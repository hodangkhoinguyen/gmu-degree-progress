import { normalizeCode } from "./courseCodes.js";

const TERM_RE = /\b(Fall|Spring|Summer|Winter)\s+(\d{4})\b/i;

const GRADE_TOKEN = "[A-F][+-]?|WF|IP|NR|AU|S|U|P|I|W";
// Subject(2-4 letters) Course#(3 digits) ... Title ... Grade ... Credits
const COURSE_LINE_WITH_GRADE_RE = new RegExp(
  `^\\s*([A-Z]{2,4})\\s+(\\d{3})\\s+(.*?)\\s+(${GRADE_TOKEN})\\s+(\\d+(?:\\.\\d+)?)\\b`
);
// "Courses In Progress" rows have no grade yet: Subject Course Level Title Credits
const COURSE_LINE_NO_GRADE_RE = /^\s*([A-Z]{2,4})\s+(\d{3})\s+(?:GR|UG)?\s*(.*?)\s+(\d+(?:\.\d+)?)\s*$/;

const ROW_START_RE = /^[A-Z]{2,4}\s+\d{3}\b/;
const NON_MERGE_PREFIX_RE =
  /^(Period|Subject|Attempt|Current|Cumulative|Term:|TRANSCRIPT|COURSE|STUDENT|INSTITUTION)/i;

/** PDF text extraction can split a wrapped course title onto its own line
 * (with the grade/credits ending up on that continuation line instead of the
 * line with the course code). Glue anything that doesn't look like the start
 * of a new row/section onto the previous line so the single-line regexes
 * below can still match it. */
function mergeWrappedLines(rawLines) {
  const merged = [];
  for (const raw of rawLines) {
    const trimmed = raw.trim();
    if (!trimmed) {
      merged.push(raw);
      continue;
    }
    const startsNewRow =
      ROW_START_RE.test(trimmed) || TERM_RE.test(trimmed) || NON_MERGE_PREFIX_RE.test(trimmed) || /^\d/.test(trimmed);
    if (!startsNewRow && merged.length > 0) {
      merged[merged.length - 1] = `${merged[merged.length - 1]} ${trimmed}`;
    } else {
      merged.push(raw);
    }
  }
  return merged;
}

/** Best-effort line parser for a pasted/PDF-extracted GMU (Banner-style)
 * unofficial transcript. Deliberately conservative: anything that doesn't
 * clearly look like "SUBJ ### Title [Grade] Credits" is skipped rather than
 * guessed at, since the caller always shows results in an editable table. */
export function parseTranscriptText(rawText) {
  const lines = mergeWrappedLines(rawText.split(/\r?\n/));
  const courses = [];
  let currentTerm = null;
  const warnings = [];

  for (const line of lines) {
    const termMatch = line.match(TERM_RE);
    if (termMatch && line.length < 60) {
      currentTerm = `${capitalize(termMatch[1])} ${termMatch[2]}`;
      continue;
    }

    const withGrade = line.match(COURSE_LINE_WITH_GRADE_RE);
    if (withGrade) {
      const [, subject, number, titleRaw, grade, credits] = withGrade;
      courses.push({
        code: normalizeCode(`${subject} ${number}`),
        title: cleanTitle(titleRaw),
        grade: grade.toUpperCase(),
        credits: Number(credits),
        term: currentTerm,
      });
      continue;
    }

    const noGrade = line.match(COURSE_LINE_NO_GRADE_RE);
    if (noGrade) {
      const [, subject, number, titleRaw, credits] = noGrade;
      courses.push({
        code: normalizeCode(`${subject} ${number}`),
        title: cleanTitle(titleRaw),
        grade: "",
        credits: Number(credits),
        term: currentTerm,
      });
    }
  }

  if (courses.length === 0) {
    warnings.push(
      "Couldn't automatically detect any course rows. Paste the text version of your unofficial transcript, or add rows manually in the table below."
    );
  }

  return { courses, warnings };
}

function cleanTitle(titleRaw) {
  return titleRaw
    .replace(/^(?:GR|UG)\s+/, "")
    .trim()
    .replace(/\s{2,}/g, " ");
}

function capitalize(s) {
  return s[0].toUpperCase() + s.slice(1).toLowerCase();
}
