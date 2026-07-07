// Toast notification system
function showToast(message, type = 'info', duration = 4000) {
  const container = getOrCreateToastContainer();
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span>${message}</span><button aria-label="Dismiss">×</button>`;
  container.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('show'));
  const close = () => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 200); };
  toast.querySelector('button').addEventListener('click', close);
  setTimeout(close, duration);
}

function getOrCreateToastContainer() {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  return container;
}