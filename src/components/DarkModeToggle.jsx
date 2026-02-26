import { useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { getTheme, toggleTheme } from '../utils/themeManager';
import './DarkModeToggle.css';

function DarkModeToggle({ asIcon = false, onClick }) {
  const [isDark, setIsDark] = useState(() => getTheme() === 'dark');

  const toggleDarkMode = () => {
    const newTheme = toggleTheme();
    setIsDark(newTheme === 'dark');
    if (onClick) onClick();
  };

  // If used as icon only (in dropdown), just return the icon
  if (asIcon) {
    return isDark
      ? <Sun size={18} strokeWidth={1.75} className="dark-mode-icon" aria-hidden="true" />
      : <Moon size={18} strokeWidth={1.75} className="dark-mode-icon" aria-hidden="true" />;
  }

  return (
    <button
      className="dark-mode-toggle"
      onClick={toggleDarkMode}
      aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      data-tooltip={isDark ? 'Light Mode' : 'Dark Mode'}
    >
      {isDark
        ? <Sun size={18} strokeWidth={1.75} aria-hidden="true" />
        : <Moon size={18} strokeWidth={1.75} aria-hidden="true" />}
    </button>
  );
}

export default DarkModeToggle;

