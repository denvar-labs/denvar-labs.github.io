// =====================================================
//  KA ESPORTS – Player Following Module
//  localStorage-based follow/unfollow system
// =====================================================

const KaFollows = (() => {
  const STORAGE_KEY = 'ka_followed_players';
  const EVENT_NAME = 'ka:follow-changed';

  function getAll() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch { return []; }
  }

  function save(list) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { followed: list } }));
  }

  function isFollowing(playerName) {
    return getAll().some(p => p.name === playerName);
  }

  function add(playerName) {
    const list = getAll();
    if (!list.some(p => p.name === playerName)) {
      list.push({ name: playerName, followedAt: new Date().toISOString() });
      save(list);
    }
  }

  function remove(playerName) {
    save(getAll().filter(p => p.name !== playerName));
  }

  function toggle(playerName) {
    if (isFollowing(playerName)) { remove(playerName); return false; }
    add(playerName); return true;
  }

  function onChange(cb) {
    window.addEventListener(EVENT_NAME, (e) => cb(e.detail.followed));
  }

  function createButton(playerName) {
    const btn = document.createElement('button');
    btn.className = 'follow-btn';
    btn.setAttribute('aria-label', isFollowing(playerName) ? 'Unfollow ' + playerName : 'Follow ' + playerName);
    btn.setAttribute('aria-pressed', isFollowing(playerName));
    btn.innerHTML = '<i class="ph ' + (isFollowing(playerName) ? 'ph-heart-fill' : 'ph-heart') + '" aria-hidden="true"></i>';
    btn.addEventListener('click', () => {
      const nowFollowing = toggle(playerName);
      btn.className = 'follow-btn' + (nowFollowing ? ' following' : '');
      btn.innerHTML = '<i class="ph ' + (nowFollowing ? 'ph-heart-fill' : 'ph-heart') + '" aria-hidden="true"></i>';
      btn.setAttribute('aria-label', nowFollowing ? 'Unfollow ' + playerName : 'Follow ' + playerName);
      btn.setAttribute('aria-pressed', nowFollowing);
    });
    if (isFollowing(playerName)) btn.classList.add('following');
    return btn;
  }

  return { getAll, isFollowing, add, remove, toggle, onChange, createButton };
})();
