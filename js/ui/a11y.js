// =====================================================
//  KA ESPORTS – Accessibility Utilities
//  ARIA, focus management, keyboard navigation
// =====================================================

const A11y = (() => {

  // Trap focus within a container (for modals, dropdowns)
  function trapFocus(container) {
    const focusable = container.querySelectorAll(
      'a[href], button:not([disabled]), textarea:not([disabled]), ' +
      'input:not([disabled]):not([type="hidden"]), select:not([disabled]), ' +
      '[tabindex]:not([tabindex="-1"])'
    );
    if (focusable.length === 0) return () => {};

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    function handler(e) {
      if (e.key !== 'Tab') return;
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    }

    container.addEventListener('keydown', handler);
    first.focus();

    return () => container.removeEventListener('keydown', handler);
  }

  // Manage focus for dynamic content (e.g., loading states)
  function announce(message, priority = 'polite') {
    let region = document.getElementById('a11y-announcer');
    if (!region) {
      region = document.createElement('div');
      region.id = 'a11y-announcer';
      region.className = 'live-region';
      region.setAttribute('aria-live', priority);
      region.setAttribute('aria-atomic', 'true');
      document.body.appendChild(region);
    }
    region.textContent = '';
    requestAnimationFrame(() => { region.textContent = message; });
  }

  // Keyboard navigation for lists/grids
  function initRovingTabindex(container, itemSelector) {
    const items = container.querySelectorAll(itemSelector);
    if (items.length === 0) return;

    items.forEach((item, i) => {
      item.setAttribute('tabindex', i === 0 ? '0' : '-1');
    });

    container.addEventListener('keydown', (e) => {
      const current = document.activeElement;
      const index = Array.from(items).indexOf(current);
      if (index === -1) return;

      let next = index;
      switch (e.key) {
        case 'ArrowDown':
        case 'ArrowRight':
          e.preventDefault();
          next = (index + 1) % items.length;
          break;
        case 'ArrowUp':
        case 'ArrowLeft':
          e.preventDefault();
          next = (index - 1 + items.length) % items.length;
          break;
        case 'Home':
          e.preventDefault();
          next = 0;
          break;
        case 'End':
          e.preventDefault();
          next = items.length - 1;
          break;
        default:
          return;
      }

      items[index].setAttribute('tabindex', '-1');
      items[next].setAttribute('tabindex', '0');
      items[next].focus();
    });
  }

  // Escape key handler
  function onEscape(callback) {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') callback(e);
    });
  }

  // Add ARIA attributes to common patterns
  function enhance() {
    // Modals
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.setAttribute('role', 'dialog');
      overlay.setAttribute('aria-modal', 'true');
    });

    // Dropdowns
    document.querySelectorAll('.dropdown-menu').forEach(menu => {
      menu.setAttribute('role', 'menu');
      menu.querySelectorAll('.dropdown-item').forEach(item => {
        item.setAttribute('role', 'menuitem');
      });
    });

    // Tables
    document.querySelectorAll('.data-table').forEach(table => {
      table.setAttribute('role', 'table');
      table.querySelectorAll('th').forEach(th => {
        if (!th.getAttribute('scope')) th.setAttribute('scope', 'col');
      });
    });

    // Page sections
    document.querySelectorAll('.panel').forEach((panel, i) => {
      const heading = panel.querySelector('.section-heading, .panel-heading');
      if (heading) {
        const id = heading.id || `section-${i}`;
        heading.id = id;
        panel.setAttribute('aria-labelledby', id);
      }
    });

    // Skip link
    if (!document.querySelector('.skip-link')) {
      const skip = document.createElement('a');
      skip.className = 'skip-link';
      const target = document.querySelector('#main-content, main, .content');
      if (target) {
        if (!target.id) target.id = 'main-content';
        skip.href = '#' + target.id;
      }
      skip.textContent = 'Skip to content';
      document.body.insertBefore(skip, document.body.firstChild);
    }

    // Main landmark
    if (!document.querySelector('main')) {
      const content = document.querySelector('.content');
      if (content) content.setAttribute('role', 'main');
    }
  }

  // Auto-enhance on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', enhance);
  } else {
    enhance();
  }

  return { trapFocus, announce, initRovingTabindex, onEscape, enhance };
})();