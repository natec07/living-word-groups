"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center gap-2">
      <Button variant={theme === "light" ? "default" : "outline"} size="sm" onClick={() => setTheme("light")}>
        <Sun className="h-4 w-4" /> Light
      </Button>
      <Button variant={theme === "dark" ? "default" : "outline"} size="sm" onClick={() => setTheme("dark")}>
        <Moon className="h-4 w-4" /> Dark
      </Button>
      <Button variant={theme === "system" ? "default" : "outline"} size="sm" onClick={() => setTheme("system")}>
        System
      </Button>
    </div>
  );
}
