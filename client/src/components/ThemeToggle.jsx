import { useState } from "react";
import { getTheme, setTheme } from "../lib/theme.js";

export default function ThemeToggle() {
  const [theme, setThemeState] = useState(getTheme);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    setThemeState(next);
  }

  return (
    <button onClick={toggle} aria-label="Toggle light/dark theme" title="Toggle light/dark theme">
      {theme === "dark" ? "☀️" : "🌙"}
    </button>
  );
}
