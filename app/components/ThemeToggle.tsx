"use client";

import { useEffect, useState } from "react";
import DashboardCard from "./DashboardCard";

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check saved preference or system preference
    const saved = localStorage.getItem("theme");
    if (saved) {
      setIsDark(saved === "dark");
      applyTheme(saved === "dark");
    } else {
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
      setIsDark(prefersDark);
      applyTheme(prefersDark);
    }
  }, []);

  const applyTheme = (dark: boolean) => {
    if (dark) {
      document.documentElement.setAttribute("data-theme", "dark");
      document.documentElement.style.colorScheme = "dark";
    } else {
      document.documentElement.setAttribute("data-theme", "light");
      document.documentElement.style.colorScheme = "light";
    }
  };

  const setLightMode = () => {
    setIsDark(false);
    localStorage.setItem("theme", "light");
    applyTheme(false);
  };

  const setDarkMode = () => {
    setIsDark(true);
    localStorage.setItem("theme", "dark");
    applyTheme(true);
  };

  if (!mounted) {
    return null;
  }

  return (
    <DashboardCard title="Theme" icon="🎨">
      <div className="flex gap-3">
        <button
          onClick={setLightMode}
          className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
            !isDark
              ? "bg-foreground text-background"
              : "bg-foreground/10 text-foreground hover:bg-foreground/20"
          }`}
        >
          Light
        </button>
        <button
          onClick={setDarkMode}
          className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
            isDark
              ? "bg-foreground text-background"
              : "bg-foreground/10 text-foreground hover:bg-foreground/20"
          }`}
        >
          Dark
        </button>
      </div>
    </DashboardCard>
  );
}
