const CODE_RE = /\b([A-Z]{2,4})\s?-?\s?(\d{3})\b/g;
const CODE_FORMAT_RE = /^[A-Z]{2,4} \d{3}$/;

export function normalizeCode(code) {
  return (code || "").replace(/\s+/g, " ").trim().toUpperCase();
}

export function isValidCourseCodeFormat(code) {
  return CODE_FORMAT_RE.test(normalizeCode(code));
}

export function extractCourseCodes(text) {
  if (!text) return [];
  const found = new Set();
  for (const match of text.toUpperCase().matchAll(CODE_RE)) {
    found.add(`${match[1]} ${match[2]}`);
  }
  return [...found];
}
