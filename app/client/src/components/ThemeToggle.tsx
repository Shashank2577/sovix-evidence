import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

/**
 * Sun/moon theme toggle — SPEC.md §3.2, §6.1.
 * next-themes, class strategy (`.dark` on `<html>`), persisted to
 * localStorage automatically by next-themes.
 */
export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  // Avoid a flash of the wrong icon before next-themes resolves on mount.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <button
      className="icon-button"
      aria-label={mounted ? (isDark ? "Switch to light theme" : "Switch to dark theme") : "Toggle theme"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {isDark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}
