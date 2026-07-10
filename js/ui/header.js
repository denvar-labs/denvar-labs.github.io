// =====================================================
//  KA ESPORTS – Header Component
//  Reusable page header with title, actions, and dark mode
// =====================================================

const PageHeader = (() => {

  function render(config) {
    const {
      eyebrow = 'KA ESPORTS',
      title = '',
      titleKey = '',
      description = '',
      descKey = '',
      actions = [],
      showDarkToggle = true
    } = config;

    const resolvedTitle = titleKey && typeof I18n !== 'undefined' ? I18n.t(titleKey) : title;
    const resolvedDesc = descKey && typeof I18n !== 'undefined' ? I18n.t(descKey) : description;

    let actionsHTML = '';
    if (actions.length > 0 || showDarkToggle) {
      actionsHTML = '<div class="hero-actions">';
      actions.forEach(action => {
        const icon = action.icon || '';
        const label = action.labelKey && typeof I18n !== 'undefined' ? I18n.t(action.labelKey) : (action.label || '');
        const id = action.id || '';
        const ariaLabel = action.ariaLabel || label;
        actionsHTML += `<button id="${id}" class="btn btn-sm btn-ghost" style="background:rgba(255,255,255,0.15);color:#fff;border:1px solid rgba(255,255,255,0.25);" aria-label="${ariaLabel}"><span>${icon} ${label}</span></button>`;
      });
      if (showDarkToggle) {
        actionsHTML += `<button id="dark-toggle-btn" class="btn btn-sm btn-ghost" data-dark-toggle style="background:rgba(255,255,255,0.15);color:#fff;border:1px solid rgba(255,255,255,0.25);" aria-label="Toggle dark mode"><span id="dark-label">🌙 Dark mode</span></button>`;
      }
      actionsHTML += '</div>';
    }

    return `
      <header class="hero">
        <div class="eyebrow">${escapeHTML(eyebrow)}</div>
        <h1>${escapeHTML(resolvedTitle)}</h1>
        ${resolvedDesc ? `<p>${escapeHTML(resolvedDesc)}</p>` : ''}
        ${actionsHTML}
      </header>`;
  }

  function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function inject(containerId, config) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = render(config);
    // Bind dark mode (safe check)
    if (typeof DarkMode !== 'undefined' && DarkMode.bind) {
      DarkMode.bind('dark-toggle-btn');
    }
    // Store config for re-render on language change
    container._headerConfig = config;
  }

  function rerender() {
    document.querySelectorAll('[id]').forEach(el => {
      if (el._headerConfig) {
        inject(el.id, el._headerConfig);
      }
    });
  }

  return { render, inject, rerender };
})();