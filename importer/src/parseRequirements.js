import { cleanText, slugify } from "./textUtils.js";
import { normalizeCode } from "../../client/src/lib/courseCodes.js";

const TOTAL_CREDIT_PATTERNS = [
  /total credits:?\s*(\d{2,3})/i,
  /(\d{2,3})\s*credit\s*hours?\s*(?:are\s*)?required/i,
  /minimum\s*of\s*(\d{2,3})\s*(?:approved\s*)?(?:graduate\s*|undergraduate\s*)?credits?/i,
  /complete\s*(\d{2,3})\s*(?:approved\s*)?(?:graduate\s*|undergraduate\s*)?credits?/i,
  /total\s*credit\s*hours?[:\s]*?(\d{2,3})/i,
  /(\d{2,3})\s*credits?\s*\(\s*\d+\s*courses?\s*\)/i,
];

export function extractTotalCredits(pageText) {
  for (const re of TOTAL_CREDIT_PATTERNS) {
    const m = pageText.match(re);
    if (m) return Number(m[1]);
  }
  return null;
}

const CONCENTRATION_RE = /^(?:Concentration|Track|Specialization) in (.+?)(?:\s*\(([A-Z]{2,6})\))?$/i;

/** Walk heading + table.sc_courselist elements in document order within a
 * container, pairing each requirement table with the heading text that
 * precedes it (CourseLeaf pages don't nest tables under their heading). */
function collectHeadingTablePairs($, container) {
  const items = container.find("h2, h3, h4, table.sc_courselist").toArray();
  let currentHeading = "";
  const pairs = [];
  for (const el of items) {
    const $el = $(el);
    if (el.tagName === "table") {
      pairs.push({ heading: currentHeading, table: $el });
    } else {
      currentHeading = cleanText($el.text());
    }
  }
  return pairs;
}

/** Parse one sc_courselist table into one or more labeled buckets of course
 * codes, splitting on "comment" rows like "Required:" / "Choose 2 of the
 * following:" / area headers. Area subdivisions are recorded but flattened
 * into the bucket's flat course pool — the generic scraper does not attempt
 * to infer "N courses from N different areas" semantics (too program-specific
 * to guess reliably); it flags the program `needsReview` instead. */
function parseTable($, $table, sourceUrl, courseAccumulator) {
  const rows = $table.find("tbody tr").toArray();
  const buckets = new Map();
  const order = [];
  let activeLabel = null;
  let hasAreaHeaders = false;
  let hasOrClass = false;

  function bucketFor(label) {
    const key = label || "__default__";
    if (!buckets.has(key)) {
      buckets.set(key, { label, codes: [] });
      order.push(key);
    }
    return buckets.get(key);
  }

  for (const row of rows) {
    const $row = $(row);
    const cls = $row.attr("class") || "";

    if (cls.includes("areaheader")) {
      hasAreaHeaders = true;
      continue; // area name itself isn't a selectable course; codes that follow land in the active bucket
    }

    const codeLink = $row.find("a.bubblelink.code").first();

    if (cls.includes("orclass")) {
      hasOrClass = true;
      if (codeLink.length) bucketFor(activeLabel).codes.push(normalizeCode(codeLink.text()));
      continue;
    }

    if (!codeLink.length) {
      const commentSpan = $row.find("span.courselistcomment").first();
      if (commentSpan.length) {
        activeLabel = cleanText(commentSpan.text());
        bucketFor(activeLabel);
      }
      continue;
    }

    const code = normalizeCode(codeLink.text());
    const hoursTd = $row.find("td.hourscol").first();
    const creditsText = cleanText(hoursTd.text());
    const credits = /^\d+(\.\d+)?$/.test(creditsText) ? Number(creditsText) : null;
    const titleTd = $row.find("td").filter((i, td) => !$(td).hasClass("hourscol") && !$(td).hasClass("codecol")).first();
    const title = cleanText(titleTd.text());

    bucketFor(activeLabel).codes.push(code);
    if (courseAccumulator) {
      const existing = courseAccumulator.get(code);
      if (!existing) {
        courseAccumulator.set(code, { code, title: title || null, credits, sourceUrl });
      } else if (existing.credits == null && credits != null) {
        // Most tables don't list per-course credit hours (only concentration
        // tables tend to) — backfill from a later occurrence that does.
        existing.credits = credits;
      }
    }
  }

  return { buckets, order, hasAreaHeaders, hasOrClass };
}

const NUMBER_WORDS = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6,
  seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12,
};
const NUMBER_TOKEN = `(?:\\d+|${Object.keys(NUMBER_WORDS).join("|")})`;
const RULE_RE = new RegExp(`(?:choose|select)\\D{0,15}(${NUMBER_TOKEN})(?:\\s*-\\s*(${NUMBER_TOKEN}))?`, "i");

function toNumber(token) {
  if (!token) return null;
  return /^\d+$/.test(token) ? Number(token) : NUMBER_WORDS[token.toLowerCase()];
}

function bucketToGroup(tableHeading, bucket, index) {
  const label = bucket.label ? `${tableHeading} — ${bucket.label}` : tableHeading;
  const key = slugify(label) || `${slugify(tableHeading)}-${index}`;
  const codes = [...new Set(bucket.codes)];

  const ruleMatch = bucket.label && bucket.label.match(RULE_RE);
  const creditMatch = bucket.label && /credit/i.test(bucket.label);

  let type = "all-of";
  let minCourses;
  let minCredits;
  if (ruleMatch) {
    const n = toNumber(ruleMatch[1]);
    if (creditMatch) {
      type = "choose-n-credits";
      minCredits = n;
    } else {
      type = "choose-n-courses";
      minCourses = n;
    }
  }

  return {
    key,
    label,
    type,
    ...(minCourses != null && { minCourses }),
    ...(minCredits != null && { minCredits }),
    courseCodes: codes,
  };
}

/** Parse a program's requirements tab into requirementGroups + concentrations.
 * Returns needsReview=true whenever the page used a structure (area-based
 * tables, OR-alternatives, or no detectable credit total) that this
 * best-effort parser can't fully capture, so it can be hand-reviewed later. */
export function parseProgramRequirements($, container, sourceUrl, courseAccumulator) {
  const pageText = container.text();
  const totalCredits = extractTotalCredits(pageText);
  const pairs = collectHeadingTablePairs($, container);

  const requirementGroups = [];
  const concentrationsMap = new Map();
  let needsReview = totalCredits == null || pairs.length === 0;

  for (const { heading, table } of pairs) {
    const concMatch = heading.match(CONCENTRATION_RE);
    const { buckets, order, hasAreaHeaders, hasOrClass } = parseTable($, table, sourceUrl, courseAccumulator);
    if (hasAreaHeaders || hasOrClass) needsReview = true;

    const groups = order
      .map((key, idx) => bucketToGroup(heading, buckets.get(key), idx))
      .filter((g) => g.courseCodes.length > 0);
    if (groups.length === 0) continue;

    if (concMatch) {
      const name = cleanText(concMatch[1]);
      const key = (concMatch[2] || slugify(name)).toLowerCase();
      if (!concentrationsMap.has(key)) concentrationsMap.set(key, { key, name, requirementGroups: [] });
      concentrationsMap.get(key).requirementGroups.push(...groups);
    } else {
      requirementGroups.push(...groups);
    }
  }

  if (requirementGroups.length === 0 && concentrationsMap.size === 0) needsReview = true;

  return {
    totalCredits,
    needsReview,
    requirementGroups,
    concentrations: [...concentrationsMap.values()],
  };
}
