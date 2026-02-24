"use client";

import { useEffect, useState } from "react";
import DashboardCard from "./DashboardCard";

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }
    const saved = localStorage.getItem("theme");
    if (saved) {
      return saved === "dark";
    }
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  const applyTheme = (dark: boolean) => {
    if (dark) {
      document.documentElement.setAttribute("data-theme", "dark");
      document.documentElement.style.colorScheme = "dark";
    } else {
      document.documentElement.setAttribute("data-theme", "light");
      document.documentElement.style.colorScheme = "light";
    }
  };

  useEffect(() => {
    applyTheme(isDark);
  }, [isDark]);

  const setLightMode = () => {
    setIsDark(false);
    localStorage.setItem("theme", "light");
  };

  const setDarkMode = () => {
    setIsDark(true);
    localStorage.setItem("theme", "dark");
  };

  return (
    <DashboardCard title="" collapsible={false}>
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
