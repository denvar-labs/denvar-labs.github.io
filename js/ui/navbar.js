// =====================================================
//  KA ESPORTS – Global Navbar
//  Fixed top navbar with logo, nav, lang switcher, dark mode
// =====================================================

const Navbar = (() => {

  const NAV_ITEMS = [
    { href: '/', labelKey: 'nav_home' },
    { href: '/ka-esports/global-leaderboard.html', labelKey: 'nav_global_leaderboard' },
    { href: '/ka-esports/monthly-leaderboard.html', labelKey: 'nav_monthly_leaderboard' },
    { href: '/ka-esports/match-reports.html', labelKey: 'nav_match_reports' },
    { href: '/ka-esports/player-profile.html', labelKey: 'nav_player_profile' },
    { href: '/ka-esports/hall-of-fame.html', labelKey: 'nav_hall_of_fame' },
    { href: '/ka-esports/streams.html', labelKey: 'nav_streams' },
    { href: '/ka-esports/faq.html', labelKey: 'nav_faq' },
  ];

  function getActiveHref() {
    const path = window.location.pathname.replace(/\/+$/, '').split('/').pop() || 'index.html';
    // Check exact match first, then check if we're in a sub-section
    for (const item of NAV_ITEMS) {
      const itemPath = item.href.split('/').pop();
      if (itemPath === path) return item.href;
    }
    // Fallback: check parent path for sub-pages like admin/penalty.html
    const segments = window.location.pathname.split('/').filter(Boolean);
    const parent = segments[segments.length - 2] + '/' + segments[segments.length - 1];
    for (const item of NAV_ITEMS) {
      const itemFull = item.href.replace(/^\//, '');
      if (parent === itemFull) return item.href;
    }
    return '/';
  }

  function render() {
    const currentHref = getActiveHref();
    const t = typeof I18n !== 'undefined' ? I18n.t.bind(I18n) : (k) => k;
    const lang = typeof I18n !== 'undefined' ? I18n.getLang() : 'es';

    const navLinks = NAV_ITEMS.map(item => {
      const isActive = item.href === currentHref;
      const cls = isActive ? ' active' : '';
      const ariac = isActive ? ' aria-current="page"' : '';
      const label = t(item.labelKey);
      return `<a href="${item.href}" class="nav-link${cls}"${ariac}><span class="nav-text">${label}</span></a>`;
    }).join('');

    const langLabel = lang === 'es' ? 'Español' : 'English';
    const langOther = lang === 'es' ? 'English' : 'Español';
    const langOtherKey = lang === 'es' ? 'en' : 'es';

    return `
      <nav class="navbar" role="navigation" aria-label="Main navigation">
        <div class="navbar-inner">
          <a href="/" class="navbar-brand">
            <i class="ph-bold ph-trophy navbar-logo" aria-hidden="true"></i>
            <span class="navbar-title">KA ESPORTS</span>
          </a>

          <button class="navbar-toggle" aria-label="Toggle menu" id="navbar-toggle">
            <span></span><span></span><span></span>
          </button>

          <div class="navbar-menu" id="navbar-menu">
            <div class="navbar-links">
              ${navLinks}
            </div>

            <div class="navbar-actions">
              <div class="lang-dropdown" id="lang-dropdown">
                <button class="lang-trigger" id="lang-trigger" aria-label="Change language" aria-expanded="false">
                  <i class="ph ph-globe-hemisphere-west globe-icon" aria-hidden="true"></i>
                  <span class="lang-current">${langLabel}</span>
                  <span class="caret">▾</span>
                </button>
                <div class="lang-options" id="lang-options" role="menu">
                  <button class="lang-option${lang === 'es' ? ' active' : ''}" data-lang="es" role="menuitem">
                    <span>Español</span>
                  </button>
                  <button class="lang-option${lang === 'en' ? ' active' : ''}" data-lang="en" role="menuitem">
                    <span>English</span>
                  </button>
                </div>
              </div>

              <button class="navbar-icon-btn" id="dark-toggle-btn" data-dark-toggle>
                <span id="dark-label"><i class="ph ph-moon" aria-hidden="true"></i> Dark mode</span>
              </button>
            </div>
          </div>
        </div>
      </nav>`;
  }

  function inject(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = render();
    bindEvents();
  }

  function bindEvents() {
    // Mobile toggle
    const toggle = document.getElementById('navbar-toggle');
    const menu = document.getElementById('navbar-menu');
    if (toggle && menu) {
      toggle.addEventListener('click', () => {
        menu.classList.toggle('open');
        toggle.classList.toggle('active');
      });
      // Close on link click
      menu.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
          menu.classList.remove('open');
          toggle.classList.remove('active');
        });
      });
    }

    // Language dropdown
    const langTrigger = document.getElementById('lang-trigger');
    const langOptions = document.getElementById('lang-options');
    if (langTrigger && langOptions) {
      langTrigger.addEventListener('click', (e) => {
        e.stopPropagation();
        const expanded = langTrigger.getAttribute('aria-expanded') === 'true';
        langTrigger.setAttribute('aria-expanded', !expanded);
        langOptions.classList.toggle('open');
      });

      langOptions.querySelectorAll('.lang-option').forEach(btn => {
        btn.addEventListener('click', () => {
          const newLang = btn.dataset.lang;
          if (typeof I18n !== 'undefined') {
            I18n.setLang(newLang);
          }
          langOptions.classList.remove('open');
          langTrigger.setAttribute('aria-expanded', 'false');
        });
      });

      // Close on outside click
      document.addEventListener('click', () => {
        langOptions.classList.remove('open');
        langTrigger.setAttribute('aria-expanded', 'false');
      });
    }

    // Dark mode
    if (typeof DarkMode !== 'undefined' && DarkMode.bind) {
      DarkMode.bind('dark-toggle-btn');
    }
  }

  function rerender() {
    inject('navbar-container');
  }

  return { render, inject, rerender };
})();