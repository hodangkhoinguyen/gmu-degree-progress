let cache = null;

async function fetchJson(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`);
  return res.json();
}

export async function loadCatalog() {
  if (cache) return cache;
  const [programsData, coursesData] = await Promise.all([
    fetchJson("/data/programs.json"),
    fetchJson("/data/courses.json").catch(() => ({ courses: [] })),
  ]);
  cache = {
    generatedAt: programsData.generatedAt,
    programs: programsData.programs || [],
    courses: coursesData.courses || [],
  };
  return cache;
}

export async function searchPrograms({ level, q } = {}) {
  const { programs } = await loadCatalog();
  let result = programs;
  if (level) result = result.filter((p) => p.level === level);
  if (q) {
    const needle = q.trim().toLowerCase();
    result = result.filter(
      (p) =>
        p.name.toLowerCase().includes(needle) ||
        p.department?.toLowerCase().includes(needle) ||
        p.college?.toLowerCase().includes(needle)
    );
  }
  return result;
}

export async function getProgramById(id) {
  const { programs } = await loadCatalog();
  return programs.find((p) => p.id === id) || null;
}

export async function getCourseCatalog() {
  const { courses } = await loadCatalog();
  return courses;
}
