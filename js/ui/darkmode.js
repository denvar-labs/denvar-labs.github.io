// =====================================================
//  KA ESPORTS – Dark Mode Module
//  Shared dark mode toggle across all pages
// =====================================================

const DarkMode = (() => {
  const STORAGE_KEY = 'ka_dark_mode';

  function isDark() {
    return document.body.classList.contains('dark');
  }

  function apply(on) {
    document.body.classList.toggle('dark', on);
    const label = document.getElementById('dark-label');
    if (label) label.textContent = on ? '☀️ Light mode' : '🌙 Dark mode';
    // Update all dark toggle buttons
    document.querySelectorAll('[data-dark-toggle]').forEach(btn => {
      btn.setAttribute('aria-pressed', on);
    });
  }

  function toggle() {
    const next = !isDark();
    apply(next);
    localStorage.setItem(STORAGE_KEY, next);
    return next;
  }

  function init() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'true') apply(true);
  }

  function bind(buttonId) {
    const btn = document.getElementById(buttonId);
    if (!btn) return;
    btn.addEventListener('click', () => {
      const isNowDark = toggle();
      // Dispatch event for other components
      document.dispatchEvent(new CustomEvent('darkmode:change', { detail: { dark: isNowDark } }));
    });
  }

  return { init, bind, toggle, isDark, apply };
})();

// Auto-init on load
DarkMode.init();