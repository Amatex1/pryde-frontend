import { useState } from 'react';
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
    return <span className="dark-mode-icon">{isDark ? '☀️' : '🌙'}</span>;
  }

  return (
    <button
      className="dark-mode-toggle"
      onClick={toggleDarkMode}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    >
      {isDark ? '☀️' : '🌙'}
    </button>
  );
}

export default DarkModeToggle;

