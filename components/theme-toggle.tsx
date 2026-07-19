"use client";

import { MoonIcon, SunIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import { useTheme } from "./theme-provider";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button
        type="button"
        aria-label="Chuyển chế độ giao diện"
        className={`flex h-11 w-11 items-center justify-center rounded-md border border-neutral-200 text-black transition-colors dark:border-neutral-700 dark:text-white ${className}`}
      >
        <MoonIcon className="h-5" />
      </button>
    );
  }

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Chuyển sang chế độ sáng" : "Chuyển sang chế độ tối"}
      title={isDark ? "Chuyển sang chế độ sáng" : "Chuyển sang chế độ tối"}
      className={`flex h-11 w-11 items-center justify-center rounded-md border border-neutral-200 text-black transition-colors hover:bg-neutral-100 dark:border-neutral-700 dark:text-white dark:hover:bg-neutral-800 ${className}`}
    >
      {isDark ? (
        <SunIcon className="h-5 text-amber-400 transition-all ease-in-out hover:scale-110" />
      ) : (
        <MoonIcon className="h-5 text-neutral-700 transition-all ease-in-out hover:scale-110 dark:text-neutral-200" />
      )}
    </button>
  );
}
export default ThemeToggle;
