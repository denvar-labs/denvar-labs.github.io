// =====================================================
//  KA ESPORTS – API Data Loader (v20 — Hardened with security & accessibility)
//  Requires config.js to load BEFORE this file:
//    <script src="../js/config.js"></script>
//    <script src="../js/api-loader.js"></script>
// =====================================================

const API_BASE = (typeof KA_API_BASE !== 'undefined')
  ? KA_API_BASE
  : 'https://script.google.com/macros/s/AKfycbyMYv9MCqIj4EV_p0W25WcYZnCsBXYTQyugxCVjqFgA8YYFIy66VCOWRFjWgp5l2AiO/exec';

const FETCH_TIMEOUT_MS = (typeof KA_FETCH_TIMEOUT_MS !== 'undefined') ? KA_FETCH_TIMEOUT_MS : 15000;

const HEADER_ROWS_TO_SKIP = {
  'LEADERBOARD_GLOBAL': 3,
  'PLAYERS': 1,
  'MATCHES': 2,
  'PENALTIES': 0,
  'ANTI_SMURF_LOG': 2,
  'AUDIT_LOG': 2,
  'SYSTEM_METRICS': 2,
  'SEASONS_REPORT': 2,
  'MANUAL_MATCHES': 3,
  'FAQ': 0,
  'PLAYER_H2H_DETAILS': 1,
  '_H2H_DATA': 1
};

const PENALTIES_FALLBACK_HEADERS = [
  'Timestamp', 'PlayerID', 'PlayerName', 'Reason', 'Type', 'Points', 'Month', 'StartDate', 'EndDate', 'Status'
];

const DEFAULT_SKIP = 2;

const RANK_CLASS_MAP = {
  'Grand Master': 'rank-grand-master',
  'Master': 'rank-master',
  'Pro': 'rank-pro',
  'Expert': 'rank-expert',
  'Advanced': 'rank-advanced',
  'Amateur': 'rank-amateur',
  'Padawan': 'rank-padawan'
};

const RATING_THRESHOLDS = [
  { rank: 'Grand Master', min: 2000 },
  { rank: 'Master',       min: 1800 },
  { rank: 'Pro',          min: 1600 },
  { rank: 'Expert',       min: 1400 },
  { rank: 'Advanced',     min: 1200 },
  { rank: 'Amateur',      min: 1000 },
  { rank: 'Padawan',      min: 0 }
];

const FLAG_MAP = {
  'AR': '🇦🇷', 'BO': '🇧🇴', 'BR': '🇧🇷', 'CA': '🇨🇦', 'CL': '🇨🇱',
  'CO': '🇨🇴', 'CR': '🇨🇷', 'HR': '🇭🇷', 'CU': '🇨🇺', 'DO': '🇩🇴',
  'EC': '🇪🇨', 'SV': '🇸🇻', 'GT': '🇬🇹', 'HN': '🇭🇳', 'MX': '🇲🇽',
  'NI': '🇳🇮', 'PA': '🇵🇦', 'PY': '🇵🇾', 'PE': '🇵🇪', 'PR': '🇵🇷',
  'US': '🇺🇸', 'UY': '🇺🇾', 'VE': '🇻🇪', 'ES': '🇪🇸', 'FR': '🇫🇷',
  'IT': '🇮🇹', 'PT': '🇵🇹', 'DE': '🇩🇪', 'EN': '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'GB': '🇬🇧',
  'XX': '🏁'
};

// Pre-compile regex for performance (used frequently in large loops)
const ZERO_WIDTH_CHARS_REGEX = /[\u200B-\u200D\uFEFF]/g;
const EMOJI_REGEX = /[\u{1F1E6}-\u{1F1FF}\u{1F3F4}\u{1F3C1}\u{1F6A9}\u{1F3F3}\u{1F3F4}\u{1F3F4}\u{1F3F4}\u{1F3F4}\u{1F3F4}\u{1F3F4}\u{1F3F4}\u{1F3F4}]+/gu;

function getFlagEmoji(code) {
  return FLAG_MAP[code] || '🏁';
}

function getRankFromRating(rating) {
  const r = Number(rating);
  for (const level of RATING_THRESHOLDS) {
    if (r >= level.min) return level.rank;
  }
  return 'Padawan';
}

function getRankColorHex(rank) {
  const map = {
    'Grand Master': '#f1c232',
    'Master': '#FFD966',
    'Pro': '#CCE5FF',
    'Expert': '#FF5C5C',
    'Advanced': '#FFF38A',
    'Amateur': '#9AFF7D',
    'Padawan': '#C7C1C1'
  };
  return map[rank] || '#fff';
}

// Escapes HTML to prevent layout breakage or injection from sheet data
function escapeHtml(value) {
  const str = String(value ?? '');
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Strips emoji characters from a string (prevents emoji duplication in UI)
function stripEmojis(str) {
  return String(str ?? '').replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE00}-\u{FE0F}\u{200D}\u{20E3}]/gu, '').trim();
}

// Safely convert any cell value to escaped string
// preserveEmojis: true to keep medal icons (🥇🥈🥉) in POS column
function cellToString(cell, preserveEmojis = false) {
  if (cell === null || cell === undefined) return '';
  const str = String(cell).trim();
  return preserveEmojis ? escapeHtml(str) : escapeHtml(stripEmojis(str));
}

// ===== Consistent UI state rendering (loading / error / empty) =====
function renderState(container, type, opts = {}) {
  if (!container) return;
  const { title, detail, onRetry } = opts;
  const defaultTitles = {
    loading: 'Loading…',
    error: 'Something went wrong',
    empty: 'No data available'
  };

  let inner = '';
  if (type === 'loading') {
    inner = `<div class="spinner" aria-hidden="true"></div><div class="loading-label">${escapeHtml(title || defaultTitles.loading)}</div>`;
  } else {
    const icon = type === 'error' ? '⚠️' : '📭';
    inner = `<div class="state-title">${icon} ${escapeHtml(title || defaultTitles[type] || '')}</div>`;
  }
  if (detail) {
    inner += `<div class="state-detail">${escapeHtml(detail)}</div>`;
  }
  if (type === 'error' && typeof onRetry === 'function') {
    const retryId = 'retry-' + Math.random().toString(36).slice(2, 9);
    inner += `<button class="retry-btn" id="${retryId}" aria-label="Retry loading data">Retry</button>`;
    container.innerHTML = `<div class="state-box state-${type}" role="alert" aria-live="polite">${inner}</div>`;
    const btn = document.getElementById(retryId);
    if (btn) btn.addEventListener('click', onRetry);
    return;
  }

  container.innerHTML = `<div class="state-box state-${type}" role="status" aria-live="polite">${inner}</div>`;
}

// Same as renderState but for table <tbody> (single <tr><td colspan></td></tr>)
function renderTableState(tbody, colspan, type, opts = {}) {
  if (!tbody) return;
  const { title, detail } = opts;
  const defaultTitles = {
    loading: 'Loading…',
    error: '⚠️ Could not load data',
    empty: 'No data available.'
  };
  const text = escapeHtml(title || defaultTitles[type] || '');
  const detailHtml = detail ? `<br><small>${escapeHtml(detail)}</small>` : '';
  if (type === 'loading') {
    tbody.innerHTML = `<tr><td colspan="${colspan}" style="text-align:center; padding:40px 20px;" role="status"><div class="spinner" style="margin:0 auto 12px;" aria-hidden="true"></div><div class="loading-label">${text}</div>${detailHtml}</td></tr>`;
  } else {
    tbody.innerHTML = `<tr><td colspan="${colspan}" style="text-align:center; padding:24px; color:var(--text-muted);" role="status">${text}${detailHtml}</td></tr>`;
  }
}

// ===== Fetch with real timeout (prevents infinite spinners) =====
async function fetchWithTimeout(url, options = {}, timeoutMs = FETCH_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    return response;
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('Request timed out. The server is not responding. Please try again in a moment.');
    }
    throw new Error('Network error: could not reach the data server. Check your connection and try again.');
  } finally {
    clearTimeout(timer);
  }
}

// ===== Session memory cache (prevents redundant refetches) =====
const _sheetCache = new Map();
const _fetchPromises = new Map();
const SHEET_CACHE_TTL_MS = 60 * 1000; // 60 seconds

async function fetchSheetData(sheetName, ttl = 60000) {
  const cached = _sheetCache.get(sheetName);
  if (cached && (Date.now() - cached.time) < ttl) {
    return cached.data;
  }

  if (_fetchPromises.has(sheetName)) {
    return _fetchPromises.get(sheetName);
  }

  const url = `${API_BASE}?sheet=${encodeURIComponent(sheetName)}`;

  const promise = (async () => {
    const delays = [2000, 5000];
    for (let attempt = 0; attempt <= delays.length; attempt++) {
      try {
        const response = await fetchWithTimeout(url);
        if (!response.ok) throw new Error(`HTTP ${response.status} while loading "${sheetName}". Try refreshing the page.`);

        let json;
        try {
          json = await response.json();
        } catch (e) {
          throw new Error(`Invalid server response while loading "${sheetName}". Please try again.`);
        }

        if (json.error) throw new Error(json.error);
        const data = json.data || [];
        _sheetCache.set(sheetName, { data, time: Date.now() });
        return data;
      } catch (err) {
        const isRetryable = err.message.startsWith('Request timed out') || err.message.startsWith('Network error');
        if (!isRetryable || attempt === delays.length) throw err;
        await new Promise(r => setTimeout(r, delays[attempt]));
      }
    }
  })();

  _fetchPromises.set(sheetName, promise);
  promise.finally(() => _fetchPromises.delete(sheetName));
  return promise;
}

function invalidateSheetCache(sheetName) {
  if (sheetName) _sheetCache.delete(sheetName);
  else _sheetCache.clear();
}

// ===== Cache for inactive player names (with expiration) =====
let inactiveNamesPromise = null;
let inactiveNamesCacheTime = null;
const INACTIVE_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function getInactivePlayerNames() {
  const now = Date.now();
  if (inactiveNamesPromise && inactiveNamesCacheTime && (now - inactiveNamesCacheTime) < INACTIVE_CACHE_TTL_MS) {
    return inactiveNamesPromise;
  }

  inactiveNamesPromise = (async () => {
    try {
      const players = await fetchSheetData('PLAYERS');
      if (players.length < 2) return new Set();
      const header = players[0].map(h => (h || '').toString().trim());
      console.log('[DEBUG] PLAYERS header:', header);
      const nameIdx = header.indexOf('Name');
      const activeIdx = header.indexOf('Active');
      console.log('[DEBUG] nameIdx:', nameIdx, 'activeIdx:', activeIdx);
      if (nameIdx === -1 || activeIdx === -1) return new Set();
      const inactiveNames = new Set();
      for (let i = 1; i < players.length; i++) {
        const row = players[i];
        const status = (row[activeIdx] || '').toString().trim().toUpperCase();
        const name = (row[nameIdx] || '').toString().trim();
        if (status === 'INACTIVE') {
          console.log('[DEBUG] INACTIVE row:', name, '| status:', status);
          if (name) inactiveNames.add(name);
        }
      }
      return inactiveNames;
    } catch (e) {
      console.error('Error fetching inactive players:', e);
      return new Set();
    }
  })();
  
  inactiveNamesCacheTime = now;
  return inactiveNamesPromise;
}

function resetInactivePlayerCache() {
  inactiveNamesPromise = null;
  inactiveNamesCacheTime = null;
}

function extractPlayerName(cell) {
  if (!cell) return '';
  return cell
    .replace(/[\u{1F1E6}-\u{1F1FF}]{2,}/gu, '')
    .replace(/[\u{1F300}-\u{1F9FF}]/gu, '')
    .replace(/[\u{2600}-\u{26FF}]/gu, '')
    .replace(/[\u{2700}-\u{27BF}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// ===== Shared column finding utility =====
function findPlayerColumn(headerRow) {
  return findColumnIndex(headerRow, ['Player', 'Name']);
}

// Robust header index lookup: exact match → case-insensitive → starts with
function findColumnIndex(header, candidates) {
  const list = Array.isArray(candidates) ? candidates : [candidates];
  for (const name of list) {
    const idx = header.indexOf(name);
    if (idx !== -1) return idx;
  }
  const lowerHeader = header.map(h => h.toLowerCase());
  for (const name of list) {
    const idx = lowerHeader.indexOf(name.toLowerCase());
    if (idx !== -1) return idx;
  }
  return -1;
}

// ===== TABLE RENDERER =====
function detectHeaderRow(allRows, isMatchReport = false) {
  for (let i = 0; i < Math.min(allRows.length, 10); i++) {
    const row = allRows[i].map(cell => (cell || '').toString().trim());
    if (isMatchReport && row.some(cell => cell.toLowerCase().includes('player'))) {
      return i;
    }
    const nonEmpty = row.filter(cell => cell.length > 0).length;
    if (nonEmpty >= 3) return i;
  }
  return -1;
}

async function loadTableFromSheet(sheetName, tableId, rankColumnIndex = 5) {
  const table = document.getElementById(tableId);
  if (!table) return;
  const thead = table.querySelector('thead');
  const tbody = table.querySelector('tbody');
  if (!thead || !tbody) return;

  const colCount = Math.max(thead.querySelectorAll('th').length, 20) || 20;
  renderTableState(tbody, colCount, 'loading', { skeletonRows: 7 });

  try {
    const allRows = await fetchSheetData(sheetName);
    if (allRows.length === 0) {
      renderTableState(tbody, colCount, 'empty');
      return;
    }

    const isMatchReport = sheetName.startsWith('MATCH_REPORTS_');
    const hasNoHeaderRow = sheetName === 'PENALTIES';

    let headerRow = [];
    let dataStartIndex = 0;

    if (hasNoHeaderRow) {
      headerRow = PENALTIES_FALLBACK_HEADERS.slice();
      dataStartIndex = 0;
    } else {
      const detectedIndex = detectHeaderRow(allRows, isMatchReport);
      const headerRowIndex = detectedIndex >= 0 ? detectedIndex : (HEADER_ROWS_TO_SKIP[sheetName] || (isMatchReport ? 3 : DEFAULT_SKIP)) - 1;
      if (headerRowIndex >= 0 && allRows.length > headerRowIndex) {
        headerRow = allRows[headerRowIndex].map(h => (h || '').toString().replace(ZERO_WIDTH_CHARS_REGEX, '').trim());
      }
      dataStartIndex = headerRowIndex + 1;
    }

    thead.innerHTML = headerRow.length ? '<tr>' + headerRow.map(h => `<th>${escapeHtml(h)}</th>`).join('') + '</tr>' : '';

    // Expose headerRow globally for table-enhance module
    window.__TABLE_HEADER_ROW__ = headerRow;

    let dataRows = allRows.slice(dataStartIndex).filter(row => {
      const firstCell = (row[0] || '').toString().trim();
      return firstCell !== '---' && firstCell !== '' && firstCell !== 'undefined';
    });

    const playerColIndex = findPlayerColumn(headerRow);
    if (playerColIndex !== -1) {
      const inactiveNames = await getInactivePlayerNames();
      if (inactiveNames.size > 0) {
        dataRows = dataRows.filter(row => {
          const rawName = (row[playerColIndex] || '').toString().trim();
          const cleanName = extractPlayerName(rawName);
          return !inactiveNames.has(cleanName);
        });
      }
    }

    if (dataRows.length === 0) {
      renderTableState(tbody, Math.max(headerRow.length, colCount), 'empty');
      return;
    }

    const percentColumns = new Set();
    headerRow.forEach((h, idx) => {
      if (h.includes('%')) percentColumns.add(idx);
    });

    let ratingBeforeColIndex = -1, deltaColIndex = -1;
    if (isMatchReport) {
      ratingBeforeColIndex = headerRow.findIndex(h => h.includes('Rating Before'));
      deltaColIndex = headerRow.findIndex(h => h.includes('Δ') || h.includes('Rating Change') || h === 'Δ Rating');
    }

    let leaderboardPlayerColIdx = -1, leaderboardRankColIdx = -1;
    if (!isMatchReport) {
      leaderboardPlayerColIdx = findPlayerColumn(headerRow);
      leaderboardRankColIdx = rankColumnIndex >= 0 ? rankColumnIndex : findColumnIndex(headerRow, ['Rank']);
    }

    tbody.innerHTML = dataRows.map(row => {
      let rowHTML = `<tr>`;
      row.forEach((cell, colIdx) => {
        let display = cellToString(cell);
        if (percentColumns.has(colIdx) && typeof cell === 'number') {
          display = (cell * 100).toFixed(1) + '%';
        } else if (typeof cell === 'number' && !Number.isInteger(cell)) {
          display = parseFloat(cell.toFixed(2));
        }

        let cellStyle = '';

        if (isMatchReport) {
          if (colIdx === playerColIndex && ratingBeforeColIndex >= 0) {
            const ratingBefore = parseFloat(row[ratingBeforeColIndex]);
            if (!isNaN(ratingBefore)) {
              const rank = getRankFromRating(ratingBefore);
              const cssClass = RANK_CLASS_MAP[rank] || '';
              cellStyle = ` class="${cssClass}"`;
            }
          }
          if (colIdx === deltaColIndex && typeof cell === 'number') {
            if (cell > 0) cellStyle = ' class="delta-positive"';
            else if (cell < 0) cellStyle = ' class="delta-negative"';
          }
        } else {
          if (colIdx === leaderboardPlayerColIdx || colIdx === leaderboardRankColIdx) {
            const rankValue = leaderboardRankColIdx >= 0 ? String(row[leaderboardRankColIdx] || '').trim() : '';
            const cssClass = RANK_CLASS_MAP[rankValue] || '';
            if (cssClass) cellStyle = ` class="${cssClass}"`;
          }
        }

        const label = headerRow[colIdx] ? ` data-label="${escapeHtml(headerRow[colIdx])}"` : '';
        rowHTML += `<td${cellStyle}${label}>${display}</td>`;
      });
      rowHTML += '</tr>';
      return rowHTML;
    }).join('');
  } catch (err) {
    console.error(`Error loading sheet "${sheetName}":`, err);
    renderTableState(tbody, colCount, 'error', { detail: err.message });
  }
}

// ========== SEASONS REPORT RENDERER ==========
function formatSeasonDate(dateStr) {
  const s = String(dateStr || '').trim();
  const m = s.match(/^(\d{4})-(\d{2})/);
  if (!m) return s;
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const monthName = months[parseInt(m[2], 10) - 1] || m[2];
  return monthName + ' ' + m[1];
}

async function loadSeasonsReport(tableId) {
  const table = document.getElementById(tableId);
  if (!table) return;
  const thead = table.querySelector('thead');
  const tbody = table.querySelector('tbody');
  if (!thead || !tbody) return;

  renderTableState(tbody, 3, 'loading', { skeletonRows: 7 });

  try {
    const allRows = await fetchSheetData('SEASONS_REPORT');
    if (allRows.length === 0) { renderTableState(tbody, 3, 'empty'); return; }

    const detectedIndex = detectHeaderRow(allRows, false);
    const headerRowIndex = detectedIndex >= 0 ? detectedIndex : (HEADER_ROWS_TO_SKIP['SEASONS_REPORT'] || 2) - 1;
    const headerRow = allRows[headerRowIndex] || [];
    const dataRows = allRows.slice(headerRowIndex + 1).filter(r => {
      const first = (r[0] || '').toString().trim();
      return first && first !== '---' && first !== 'undefined';
    });

    const seasonCol = 0, matchesCol = 1, playersCol = 2;
    const th = ['SEASON', 'TOTAL MATCHES', 'TOTAL PLAYERS'];
    thead.innerHTML = '<tr>' + th.map(h => '<th>' + h + '</th>').join('') + '</tr>';

    let totalMatches = 0, totalPlayers = 0;

    tbody.innerHTML = dataRows.map(row => {
      const rawDate = (row[seasonCol] || '').toString().trim();
      const matches = parseInt(row[matchesCol], 10) || 0;
      const players = parseInt(row[playersCol], 10) || 0;
      totalMatches += matches;
      totalPlayers += players;
      const seasonLabel = formatSeasonDate(rawDate);
      return `<tr>
        <td data-label="Season"><strong>${seasonLabel}</strong></td>
        <td data-label="Total Matches">${matches}</td>
        <td data-label="Total Players">${players}</td>
      </tr>`;
    }).join('');

    if (dataRows.length > 0) {
      const avgPlayers = Math.round(totalPlayers / dataRows.length);
      tbody.innerHTML += `<tr class="seasons-total-row">
        <td><strong>TOTAL / AVG</strong></td>
        <td><strong>${totalMatches}</strong></td>
        <td><strong>~${avgPlayers}</strong></td>
      </tr>`;
    }
  } catch (err) {
    console.error('Error loading seasons report:', err);
    renderTableState(tbody, 3, 'error', { detail: err.message });
  }
}

// ========== MATCH REPORTS RENDERER ==========
async function renderMatchReports(sheetName, containerId) {
  console.log('[DEBUG] renderMatchReports called:', sheetName, containerId);
  const container = document.getElementById(containerId);
  if (!container) return;
  renderState(container, 'loading', { title: 'Loading match reports…' });

  try {
    const allRows = await fetchSheetData(sheetName);
    if (allRows.length === 0) {
      renderState(container, 'empty', { title: 'No match data for this month.' });
      return;
    }

    const cleanRows = allRows.map(row => row.map(cell => (cell || '').toString().replace(ZERO_WIDTH_CHARS_REGEX, '').trim()));
    const inactiveNames = await getInactivePlayerNames();
    console.log('[DEBUG] inactiveNames size:', inactiveNames.size, 'names:', [...inactiveNames]);
    console.log('[DEBUG] total rows:', cleanRows.length);

    const matchStartIndices = [];
    for (let i = 0; i < cleanRows.length; i++) {
      if (cleanRows[i][0] && cleanRows[i][0].startsWith('## Match ID:')) {
        matchStartIndices.push(i);
      }
    }

    if (matchStartIndices.length === 0) {
      renderState(container, 'empty', { title: 'No matches found in this sheet.' });
      return;
    }

    let html = '';
    for (let idx = 0; idx < matchStartIndices.length; idx++) {
      const start = matchStartIndices[idx];
      const end = (idx < matchStartIndices.length - 1) ? matchStartIndices[idx + 1] : cleanRows.length;
      const block = cleanRows.slice(start, end);

      const matchIdRow = block[0];
      const matchId = escapeHtml(matchIdRow[0].replace('## Match ID:', '').trim());
      const dateQualityRow = block[1] ? block[1][0] : '';
      let date = '', quality = '';
      if (dateQualityRow) {
        const dateMatch = dateQualityRow.match(/\*\*Date:\*\*\s*(.*?)\s*\|/);
        const qualityMatch = dateQualityRow.match(/\*\*Quality:\*\*\s*(.*)/);
        if (dateMatch) date = escapeHtml(dateMatch[1].trim());
        if (qualityMatch) quality = escapeHtml(qualityMatch[1].trim());
      }

      let headerRow = null;
      let dataStart = 0;
      for (let j = 0; j < block.length; j++) {
        const row = block[j];
        if (row.some(cell => cell.toLowerCase().includes('player'))) {
          headerRow = row;
          dataStart = j + 1;
          break;
        }
      }
      if (!headerRow) continue;

      let dataRows = [];
      for (let j = dataStart; j < block.length; j++) {
        const row = block[j];
        if (row[0] === '---' || row[0] === '') break;
        dataRows.push(row);
      }

      const playerColIndex = findPlayerColumn(headerRow);
      if (playerColIndex !== -1 && inactiveNames.size > 0) {
        const hasInactive = dataRows.some(row => {
          const rawName = (row[playerColIndex] || '').toString().trim();
          const cleanName = extractPlayerName(rawName);
          return inactiveNames.has(cleanName);
        });
        if (hasInactive) continue;
      }

      if (dataRows.length === 0) continue;

      const ratingBeforeColIndex = headerRow.findIndex(h => h === 'Rating Before Match');
      const deltaColIndex = headerRow.findIndex(h => h === 'Δ Rating');

      const colClasses = {
        'Player': 'col-player',
        'Points': 'col-points align-right',
        'Pos': 'col-pos',
        'Rating Before Match': 'col-rating-before align-right',
        'RD Before Match': 'col-rd-before align-right',
        'Δ Rating': 'col-delta align-right',
        'New Rating': 'col-new-rating align-right',
        'New RD': 'col-new-rd align-right'
      };

      html += '<div style="margin-bottom:30px;">';
      html += `<h3 style="margin:0 0 5px;">Match ID: ${matchId}</h3>`;
      html += `<p style="margin:0 0 10px; color:var(--text-muted);"><strong>Date:</strong> ${date} | <strong>Quality:</strong> ${quality}</p>`;
      html += '<div class="table-responsive"><table class="data-table match-report-table"><thead><tr>';
      headerRow.forEach(h => {
        const colClass = colClasses[h] || '';
        html += `<th class="${colClass}">${escapeHtml(h)}</th>`;
      });
      html += '</tr></thead><tbody>';

      dataRows.forEach(row => {
        html += '<tr>';
        row.forEach((cell, colIdx) => {
          const headerName = headerRow[colIdx] || '';
          const colClass = colClasses[headerName] || '';
          const isPos = headerName === 'Pos';
          let display = cellToString(cell, isPos);
          let cellStyle = '';

          const numVal = parseFloat(cell);
          const isNumber = !isNaN(numVal) && String(cell).trim() !== '';

          if (colIdx === deltaColIndex && isNumber) {
            display = numVal.toFixed(2);
            if (numVal > 0) cellStyle += ' delta-positive';
            else if (numVal < 0) cellStyle += ' delta-negative';
          } else if (isNumber && !Number.isInteger(numVal) && colIdx !== ratingBeforeColIndex) {
            display = numVal.toFixed(2);
          }

          if (colIdx === playerColIndex && ratingBeforeColIndex >= 0) {
            const ratingBefore = parseFloat(row[ratingBeforeColIndex]);
            if (!isNaN(ratingBefore)) {
              const rank = getRankFromRating(ratingBefore);
              cellStyle += ` ${RANK_CLASS_MAP[rank] || ''}`;
            }
          }

          html += `<td class="${colClass}${cellStyle}" data-label="${escapeHtml(headerName)}">${display}</td>`;
        });
        html += '</tr>';
      });

      html += '</tbody></table></div></div>';
    }

    container.innerHTML = html || '<div class="state-box state-empty"><div class="state-title">No matches found.</div></div>';
  } catch (err) {
    console.error(err);
    renderState(container, 'error', { detail: err.message, onRetry: () => renderMatchReports(sheetName, containerId) });
  }
}

// ===== HELPERS =====
async function fetchSheetList() {
  const url = `${API_BASE}?list=1`;
  const response = await fetchWithTimeout(url);
  if (!response.ok) throw new Error(`HTTP ${response.status} while listing sheets`);
  
  let json;
  try {
    json = await response.json();
  } catch (e) {
    throw new Error('Invalid server response while listing sheets.');
  }
  
  return json.sheets || [];
}

async function fetchPlayerMatchHistory(playerName) {
  const sheets = await fetchSheetList();
  const matchSheets = sheets.filter(s => s.startsWith('MATCH_REPORTS_')).sort().reverse().slice(0, 3);
  if (matchSheets.length === 0) return [];
  const allData = await Promise.all(matchSheets.map(s => fetchSheetData(s)));
  const results = [];
  for (let si = 0; si < allData.length; si++) {
    const rows = allData[si];
    if (!rows || rows.length === 0) continue;
    const clean = rows.map(row => row.map(c => (c || '').toString().replace(ZERO_WIDTH_CHARS_REGEX, '').trim()));
    const matchStarts = [];
    for (let i = 0; i < clean.length; i++) {
      if (clean[i][0] && clean[i][0].startsWith('## Match ID:')) matchStarts.push(i);
    }
    for (let mi = 0; mi < matchStarts.length; mi++) {
      const start = matchStarts[mi];
      const end = mi < matchStarts.length - 1 ? matchStarts[mi + 1] : clean.length;
      const block = clean.slice(start, end);
      const matchId = (block[0][0] || '').replace('## Match ID:', '').trim();
      const dateRow = block[1] ? block[1][0] : '';
      let date = '';
      const dm = dateRow.match(/\*\*Date:\*\*\s*(.*?)\s*\|/);
      if (dm) date = dm[1].trim();
      let headerRow = null, dataStart = 0;
      for (let j = 0; j < block.length; j++) {
        if (block[j].some(c => c.toLowerCase().includes('player'))) { headerRow = block[j]; dataStart = j + 1; break; }
      }
      if (!headerRow) continue;
      const playerIdx = headerRow.findIndex(h => h.toLowerCase().includes('player'));
      const posIdx = headerRow.findIndex(h => h === 'Pos');
      const ptsIdx = headerRow.findIndex(h => h === 'Points');
      const deltaIdx = headerRow.findIndex(h => h === 'Δ Rating');
      const ratingIdx = headerRow.findIndex(h => h === 'Rating Before Match' || h === 'New Rating');
      const dataRows = [];
      for (let j = dataStart; j < block.length; j++) {
        if (block[j][0] === '---' || block[j][0] === '') break;
        dataRows.push(block[j]);
      }
      const playerRow = dataRows.find(r => {
        const raw = (r[playerIdx] || '').toString().replace(/[\u{1F1E6}-\u{1F1FF}]/gu, '').trim();
        return raw === playerName || raw.includes(playerName);
      });
      if (!playerRow) continue;
      const pos = posIdx >= 0 ? cellToString(playerRow[posIdx], true) : '';
      const pts = ptsIdx >= 0 ? parseInt(playerRow[ptsIdx]) || 0 : 0;
      const delta = deltaIdx >= 0 ? parseFloat(playerRow[deltaIdx]) : null;
      const rating = ratingIdx >= 0 ? parseFloat(playerRow[ratingIdx]) : null;
      const opponents = dataRows.filter(r => r !== playerRow).map(r => {
        const name = (r[playerIdx] || '').toString().replace(/[\u{1F1E6}-\u{1F1FF}]/gu, '').trim();
        const opPts = ptsIdx >= 0 ? parseInt(r[ptsIdx]) || 0 : 0;
        return { name, pts: opPts };
      });
      const posNum = parseInt(pos) || 0;
      results.push({ matchId, date, pos, posNum, pts, delta, rating, opponents, sheet: matchSheets[si] });
    }
  }
  results.sort((a, b) => {
    const da = new Date(a.date), db = new Date(b.date);
    if (!isNaN(da.getTime()) && !isNaN(db.getTime())) return da - db;
    return 0;
  });
  return results;
}

async function populateMonthSelector(selectId, prefix) {
  const select = document.getElementById(selectId);
  if (!select) return;
  try {
    const allSheets = await fetchSheetList();
    const filtered = allSheets.filter(name => name.startsWith(prefix)).sort().reverse();
    select.innerHTML = '<option value="">-- Select a month --</option>';
    filtered.forEach(name => {
      const display = name.replace(prefix, '').replace(/_/g, '-');
      const option = document.createElement('option');
      option.value = name;
      option.textContent = display;
      select.appendChild(option);
    });
    if (filtered.length === 0) {
      select.innerHTML = '<option value="">No seasons found</option>';
    }
  } catch (err) {
    console.error('Error populating month selector:', err);
    select.innerHTML = '<option value="">⚠️ Error loading months</option>';
  }
}

function populateSelectFromList(selectId, items, defaultText = '-- Select --') {
  const select = document.getElementById(selectId);
  if (!select) return;
  select.innerHTML = `<option value="">${escapeHtml(defaultText)}</option>`;
  items.forEach(item => {
    const opt = document.createElement('option');
    opt.value = item;
    opt.textContent = item;
    select.appendChild(opt);
  });
}

async function fetchPlayerNames() {
  try {
    const playersSheet = await fetchSheetData('PLAYERS');
    if (playersSheet.length < 2) return [];
    const header = playersSheet[0].map(h => (h || '').toString().replace(ZERO_WIDTH_CHARS_REGEX, '').trim());
    const nameCol = header.indexOf('Name');
    const activeCol = header.indexOf('Active');
    if (nameCol === -1) return [];
    const dataRows = playersSheet.slice(1);
    const names = dataRows
      .filter(row => {
        if (activeCol === -1) return true;
        const status = (row[activeCol] || '').toString().trim().toUpperCase();
        return status === 'ACTIVE';
      })
      .map(row => row[nameCol])
      .filter(Boolean);
    return [...new Set(names)].sort();
  } catch (err) {
    console.error('Error fetching player names:', err);
    return [];
  }
}

async function loadPlainText(sheetName, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  renderState(container, 'loading');
  try {
    const allRows = await fetchSheetData(sheetName);
    if (!allRows.length) {
      renderState(container, 'empty', { title: 'No content found.' });
      return;
    }
    const lines = allRows.map(row => row[0] || '').filter(line => line.trim() !== '');
    container.innerHTML = lines.map(line => `<p>${escapeHtml(line)}</p>`).join('');
  } catch (err) {
    renderState(container, 'error', { detail: err.message, onRetry: () => loadPlainText(sheetName, containerId) });
  }
}

// ===== Sidebar loader + active-link highlighting (shared across all pages) =====
let sidebarInitialized = false;

function initSidebar() {
  if (sidebarInitialized) return;
  sidebarInitialized = true;

  const target = document.getElementById('sidebar-container');
  if (!target) return;

  const segments = window.location.pathname.split('/').filter(Boolean);
  const depth = Math.max(segments.length - 1, 0);
  const prefix = '../'.repeat(depth);
  const cacheKey = 'ka_sidebar_html';
  const cacheTTL = 3600000;

  const cached = localStorage.getItem(cacheKey);
  if (cached) {
    try {
      const { html, ts } = JSON.parse(cached);
      if (Date.now() - ts < cacheTTL) {
        target.innerHTML = html;
        highlightActiveSidebarLink();
        if (typeof I18n !== 'undefined') I18n.translatePage();
        return;
      }
    } catch (e) { /* ignore corrupt cache */ }
  }

  fetch(`${prefix}sidebar.html`)
    .then(r => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.text();
    })
    .then(html => {
      target.innerHTML = html;
      localStorage.setItem(cacheKey, JSON.stringify({ html, ts: Date.now() }));
      highlightActiveSidebarLink();
      if (typeof I18n !== 'undefined') I18n.translatePage();
    })
    .catch(err => {
      console.error('Error loading sidebar:', err);
      target.innerHTML = '<div class="panel"><p style="color:var(--text-muted);font-size:13px;">Menu unavailable.</p></div>';
    });
}

function highlightActiveSidebarLink() {
  const current = window.location.pathname.replace(/\/+$/, '').split('/').pop() || 'index.html';
  document.querySelectorAll('.quick-links a').forEach(a => {
    const href = (a.getAttribute('href') || '').split('/').pop();
    if (href === current) {
      a.classList.add('active');
      a.setAttribute('aria-current', 'page');
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSidebar);
} else {
  initSidebar();
}
