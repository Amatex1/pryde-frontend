(function () {
  try {
    var dark = localStorage.getItem('darkMode');
    var theme = dark === 'false' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.style.backgroundColor = theme === 'dark' ? '#0F1021' : '#F5F6FA';
  } catch (_) {
    document.documentElement.setAttribute('data-theme', 'dark');
    document.documentElement.style.backgroundColor = '#0F1021';
  }
})();