
import React from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/useTheme";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleTheme}
      className="relative h-9 w-9 rounded-full transition-all duration-300 hover:scale-110 border-opacity-50"
      title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
      aria-label="Toggle theme"
    >
      <Sun className={cn(
        "h-[1.2rem] w-[1.2rem] rotate-0 transition-all",
        theme === "dark" ? "scale-100" : "scale-0 opacity-0"
      )} />
      <Moon className={cn(
        "absolute h-[1.2rem] w-[1.2rem] rotate-90 transition-all",
        theme === "dark" ? "scale-0 opacity-0" : "scale-100 rotate-0"
      )} />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}

// Helper for className concatenation
function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
