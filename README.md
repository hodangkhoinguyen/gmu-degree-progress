# GMU Degree Progress Checker

A personal tool for tracking progress toward a GMU degree: paste or upload your unofficial
transcript, pick a program (any level/major GMU offers, with concentration support), and see
exactly which requirements are satisfied, which are missing, and what your options are for each
remaining slot.

**Not an official degree audit, and not affiliated with or endorsed by George Mason University.**
This is just a student's personal side project to track their own degree progress — not a
university product. Requirement data is scraped from the public
[GMU Catalog](https://catalog.gmu.edu) and may be incomplete or outdated for some programs (see
"Data quality" below). Always confirm with DegreeWorks or your advisor before making enrollment
decisions.

## How it works

- **No backend, no database.** The app is a static React (Vite) site. Transcript parsing (including
  PDF text extraction via `pdfjs-dist`), requirement matching, and GPA calculation all run in your
  browser. Your transcript and selected program are saved only in this browser's `localStorage` —
  nothing is ever sent to a server.
- **Catalog data** (`client/public/data/programs.json` + `courses.json`) is produced offline by a
  one-time crawl of catalog.gmu.edu (`/importer`) and served as static files.

## Project layout

```
/importer   Node CLI that scrapes catalog.gmu.edu into client/public/data/*.json
/client     The app itself (Vite + React)
```

## Running the app

```bash
cd client
npm install
npm run dev
```

Then open the printed `localhost` URL.

## Refreshing catalog data

The repo already ships with a full crawl (~550 programs, ~6,300 courses) plus hand-verified
Computer Science BS/MS/PhD data. To re-scrape (e.g. for a new catalog year):

```bash
cd importer
npm install
npm run scrape          # crawls all of catalog.gmu.edu — takes several minutes
npm run seed:cs         # re-applies the hand-verified CS overrides on top
```

Useful flags for `npm run scrape` while testing: `--filter "computer science"` (substring match on
program name) and `--limit 10` (cap how many programs to fetch).

## Testing

```bash
cd client
npm test          # run once
npm run test:watch
```

Tests live in `client/src/lib/__tests__/`:

- `progressEngine.cs-ms.test.js` — integration tests against the **real, shipped** MS Computer
  Science data (read straight from `client/public/data/programs.json`, not a hand-copied stand-in),
  covering foundation courses, the area-constrained core rule, advanced electives spanning multiple
  areas, both concentrations, GPA calculation, and a full satisfying course load. These catch both
  engine bugs and data-entry mistakes in the CS seed.
- `transcriptParser.test.js` — parser regression tests, including the two real bugs found while
  testing against an actual GMU transcript PDF: a course title wrapping onto a second PDF line
  (grade/credits ending up on the continuation line), and the "Course(s) In Progress" section having
  no Grade column at all.
- `courseCodes.test.js` / `grades.test.js` — small unit tests for the normalization/GPA helpers.

To add coverage for another program, follow the pattern in `progressEngine.cs-ms.test.js`: load it
via `findProgram({ name, degreeType })` from `__tests__/fixtures.js`, then assert on
`evaluateProgress(...)` results for a few representative course lists (empty, partial, and fully
satisfying).

## Data quality

- Simple programs (a flat list of required courses, maybe one "choose N electives" table) parse
  reliably.
- Programs with **area-constrained rules** ("2 courses from 2 different areas") or **OR-alternative
  courses** aren't fully modeled by the generic scraper — it flattens them into a best-effort flat
  list and sets `needsReview: true` on that program (shown as a "verify" badge in the degree picker).
- **Computer Science BS, MS (Cyber Security + Machine Learning concentrations), and PhD** are
  hand-verified overrides (`importer/src/seed/csPrograms.js`) with the real area/concentration
  logic — these are accurate as of the current catalog and don't need the "verify" badge.
- To improve coverage for another program, add a similar override in `importer/src/seed/` following
  the `csPrograms.js` pattern, or fix up `client/public/data/programs.json` by hand.

## Requirement group model

Each program/concentration is a list of `requirementGroups`, each one of:

- `all-of` — every listed course is required.
- `choose-n-courses` / `choose-n-credits` — pick at least N courses/credits from the list.
- `area-constrained` — an optional set of always-required courses, plus courses grouped into named
  areas with a minimum number of distinct areas (and optionally a minimum total course/credit count
  across those areas) that must be covered — e.g. the MS CS core ("CS 583, plus 2 more courses from
  2 different areas").

See `client/src/lib/progressEngine.js` for the matching logic.

## Features

- Paste or PDF-upload your transcript; review/edit the parsed rows before saving.
- Level → major → concentration picker across (almost) every GMU program, or "Compare all"
  concentrations side by side before choosing.
- Per-requirement breakdown: satisfied courses, remaining options, and area coverage.
- Overall GPA and major GPA, computed from your transcript.
- Flags a missing course if its prerequisite (per the catalog) also isn't completed yet.
- Print/export the report (browser print stylesheet).
