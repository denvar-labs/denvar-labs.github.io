// =====================================================
//  KA ESPORTS – SVG Icon Helper
//  Renders Lucide icons from sprite.svg
// =====================================================

const Icon = (() => {
  function getSpritePath() {
    const scripts = document.querySelectorAll('script[src]');
    for (const s of scripts) {
      const src = s.getAttribute('src') || '';
      if (src.includes('icon.js')) {
        const base = src.replace(/js\/ui\/icon\.js.*$/, '');
        return base + 'svg/sprite.svg';
      }
    }
    const depth = window.location.pathname.split('/').filter(Boolean).length - 1;
    return '../'.repeat(depth) + 'svg/sprite.svg';
  }

  const SPRITE_PATH = getSpritePath();

  function get(name, opts = {}) {
    const { size = 16, class: cls = '' } = opts;
    const classes = ['icon', cls].filter(Boolean).join(' ');
    return `<svg class="${classes}" width="${size}" height="${size}" aria-hidden="true"><use href="${SPRITE_PATH}#${name}"/></svg>`;
  }

  function renderAll(root) {
    const scope = root || document;
    scope.querySelectorAll('[data-icon]').forEach(el => {
      const name = el.dataset.icon;
      if (!name) return;
      const existing = el.querySelector('.icon');
      if (existing) return;
      el.insertAdjacentHTML('afterbegin', get(name));
    });
  }

  return { get, renderAll, SPRITE_PATH };
})();
