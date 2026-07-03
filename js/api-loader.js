// =====================================================
//  KA ESPORTS – API Data Loader (v19 — Professional hardened build)
//  Requiere que config.js se cargue ANTES que este archivo:
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
  // PENALTIES has NO header row — raw data starts at row 1.
  // Setting this to 0 tells loadTableFromSheet to treat row index -1
  // (i.e. no header consumption) and use PENALTIES_FALLBACK_HEADERS below.
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

// Confirmed real column layout of PENALTIES (no header row in the sheet):
// [Timestamp, PlayerID, PlayerName, Reason, Type, Points, Month, StartDate, EndDate, Status, (extra)]
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

// Escapa HTML para evitar que datos con < > & rompan el layout o
// permitan inyección si algún día una celda del Sheet contiene HTML.
function escapeHtml(value) {
  const str = String(value ?? '');
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// ----- UI de estado consistente (loading / error / empty) -----
// Reemplaza los innerHTML ad-hoc de "Loading…" / "Error: ..." por
// una única función reusada en todas las páginas.
function renderState(container, type, opts = {}) {
  if (!container) return;
  const { title, detail, onRetry } = opts;
  const icons = { loading: '', error: '⚠️', empty: '📭' };
  const defaultTitles = {
    loading: 'Loading…',
    error: 'Something went wrong',
    empty: 'No data available'
  };

  let inner = '';
  if (type === 'loading') {
    inner = `<div class="spinner" aria-hidden="true"></div><div class="state-title">${escapeHtml(title || defaultTitles.loading)}</div>`;
  } else {
    inner = `<div class="state-title">${icons[type] || ''} ${escapeHtml(title || defaultTitles[type] || '')}</div>`;
  }
  if (detail) {
    inner += `<div class="state-detail">${escapeHtml(detail)}</div>`;
  }
  if (type === 'error' && typeof onRetry === 'function') {
    const retryId = 'retry-' + Math.random().toString(36).slice(2, 9);
    inner += `<button class="retry-btn" id="${retryId}">Reintentar</button>`;
    container.innerHTML = `<div class="state-box state-${type}" role="${type === 'error' ? 'alert' : 'status'}">${inner}</div>`;
    const btn = document.getElementById(retryId);
    if (btn) btn.addEventListener('click', onRetry);
    return;
  }

  container.innerHTML = `<div class="state-box state-${type}" role="${type === 'error' ? 'alert' : 'status'}">${inner}</div>`;
}

// Igual que renderState pero para usar dentro de <tbody> de una tabla
// (una sola <tr><td colspan></td></tr> con el mismo look).
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
  tbody.innerHTML = `<tr><td colspan="${colspan}" style="text-align:center; padding:24px; color:var(--text-muted);">${text}${detailHtml}</td></tr>`;
}

// ----- fetch con timeout real (evita spinners infinitos) -----
async function fetchWithTimeout(url, options = {}, timeoutMs = FETCH_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    return response;
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('The server took too long to respond. Please try again.');
    }
    throw new Error('Network error: could not reach the data server. Check your connection.');
  } finally {
    clearTimeout(timer);
  }
}

// ----- Cache en memoria por sesión (evita refetch redundante) -----
const _sheetCache = new Map();
const SHEET_CACHE_TTL_MS = 60 * 1000; // 60s

async function fetchSheetData(sheetName, opts = {}) {
  const bypassCache = opts.bypassCache === true;
  const cached = _sheetCache.get(sheetName);
  if (!bypassCache && cached && (Date.now() - cached.time) < SHEET_CACHE_TTL_MS) {
    return cached.data;
  }

  const url = `${API_BASE}?sheet=${encodeURIComponent(sheetName)}`;
  const response = await fetchWithTimeout(url);
  if (!response.ok) throw new Error(`HTTP ${response.status} while loading "${sheetName}"`);
  const json = await response.json();
  if (json.error) throw new Error(json.error);
  const data = json.data || [];
  _sheetCache.set(sheetName, { data, time: Date.now() });
  return data;
}

function invalidateSheetCache(sheetName) {
  if (sheetName) _sheetCache.delete(sheetName);
  else _sheetCache.clear();
}

// ----- Cache for inactive player names -----
let inactiveNamesPromise = null;
function getInactivePlayerNames() {
  if (!inactiveNamesPromise) {
    inactiveNamesPromise = (async () => {
      try {
        const players = await fetchSheetData('PLAYERS');
        if (players.length < 2) return new Set();
        const header = players[0].map(h => (h || '').toString().trim());
        const nameIdx = header.indexOf('Name');
        const activeIdx = header.indexOf('Active');
        if (nameIdx === -1 || activeIdx === -1) return new Set();
        const inactiveNames = new Set();
        for (let i = 1; i < players.length; i++) {
          const row = players[i];
          const status = (row[activeIdx] || '').toString().trim().toUpperCase();
          if (status === 'INACTIVE') {
            const name = (row[nameIdx] || '').toString().trim();
            if (name) inactiveNames.add(name);
          }
        }
        return inactiveNames;
      } catch (e) {
        console.error('Error fetching inactive players:', e);
        return new Set();
      }
    })();
  }
  return inactiveNamesPromise;
}

function resetInactivePlayerCache() {
  inactiveNamesPromise = null;
}

function extractPlayerName(cell) {
  if (!cell) return '';
  return cell.replace(/[\u{1F1E6}-\u{1F1FF}\u{1F3F4}\u{1F3C1}\u{1F6A9}\u{1F3F3}\u{1F3F4}\u{1F3F4}\u{1F3F4}\u{1F3F4}\u{1F3F4}\u{1F3F4}\u{1F3F4}\u{1F3F4}]+/gu, '').trim();
}

// ----- Robust header index lookup: exact match, then case-insensitive,
// then "starts with" — helps survive minor renames in the Sheet without
// silently breaking (e.g. "Player" vs "player" vs "Player Name"). -----
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

// ----- TABLE RENDERER -----
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
  renderTableState(tbody, colCount, 'loading');

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
      // PENALTIES: no header row in the sheet at all — synthesize one
      // from the confirmed column layout so the table still renders
      // with readable column names instead of "undefined".
      headerRow = PENALTIES_FALLBACK_HEADERS.slice();
      dataStartIndex = 0;
    } else {
      const detectedIndex = detectHeaderRow(allRows, isMatchReport);
      const headerRowIndex = detectedIndex >= 0 ? detectedIndex : (HEADER_ROWS_TO_SKIP[sheetName] || (isMatchReport ? 3 : DEFAULT_SKIP)) - 1;
      if (headerRowIndex >= 0 && allRows.length > headerRowIndex) {
        headerRow = allRows[headerRowIndex].map(h => (h || '').toString().replace(/[\u200B-\u200D\uFEFF]/g, '').trim());
      }
      dataStartIndex = headerRowIndex + 1;
    }

    thead.innerHTML = headerRow.length ? '<tr>' + headerRow.map(h => `<th>${escapeHtml(h)}</th>`).join('') + '</tr>' : '';

    let dataRows = allRows.slice(dataStartIndex).filter(row => {
      const firstCell = (row[0] || '').toString().trim();
      return firstCell !== '---' && firstCell !== '' && firstCell !== 'undefined';
    });

    const playerColIndex = findColumnIndex(headerRow, ['Player', 'Name']);
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

    // Leaderboards (non-match-report tables): rank color is applied ONLY
    // to the "Player" and "Rank" cells — never to the whole row.
    // rankColumnIndex (passed in by the caller) points at the column that
    // actually holds the rank string (e.g. "Grand Master"); we look up
    // "Player"/"Name" separately so both cells can be tinted.
    let leaderboardPlayerColIdx = -1, leaderboardRankColIdx = -1;
    if (!isMatchReport) {
      leaderboardPlayerColIdx = findColumnIndex(headerRow, ['Player', 'Name']);
      leaderboardRankColIdx = rankColumnIndex >= 0 ? rankColumnIndex : findColumnIndex(headerRow, ['Rank']);
    }

    tbody.innerHTML = dataRows.map(row => {
      // No more row-level class — coloring is now strictly per-cell.
      let rowHTML = `<tr>`;
      row.forEach((cell, colIdx) => {
        let display = cell ?? '';
        if (percentColumns.has(colIdx) && typeof cell === 'number') {
          display = (cell * 100).toFixed(1) + '%';
        } else if (typeof cell === 'number' && !Number.isInteger(cell)) {
          display = parseFloat(cell.toFixed(2));
        }

        let cellStyle = '';

        if (isMatchReport) {
          // Match reports: color only the Player cell, based on Rating Before Match.
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
          // Leaderboards: color only the Player cell and the Rank cell.
          if (colIdx === leaderboardPlayerColIdx || colIdx === leaderboardRankColIdx) {
            const rankValue = leaderboardRankColIdx >= 0 ? String(row[leaderboardRankColIdx] || '').trim() : '';
            const cssClass = RANK_CLASS_MAP[rankValue] || '';
            if (cssClass) cellStyle = ` class="${cssClass}"`;
          }
        }

        rowHTML += `<td${cellStyle}>${escapeHtml(display)}</td>`;
      });
      rowHTML += '</tr>';
      return rowHTML;
    }).join('');
  } catch (err) {
    console.error(`Error loading sheet "${sheetName}":`, err);
    renderTableState(tbody, colCount, 'error', { detail: err.message });
  }
}

// ========== MATCH REPORTS RENDERER ==========
async function renderMatchReports(sheetName, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  renderState(container, 'loading', { title: 'Loading match reports…' });

  try {
    const allRows = await fetchSheetData(sheetName);
    if (allRows.length === 0) {
      renderState(container, 'empty', { title: 'No match data for this month.' });
      return;
    }

    const cleanRows = allRows.map(row => row.map(cell => (cell || '').toString().replace(/[\u200B-\u200D\uFEFF]/g, '').trim()));
    const inactiveNames = await getInactivePlayerNames();

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
      const matchId = matchIdRow[0].replace('## Match ID:', '').trim();
      const dateQualityRow = block[1] ? block[1][0] : '';
      let date = '', quality = '';
      if (dateQualityRow) {
        const dateMatch = dateQualityRow.match(/\*\*Date:\*\*\s*(.*?)\s*\|/);
        const qualityMatch = dateQualityRow.match(/\*\*Quality:\*\*\s*(.*)/);
        if (dateMatch) date = dateMatch[1].trim();
        if (qualityMatch) quality = qualityMatch[1].trim();
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

      const playerColIndex = headerRow.findIndex(h => h === 'Player');
      if (playerColIndex !== -1 && inactiveNames.size > 0) {
        const hasInactive = dataRows.some(row => {
          const rawName = (row[playerColIndex] || '').toString().trim();
          const cleanName = extractPlayerName(rawName);
          return inactiveNames.has(cleanName);
        });
        if (hasInactive) continue;
      }

      if (playerColIndex !== -1 && inactiveNames.size > 0) {
        dataRows = dataRows.filter(row => {
          const rawName = (row[playerColIndex] || '').toString().trim();
          const cleanName = extractPlayerName(rawName);
          return !inactiveNames.has(cleanName);
        });
      }

      if (dataRows.length === 0) continue;

      const ratingBeforeColIndex = headerRow.findIndex(h => h === 'Rating Before Match');
      const deltaColIndex = headerRow.findIndex(h => h === 'Δ Rating');
      const ratingBeforeIdx = ratingBeforeColIndex >= 0 ? ratingBeforeColIndex : headerRow.findIndex(h => h === 'Rating Before Matcl');

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
      html += `<h3 style="margin:0 0 5px;">Match ID: ${escapeHtml(matchId)}</h3>`;
      html += `<p style="margin:0 0 10px; color:var(--text-muted);"><strong>Date:</strong> ${escapeHtml(date)} | <strong>Quality:</strong> ${escapeHtml(quality)}</p>`;
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
          let display = cell;
          let cellStyle = '';

          const numVal = parseFloat(cell);
          const isNumber = !isNaN(numVal) && String(cell).trim() !== '';

          if (colIdx === deltaColIndex && isNumber) {
            display = numVal.toFixed(2);
            if (numVal > 0) cellStyle += ' delta-positive';
            else if (numVal < 0) cellStyle += ' delta-negative';
          } else if (isNumber && !Number.isInteger(numVal) && colIdx !== ratingBeforeIdx) {
            display = numVal.toFixed(2);
          }

          if (colIdx === playerColIndex && ratingBeforeIdx >= 0) {
            const ratingBefore = parseFloat(row[ratingBeforeIdx]);
            if (!isNaN(ratingBefore)) {
              const rank = getRankFromRating(ratingBefore);
              cellStyle += ` ${RANK_CLASS_MAP[rank] || ''}`;
            }
          }

          html += `<td class="${colClass}${cellStyle}">${escapeHtml(display)}</td>`;
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

// ----- HELPERS -----
async function fetchSheetList() {
  const url = `${API_BASE}?list=1`;
  const response = await fetchWithTimeout(url);
  if (!response.ok) throw new Error(`HTTP ${response.status} while listing sheets`);
  const json = await response.json();
  return json.sheets || [];
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
    const header = playersSheet[0].map(h => (h || '').toString().replace(/[\u200B-\u200D\uFEFF]/g, '').trim());
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

// ----- Sidebar loader + active-link highlighting (shared by every page) -----
function initSidebar() {
  const target = document.getElementById('sidebar-container');
  if (!target) return;
  // sidebar.html always lives at the site root. Depth is computed from
  // the current URL path so this works correctly at any folder depth
  // (root, /ka-esports/, /ka-esports/admin/, etc.) without hardcoding "../".
  const segments = window.location.pathname.split('/').filter(Boolean);
  // Last segment is the file itself (e.g. "penalty.html"), so depth is
  // segments.length - 1 folders below root.
  const depth = Math.max(segments.length - 1, 0);
  const prefix = '../'.repeat(depth);
  fetch(`${prefix}sidebar.html`)
    .then(r => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.text();
    })
    .then(html => {
      target.innerHTML = html;
      highlightActiveSidebarLink();
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
    if (href === current) a.classList.add('active');
  });
}

document.addEventListener('DOMContentLoaded', initSidebar);
