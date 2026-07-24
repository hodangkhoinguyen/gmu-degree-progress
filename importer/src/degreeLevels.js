// Maps a GMU catalog degree-type abbreviation (as it appears after the comma
// in "Program Name, MS") to a coarse level bucket used for the level picker.
const DEGREE_TYPE_LEVEL = {
  BA: "Bachelor's", BS: "Bachelor's", BFA: "Bachelor's", BSEd: "Bachelor's",
  BIS: "Bachelor's", BSN: "Bachelor's", BM: "Bachelor's", BAS: "Bachelor's",
  MA: "Master's", MS: "Master's", MEd: "Master's", MFA: "Master's",
  MM: "Master's", MHA: "Master's", MPS: "Master's", MAT: "Master's",
  MBA: "Master's", MPH: "Master's", MSW: "Master's", MPA: "Master's",
  LLM: "Master's",
  PhD: "Doctoral", EdD: "Doctoral", EdS: "Doctoral", DMA: "Doctoral",
  DNP: "Doctoral", AuD: "Doctoral", JD: "Doctoral",
};

/** Classify a Programs A-Z link label like "Computer Science, MS" or
 * "Accounting Analytics Graduate Certificate" or "Anthropology Minor". */
export function classifyProgramLabel(label) {
  const text = label.trim();

  if (/\bMinor(?:\s*\([^)]*\))?$/i.test(text)) {
    return {
      name: text.replace(/\s*Minor(?:\s*\([^)]*\))?$/i, "").trim(),
      degreeType: "Minor",
      level: "Minor",
    };
  }
  if (/Undergraduate Certificate/i.test(text)) {
    return {
      name: text.replace(/\s*Undergraduate Certificate.*$/i, "").trim(),
      degreeType: "Undergraduate Certificate",
      level: "Certificate",
    };
  }
  if (/Graduate Certificate/i.test(text)) {
    return {
      name: text.replace(/\s*Graduate Certificate.*$/i, "").trim(),
      degreeType: "Graduate Certificate",
      level: "Certificate",
    };
  }

  const lastComma = text.lastIndexOf(",");
  if (lastComma !== -1) {
    const name = text.slice(0, lastComma).trim();
    const degreeType = text.slice(lastComma + 1).trim();
    const level = DEGREE_TYPE_LEVEL[degreeType] || guessLevelFromPrefix(degreeType);
    return { name, degreeType, level };
  }

  return { name: text, degreeType: "Other", level: "Other" };
}

function guessLevelFromPrefix(degreeType) {
  if (/^B/.test(degreeType)) return "Bachelor's";
  if (/^M/.test(degreeType)) return "Master's";
  if (/^(Ph|Ed|D)/.test(degreeType)) return "Doctoral";
  return "Other";
}
