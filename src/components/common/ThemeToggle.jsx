import { Sun, Moon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const ThemeToggle = () => {
  const { preferences, toggleTheme } = useAuth();
  const isDarkMode = preferences.theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      aria-label="Toggle theme"
    >
      {isDarkMode ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
    </button>
  );
};

export default ThemeToggle;