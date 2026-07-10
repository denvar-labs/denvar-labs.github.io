// =====================================================
//  KA ESPORTS – Language Switcher
//  ES/EN toggle button
// =====================================================

const LangSwitcher = (() => {
  function create(container) {
    const el = typeof container === 'string' ? document.getElementById(container) : container;
    if (!el) return;

    const btn = document.createElement('button');
    btn.className = 'lang-switcher';
    btn.setAttribute('aria-label', 'Switch language');
    btn.title = I18n.getLang() === 'es' ? 'Switch to English' : 'Cambiar a Español';

    const flag = document.createElement('span');
    flag.className = 'lang-flag';
    flag.textContent = I18n.getLang() === 'es' ? '🇪🇸' : '🇺🇸';

    const label = document.createElement('span');
    label.className = 'lang-label';
    label.textContent = I18n.getLang() === 'es' ? 'ES' : 'EN';

    btn.appendChild(flag);
    btn.appendChild(label);

    btn.addEventListener('click', () => {
      I18n.toggle();
      flag.textContent = I18n.getLang() === 'es' ? '🇪🇸' : '🇺🇸';
      label.textContent = I18n.getLang() === 'es' ? 'ES' : 'EN';
      btn.title = I18n.getLang() === 'es' ? 'Switch to English' : 'Cambiar a Español';
    });

    el.appendChild(btn);
    return btn;
  }

  return { create };
})();