const KEY = "gmu-degree-progress:theme";

function systemPrefersDark() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function getTheme() {
  return localStorage.getItem(KEY) || (systemPrefersDark() ? "dark" : "light");
}

export function setTheme(theme) {
  localStorage.setItem(KEY, theme);
  document.documentElement.setAttribute("data-theme", theme);
}

// Applied as soon as this module loads (imported early in main.jsx) so the
// right theme is set before the first paint, not after React mounts.
setTheme(getTheme());
