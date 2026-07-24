import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { csPrograms } from "./csPrograms.js";
import { writeJson } from "../jsonStore.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROGRAMS_PATH = path.resolve(__dirname, "../../../client/public/data/programs.json");

function main() {
  const raw = fs.readFileSync(PROGRAMS_PATH, "utf-8");
  const data = JSON.parse(raw);

  let replaced = 0;
  let added = 0;
  for (const seedProgram of csPrograms) {
    const entry = { ...seedProgram, lastImportedAt: new Date().toISOString() };
    const idx = data.programs.findIndex((p) => p.id === entry.id);
    if (idx === -1) {
      data.programs.push(entry);
      added++;
    } else {
      data.programs[idx] = entry;
      replaced++;
    }
  }

  writeJson(PROGRAMS_PATH, data);
  console.log(`Applied CS seed: ${replaced} replaced, ${added} added. Wrote ${PROGRAMS_PATH}`);
}

main();
