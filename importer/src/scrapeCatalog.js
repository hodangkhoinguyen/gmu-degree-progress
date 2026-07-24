import * as cheerio from "cheerio";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { classifyProgramLabel } from "./degreeLevels.js";
import { parseProgramRequirements } from "./parseRequirements.js";
import { cleanText, slugify, sleep } from "./textUtils.js";
import { writeJson } from "./jsonStore.js";

const BASE = "https://catalog.gmu.edu";
const AZ_URL = `${BASE}/programs/programsa-z/`;
const USER_AGENT = "gmu-degree-checker-import-script/1.0 (personal project; contact via github)";
const REQUEST_DELAY_MS = 300;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CLIENT_DATA_DIR = path.resolve(__dirname, "../../client/public/data");

async function fetchHtml(url) {
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT, Accept: "text/html" } });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  return res.text();
}

async function fetchProgramList() {
  const html = await fetchHtml(AZ_URL);
  const $ = cheerio.load(html);
  const seen = new Set();
  const programs = [];
  $('a[href^="/colleges-schools/"]').each((i, el) => {
    const href = $(el).attr("href");
    const label = cleanText($(el).text());
    if (!href || href === "/colleges-schools/" || !label) return;
    const url = new URL(href, BASE).toString();
    if (seen.has(url)) return;
    seen.add(url);
    programs.push({ url, label });
  });
  return programs;
}

async function scrapeProgram(entry, courseAccumulator) {
  const html = await fetchHtml(entry.url);
  const $ = cheerio.load(html);
  const { name, degreeType, level } = classifyProgramLabel(entry.label);

  const breadcrumbLinks = $("#breadcrumb a")
    .map((i, el) => cleanText($(el).text()))
    .get();
  const college = breadcrumbLinks[2] || null;
  const department = breadcrumbLinks.length > 3 ? breadcrumbLinks[breadcrumbLinks.length - 1] : college;

  const container = $("#requirementstextcontainer").length
    ? $("#requirementstextcontainer")
    : $("#textcontainer");

  const { totalCredits, needsReview, requirementGroups, concentrations } = parseProgramRequirements(
    $,
    container,
    entry.url,
    courseAccumulator
  );

  return {
    id: slugify(`${level}-${degreeType}-${name}`),
    level,
    degreeType,
    name,
    college,
    department,
    totalCredits,
    sourceUrl: entry.url,
    lastImportedAt: new Date().toISOString(),
    needsReview,
    requirementGroups,
    concentrations,
  };
}

function parseArgs(argv) {
  const args = { limit: null, filter: null };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--limit") args.limit = Number(argv[++i]);
    if (argv[i] === "--filter") args.filter = argv[++i].toLowerCase();
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  console.log(`Fetching program index from ${AZ_URL} ...`);
  let entries = await fetchProgramList();
  console.log(`Found ${entries.length} program links.`);

  if (args.filter) {
    entries = entries.filter((e) => e.label.toLowerCase().includes(args.filter));
    console.log(`Filtered to ${entries.length} entries matching "${args.filter}".`);
  }
  if (args.limit) {
    entries = entries.slice(0, args.limit);
    console.log(`Limited to first ${entries.length} entries.`);
  }

  const courseAccumulator = new Map();
  const programs = [];
  let reviewCount = 0;

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    process.stdout.write(`[${i + 1}/${entries.length}] ${entry.label} ... `);
    try {
      const program = await scrapeProgram(entry, courseAccumulator);
      programs.push(program);
      if (program.needsReview) reviewCount++;
      console.log(program.needsReview ? "ok (needs review)" : "ok");
    } catch (err) {
      console.log(`FAILED: ${err.message}`);
    }
    await sleep(REQUEST_DELAY_MS);
  }

  writeJson(path.join(CLIENT_DATA_DIR, "programs.json"), {
    generatedAt: new Date().toISOString(),
    sourceIndex: AZ_URL,
    programs,
  });
  writeJson(path.join(CLIENT_DATA_DIR, "courses.json"), {
    generatedAt: new Date().toISOString(),
    courses: [...courseAccumulator.values()],
  });

  console.log(
    `\nDone. ${programs.length} programs written (${reviewCount} flagged needsReview), ${courseAccumulator.size} unique courses.`
  );
  console.log(`Output: ${path.join(CLIENT_DATA_DIR, "programs.json")}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
