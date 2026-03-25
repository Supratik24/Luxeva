import { MoonStar, SunMedium } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="glass inline-flex h-11 w-11 items-center justify-center rounded-full text-ink transition hover:scale-105 dark:text-white"
      aria-label="Toggle theme"
    >
      {theme === "light" ? <MoonStar size={18} /> : <SunMedium size={18} />}
    </button>
  );
};

export default ThemeToggle;

