const CODE_RE = /\b([A-Z]{2,4})\s?-?\s?(\d{3})\b/g;

export function normalizeCode(code) {
  return code.replace(/\s+/g, " ").trim().toUpperCase();
}

export function extractCourseCodes(text) {
  if (!text) return [];
  const found = new Set();
  for (const match of text.toUpperCase().matchAll(CODE_RE)) {
    found.add(`${match[1]} ${match[2]}`);
  }
  return [...found];
}
