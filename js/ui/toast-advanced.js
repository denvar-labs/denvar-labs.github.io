// =====================================================
//  KA ESPORTS – Advanced Toast Notifications
//  Rich notifications with actions, progress, stacking
// =====================================================

const AdvancedToast = (() => {
  let container = null;
  const queue = [];
  const MAX_TOASTS = 5;

  function getContainer() {
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      container.setAttribute('role', 'log');
      container.setAttribute('aria-live', 'polite');
      container.setAttribute('aria-label', 'Notifications');
      document.body.appendChild(container);
    }
    return container;
  }

  function create(options = {}) {
    const {
      type = 'info',
      title = '',
      message = '',
      duration = 4000,
      actions = [],
      progress = null,
      dismissible = true,
      onDismiss = null,
      icon = null
    } = options;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type} animate-slide-up`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-atomic', 'true');

    const iconMap = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ'
    };
    const toastIcon = icon || iconMap[type] || '';

    let html = '';
    if (toastIcon) html += `<span class="toast-icon">${toastIcon}</span>`;
    html += '<div class="toast-content">';
    if (title) html += `<div class="toast-title">${title}</div>`;
    if (message) html += `<div class="toast-message">${message}</div>`;
    if (progress !== null) {
      html += `<div class="toast-progress"><div class="toast-progress-bar" style="width:${progress}%"></div></div>`;
    }
    if (actions.length > 0) {
      html += '<div class="toast-actions">';
      actions.forEach(action => {
        html += `<button class="btn btn-sm ${action.class || 'btn-ghost'}" data-action="${action.id}">${action.label}</button>`;
      });
      html += '</div>';
    }
    html += '</div>';

    if (dismissible) {
      html += '<button class="toast-close" aria-label="Dismiss">&times;</button>';
    }

    toast.innerHTML = html;

    const toastContainer = getContainer();
    toastContainer.appendChild(toast);

    // Limit visible toasts
    const toasts = toastContainer.querySelectorAll('.toast');
    if (toasts.length > MAX_TOASTS) {
      toasts[0].remove();
    }

    // Auto-dismiss
    let timeout;
    if (duration > 0) {
      timeout = setTimeout(() => dismiss(toast, onDismiss), duration);
    }

    // Pause on hover
    toast.addEventListener('mouseenter', () => {
      if (timeout) clearTimeout(timeout);
    });
    toast.addEventListener('mouseleave', () => {
      if (duration > 0) {
        timeout = setTimeout(() => dismiss(toast, onDismiss), duration / 2);
      }
    });

    // Close button
    toast.querySelector('.toast-close')?.addEventListener('click', () => {
      if (timeout) clearTimeout(timeout);
      dismiss(toast, onDismiss);
    });

    // Action buttons
    toast.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = actions.find(a => a.id === btn.dataset.action);
        if (action?.onClick) action.onClick();
        if (timeout) clearTimeout(timeout);
        dismiss(toast, onDismiss);
      });
    });

    return {
      el: toast,
      update: (newOptions) => {
        if (newOptions.progress !== undefined) {
          const bar = toast.querySelector('.toast-progress-bar');
          if (bar) bar.style.width = newOptions.progress + '%';
        }
        if (newOptions.message !== undefined) {
          const msg = toast.querySelector('.toast-message');
          if (msg) msg.textContent = newOptions.message;
        }
      },
      dismiss: () => {
        if (timeout) clearTimeout(timeout);
        dismiss(toast, onDismiss);
      }
    };
  }

  function dismiss(toast, onDismiss) {
    toast.style.animation = 'toastSlideOut 0.2s ease forwards';
    setTimeout(() => {
      toast.remove();
      if (onDismiss) onDismiss();
    }, 200);
  }

  function success(message, options = {}) {
    return create({ type: 'success', message, ...options });
  }

  function error(message, options = {}) {
    return create({ type: 'error', message, duration: 6000, ...options });
  }

  function warning(message, options = {}) {
    return create({ type: 'warning', message, duration: 5000, ...options });
  }

  function info(message, options = {}) {
    return create({ type: 'info', message, ...options });
  }

  function clear() {
    if (container) container.innerHTML = '';
  }

  return { create, success, error, warning, info, clear };
})();