
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className="flex items-center gap-2 p-1 rounded-full bg-lavender dark:bg-gray-800 transition-colors">
      <Sun className={`h-4 w-4 ${isDark ? 'text-gray-400' : 'text-amber-500'}`} />
      <Switch
        checked={isDark}
        onCheckedChange={toggleTheme}
        aria-label="Toggle theme"
        className="data-[state=checked]:bg-blue-600"
      />
      <Moon className={`h-4 w-4 ${isDark ? 'text-blue-300' : 'text-gray-400'}`} />
    </div>
  );
};
