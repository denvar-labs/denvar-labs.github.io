const Admin = (() => {
  const STORAGE_KEY = 'ka_admin_key';
  let attemptCount = 0;
  let cooldownTimer = null;

  function getStoredKey() {
    return sessionStorage.getItem(STORAGE_KEY);
  }

  function storeKey(key) {
    sessionStorage.setItem(STORAGE_KEY, key);
  }

  function clearKey() {
    sessionStorage.removeItem(STORAGE_KEY);
  }

  function buildPayload(action, extra) {
    const key = document.getElementById('admin-key')?.value || getStoredKey() || '';
    const suspKey = document.getElementById('susp-admin-key')?.value || key;
    const adminKey = action === 'suspension' ? suspKey : key;
    if (adminKey) storeKey(adminKey);
    return { action, adminKey, ...extra };
  }

  function setRateLimited() {
    attemptCount++;
    const btns = ['penalty-btn', 'susp-btn'];
    btns.forEach(id => {
      const btn = document.getElementById(id);
      if (btn) btn.disabled = true;
    });
    const wait = Math.min(30, attemptCount * 5);
    if (cooldownTimer) clearInterval(cooldownTimer);
    let remaining = wait;
    const msg = document.getElementById('rate-limit-msg') || (() => {
      const el = document.createElement('p');
      el.id = 'rate-limit-msg';
      el.style.cssText = 'color:var(--danger);font-size:0.85rem;margin-top:8px;';
      document.querySelector('.admin-box')?.appendChild(el);
      return el;
    })();
    cooldownTimer = setInterval(() => {
      msg.textContent = `Demasiados intentos. Espere ${remaining}s para reintentar.`;
      remaining--;
      if (remaining < 0) {
        clearInterval(cooldownTimer);
        cooldownTimer = null;
        msg.textContent = '';
        btns.forEach(id => {
          const btn = document.getElementById(id);
          if (btn) btn.disabled = false;
        });
        attemptCount = 0;
      }
    }, 1000);
  }

  function showError(containerId, message) {
    const el = document.getElementById(containerId);
    if (!el) return;
    el.innerHTML = `<div class="result" style="background:var(--danger-bg);color:var(--danger);padding:10px;border-radius:6px;">${escapeHtml(message)}</div>`;
    setRateLimited();
  }

  function showSuccess(containerId, message) {
    const el = document.getElementById(containerId);
    if (!el) return;
    el.innerHTML = `<div class="result" style="background:var(--success-bg);color:var(--success);padding:10px;border-radius:6px;">${escapeHtml(message)}</div>`;
    attemptCount = 0;
  }

  function requestPenaltyConfirm() {
    const playerSelect = document.getElementById('player-select');
    const playerId = document.getElementById('player-id');
    const pid = playerId?.value?.trim() || playerSelect?.value || '';
    if (!pid || pid === '') {
      showError('penalty-result', 'Seleccione o ingrese un jugador.');
      return;
    }
    document.getElementById('penalty-confirm-text').textContent =
      `Aplicar penalización de -40 Rating a ${escapeHtml(pid)}. Esta acción no se puede deshacer.`;
    document.getElementById('penalty-confirm').classList.add('visible');
    document.getElementById('penalty-btn').disabled = true;
  }

  function cancelPenaltyConfirm() {
    document.getElementById('penalty-confirm').classList.remove('visible');
    document.getElementById('penalty-btn').disabled = false;
  }

  async function applyPenalty() {
    const playerId = document.getElementById('player-id')?.value?.trim() ||
      document.getElementById('player-select')?.value || '';
    try {
      const payload = buildPayload('penalty', { playerId });
      const resp = await fetch(KA_API_BASE, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const result = await resp.json().catch(() => ({}));
      showSuccess('penalty-result', result.message || 'Penalización aplicada correctamente.');
      cancelPenaltyConfirm();
    } catch (err) {
      showError('penalty-result', 'Error al aplicar penalización. Verifique la clave e intente de nuevo.');
      console.error('[Admin] Penalty error:', err);
      cancelPenaltyConfirm();
    }
  }

  function requestSuspensionConfirm() {
    const playerSelect = document.getElementById('susp-player-select');
    const playerId = document.getElementById('susp-player-id');
    const pid = playerId?.value?.trim() || playerSelect?.value || '';
    const start = document.getElementById('susp-start')?.value;
    const end = document.getElementById('susp-end')?.value;
    const reason = document.getElementById('susp-reason')?.value?.trim();

    if (!pid) { showError('suspension-result', 'Seleccione o ingrese un jugador.'); return; }
    if (!start || !end) { showError('suspension-result', 'Complete las fechas de inicio y fin.'); return; }
    if (new Date(end) <= new Date(start)) { showError('suspension-result', 'La fecha de fin debe ser posterior a la de inicio.'); return; }
    if (!reason || reason.length < 3) { showError('suspension-result', 'Ingrese un motivo (mín. 3 caracteres).'); return; }

    document.getElementById('susp-confirm-text').textContent =
      `Suspender a ${escapeHtml(pid)} desde ${start} hasta ${end}. Motivo: ${escapeHtml(reason)}`;
    document.getElementById('susp-confirm').classList.add('visible');
    document.getElementById('susp-btn').disabled = true;
  }

  function cancelSuspensionConfirm() {
    document.getElementById('susp-confirm').classList.remove('visible');
    document.getElementById('susp-btn').disabled = false;
  }

  async function addSuspension() {
    const playerId = document.getElementById('susp-player-id')?.value?.trim() ||
      document.getElementById('susp-player-select')?.value || '';
    const start = document.getElementById('susp-start')?.value;
    const end = document.getElementById('susp-end')?.value;
    const reason = document.getElementById('susp-reason')?.value?.trim();
    try {
      const payload = buildPayload('suspension', { playerId, startDate: start, endDate: end, reason });
      const resp = await fetch(KA_API_BASE, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const result = await resp.json().catch(() => ({}));
      showSuccess('suspension-result', result.message || 'Suspensión aplicada correctamente.');
      cancelSuspensionConfirm();
    } catch (err) {
      showError('suspension-result', 'Error al aplicar suspensión. Verifique la clave e intente de nuevo.');
      console.error('[Admin] Suspension error:', err);
      cancelSuspensionConfirm();
    }
  }

  return { requestPenaltyConfirm, cancelPenaltyConfirm, applyPenalty, requestSuspensionConfirm, cancelSuspensionConfirm, addSuspension };
})();
