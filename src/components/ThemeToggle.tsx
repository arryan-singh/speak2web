
import { useTheme } from "@/contexts/ThemeContext";
import { Moon, Sun } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className="flex items-center gap-2 p-3 rounded-full bg-gray-100 dark:bg-gray-800 border dark:border-gray-700 transition-colors shadow-sm">
      <Sun className={`h-5 w-5 ${isDark ? 'text-gray-400' : 'text-amber-500'}`} />
      <Switch
        checked={isDark}
        onCheckedChange={toggleTheme}
        aria-label="Toggle theme"
        className="data-[state=checked]:bg-blue-600 dark:data-[state=unchecked]:bg-gray-600"
      />
      <Moon className={`h-5 w-5 ${isDark ? 'text-blue-400' : 'text-gray-400'}`} />
    </div>
  );
};
