"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { setTheme } = useTheme();
  const [activeTheme, setActiveTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setActiveTheme(getDomTheme());
      setMounted(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  function toggleTheme() {
    const isCurrentlyDark = getDomTheme() === "dark";
    const nextTheme = isCurrentlyDark ? "light" : "dark";

    setTheme(nextTheme);
    setActiveTheme(nextTheme);

    document.documentElement.classList.toggle("dark", nextTheme === "dark");
    document.documentElement.style.colorScheme = nextTheme;
    window.localStorage.setItem("educommand-theme", nextTheme);
  }

  const currentTheme = mounted ? activeTheme : "light";
  const isDark = currentTheme === "dark";

  return (
    <Button
      aria-label={isDark ? "Switch to day mode" : "Switch to night mode"}
      className="print:hidden w-10 px-0"
      onClick={toggleTheme}
      title={isDark ? "Switch to day mode" : "Switch to night mode"}
      type="button"
      variant="secondary"
    >
      {isDark ? <Moon className="h-4 w-4" aria-hidden="true" /> : <Sun className="h-4 w-4" aria-hidden="true" />}
    </Button>
  );
}

function getDomTheme(): "light" | "dark" {
  if (typeof document === "undefined") return "light";
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}
