// js/darkmode.js – Dark mode toggle & persistence

(function () {
  // Apply saved preference as soon as the script loads
  function applyDark(on) {
    document.body.classList.toggle('dark', on);
    const label = document.getElementById('dark-label');
    if (label) label.textContent = on ? '☀️ Light mode' : '🌙 Dark mode';
  }

  const saved = localStorage.getItem('ka_dark_mode');
  if (saved === 'true') applyDark(true);

  // Attach click handler to the toggle button once the DOM is ready
  function initToggle() {
    const btn = document.getElementById('dark-toggle-btn');
    if (!btn) return;

    btn.addEventListener('click', function () {
      const isDark = document.body.classList.contains('dark');
      applyDark(!isDark);
      localStorage.setItem('ka_dark_mode', !isDark);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initToggle);
  } else {
    initToggle();
  }
})();
