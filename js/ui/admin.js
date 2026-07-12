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
      msg.textContent = I18n.t('admin_rate_limit').replace('{s}', remaining);
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
      showError('penalty-result', I18n.t('admin_select_player'));
      return;
    }
    document.getElementById('penalty-confirm-text').textContent =
      I18n.t('admin_confirm_penalty').replace('{player}', escapeHtml(pid));
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
      showSuccess('penalty-result', result.message || I18n.t('admin_penalty_applied'));
      cancelPenaltyConfirm();
    } catch (err) {
      showError('penalty-result', I18n.t('admin_penalty_error'));
      console.error('[Admin] Penalty error:', err);
      cancelPenaltyConfirm();
    } finally {
      clearKey();
    }
  }

  function requestSuspensionConfirm() {
    const playerSelect = document.getElementById('susp-player-select');
    const playerId = document.getElementById('susp-player-id');
    const pid = playerId?.value?.trim() || playerSelect?.value || '';
    const start = document.getElementById('susp-start')?.value;
    const end = document.getElementById('susp-end')?.value;
    const reason = document.getElementById('susp-reason')?.value?.trim();

    if (!pid) { showError('suspension-result', I18n.t('admin_select_player')); return; }
    if (!start || !end) { showError('suspension-result', I18n.t('admin_susp_fill_dates')); return; }
    if (new Date(end) <= new Date(start)) { showError('suspension-result', I18n.t('admin_susp_end_after_start')); return; }
    if (!reason || reason.length < 3) { showError('suspension-result', I18n.t('admin_susp_enter_reason')); return; }

    document.getElementById('susp-confirm-text').textContent =
      I18n.t('admin_susp_confirm_text').replace('{player}', escapeHtml(pid)).replace('{start}', start).replace('{end}', end).replace('{reason}', escapeHtml(reason));
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
      showSuccess('suspension-result', result.message || I18n.t('admin_susp_applied'));
      cancelSuspensionConfirm();
    } catch (err) {
      showError('suspension-result', I18n.t('admin_susp_error'));
      console.error('[Admin] Suspension error:', err);
      cancelSuspensionConfirm();
    } finally {
      clearKey();
    }
  }

  return { requestPenaltyConfirm, cancelPenaltyConfirm, applyPenalty, requestSuspensionConfirm, cancelSuspensionConfirm, addSuspension };
})();
