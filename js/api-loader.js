// =====================================================
//  KA ESPORTS – API Data Loader (v18 – Centralized config + hardening)
// =====================================================

// KA_API_BASE viene de config.js — asegúrate de incluir
// <script src="../js/config.js"></script> ANTES de este archivo.
const API_BASE = (typeof KA_API_BASE !== 'undefined') ? KA_API_BASE
  : 'https://script.google.com/macros/s/AKfycbyMYv9MCqIj4EV_p0W25WcYZnCsBXYTQyugxCVjqFgA8YYFIy66VCOWRFjWgp5l2AiO/exec';

const HEADER_ROWS_TO_SKIP = {
  'LEADERBOARD_GLOBAL': 3,
  'PLAYERS': 1,
  'MATCHES': 2,
  'PENALTIES': 2,
  'ANTI_SMURF_LOG': 2,
  'AUDIT_LOG': 2,
  'SYSTEM_METRICS': 2,
  'SEASONS_REPORT': 2,
  'MANUAL_MATCHES': 3,
  'FAQ': 0,
  'PLAYER_H2H_DETAILS': 1,
  '_H2H_DATA': 1
};

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

function getRankFromRating(rating) {
  const r = Number(rating);
  for (const level of RATING_THRESHOLDS) {
    if (r >= level.min) return level.rank;
  }
  return 'Padawan';
}

// Simple in-memory cache para evitar refetch del mismo sheet en la misma sesión
const _sheetCache = new Map();
const SHEET_CACHE_TTL_MS = 60 * 1000; // 60s

async function fetchSheetData(sheetName, opts = {}) {
  const bypassCache = opts.bypassCache === true;
  const cacheKey = sheetName;
  const cached = _sheetCache.get(cacheKey);
  if (!bypassCache && cached && (Date.now() - cached.time) < SHEET_CACHE_TTL_MS) {
    return cached.data;
  }

  const url = `${API_BASE}?sheet=${encodeURIComponent(sheetName)}`;
  let response;
  try {
    response = await fetch(url);
  } catch (netErr) {
    throw new Error('Network error: could not reach the data server. Check your connection.');
  }
  if (!response.ok) throw new Error(`HTTP ${response.status} while loading "${sheetName}"`);
  const json = await response.json();
  if (json.error) throw new Error(json.error);
  const data = json.data || [];
  _sheetCache.set(cacheKey, { data, time: Date.now() });
  return data;
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

function extractPlayerName(cell) {
  if (!cell) return '';
  return cell.replace(/[\u{1F1E6}-\u{1F1FF}\u{1F3F4}\u{1F3C1}\u{1F6A9}\u{1F3F3}\u{1F3F4}\u{1F3F4}\u{1F3F4}\u{1F3F4}\u{1F3F4}\u{1F3F4}\u{1F3F4}\u{1F3F4}]+/gu, '').trim();
}

// ----- Flags helper (single source of truth, used to be duplicated in 2 files) -----
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

  tbody.innerHTML = '<tr><td colspan="20">Loading…</td></tr>';

  try {
    const allRows = await fetchSheetData(sheetName);
    if (allRows.length === 0) {
      tbody.innerHTML = '<tr><td colspan="20">No data available.</td></tr>';
      return;
    }

    const isMatchReport = sheetName.startsWith('MATCH_REPORTS_');
    const detectedIndex = detectHeaderRow(allRows, isMatchReport);
    let headerRowIndex = detectedIndex >= 0 ? detectedIndex : (HEADER_ROWS_TO_SKIP[sheetName] || (isMatchReport ? 3 : DEFAULT_SKIP)) - 1;

    let headerRow = [];
    if (headerRowIndex >= 0 && allRows.length > headerRowIndex) {
      headerRow = allRows[headerRowIndex].map(h => (h || '').toString().replace(/[\u200B-\u200D\uFEFF]/g, '').trim());
    }

    thead.innerHTML = headerRow.length ? '<tr>' + headerRow.map(h => `<th>${h}</th>`).join('') + '</tr>' : '';

    const dataStartIndex = headerRowIndex + 1;
    let dataRows = allRows.slice(dataStartIndex).filter(row => {
      const firstCell = (row[0] || '').toString().trim();
      return firstCell !== '---' && firstCell !== '' && firstCell !== 'undefined';
    });

    const playerColIndex = headerRow.findIndex(h => h === 'Player' || h === 'Name');
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
      tbody.innerHTML = '<tr><td colspan="20">No data available.</td></tr>';
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

    tbody.innerHTML = dataRows.map(row => {
      let rowClass = (!isMatchReport && rankColumnIndex >= 0) ? (RANK_CLASS_MAP[String(row[rankColumnIndex] || '').trim()] || '') : '';

      let rowHTML = `<tr class="${rowClass}">`;
      row.forEach((cell, colIdx) => {
        let display = cell ?? '';
        if (percentColumns.has(colIdx) && typeof cell === 'number') {
          display = (cell * 100).toFixed(1) + '%';
        } else if (typeof cell === 'number' && !Number.isInteger(cell)) {
          display = parseFloat(cell.toFixed(2));
        }

        let cellStyle = '';
        if (isMatchReport && colIdx === playerColIndex && ratingBeforeColIndex >= 0) {
          const ratingBefore = parseFloat(row[ratingBeforeColIndex]);
          if (!isNaN(ratingBefore)) {
            const rank = getRankFromRating(ratingBefore);
            const cssClass = RANK_CLASS_MAP[rank] || '';
            cellStyle = ` class="${cssClass}"`;
          }
        }
        if (isMatchReport && colIdx === deltaColIndex && typeof cell === 'number') {
          if (cell > 0) cellStyle = ' class="delta-positive"';
          else if (cell < 0) cellStyle = ' class="delta-negative"';
        }

        rowHTML += `<td${cellStyle}>${escapeHtml(display)}</td>`;
      });
      rowHTML += '</tr>';
      return rowHTML;
    }).join('');
  } catch (err) {
    console.error(`Error loading sheet "${sheetName}":`, err);
    tbody.innerHTML = `<tr><td colspan="20">⚠️ No se pudo cargar la información. ${escapeHtml(err.message)}</td></tr>`;
  }
}

// Escapa HTML para evitar que datos con < > & terminen rompiendo el layout
// (defensa básica; los datos vienen de un Sheet controlado por admins, pero
// es buena práctica no confiar 100% en el contenido de celdas).
function escapeHtml(value) {
  const str = String(value);
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// ========== MATCH REPORTS RENDERER ==========
async function renderMatchReports(sheetName, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '<p>Loading match reports…</p>';

  try {
    const allRows = await fetchSheetData(sheetName);
    if (allRows.length === 0) {
      container.innerHTML = '<p>No match data for this month.</p>';
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
      container.innerHTML = '<p>No matches found in this sheet.</p>';
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

    container.innerHTML = html || '<p>No matches found.</p>';
  } catch (err) {
    console.error(err);
    container.innerHTML = `<p>⚠️ Error loading match reports: ${escapeHtml(err.message)}</p>`;
  }
}

// ----- HELPERS -----
async function fetchSheetList() {
  const url = `${API_BASE}?list=1`;
  const response = await fetch(url);
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
  } catch (err) {
    console.error('Error populating month selector:', err);
    select.innerHTML = '<option value="">⚠️ Error loading months</option>';
  }
}

function populateSelectFromList(selectId, items, defaultText = '-- Select --') {
  const select = document.getElementById(selectId);
  if (!select) return;
  select.innerHTML = `<option value="">${defaultText}</option>`;
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
  container.textContent = 'Loading…';
  try {
    const allRows = await fetchSheetData(sheetName);
    if (!allRows.length) { container.textContent = 'No content found.'; return; }
    const lines = allRows.map(row => row[0] || '').filter(line => line.trim() !== '');
    container.innerHTML = lines.map(line => `<p>${escapeHtml(line)}</p>`).join('');
  } catch (err) {
    container.textContent = `Error: ${err.message}`;
  }
}
