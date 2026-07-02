// =====================================================
//  KA ESPORTS – API Data Loader (v17 – Updated Web App URL)
// =====================================================

const API_BASE = 'https://script.google.com/macros/s/AKfycbyMYv9MCqIj4EV_p0W25WcYZnCsBXYTQyugxCVjqFgA8YYFIy66VCOWRFjWgp5l2AiO/exec';

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

async function fetchSheetData(sheetName) {
  const url = `${API_BASE}?sheet=${encodeURIComponent(sheetName)}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const json = await response.json();
  if (json.error) throw new Error(json.error);
  return json.data || [];
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

        rowHTML += `<td${cellStyle}>${display}</td>`;
      });
      rowHTML += '</tr>';
      return rowHTML;
    }).join('');
  } catch (err) {
    console.error(`Error loading sheet "${sheetName}":`, err);
    tbody.innerHTML = `<tr><td colspan="20">Error: ${err.message}</td></tr>`;
  }
}

// ========== MATCH REPORTS RENDERER ==========
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
    let headerRowIndex = detectedIndex >= 0
      ? detectedIndex
      : (HEADER_ROWS_TO_SKIP[sheetName] || (isMatchReport ? 3 : DEFAULT_SKIP)) - 1;

    let headerRow = [];
    if (headerRowIndex >= 0 && allRows.length > headerRowIndex) {
      headerRow = allRows[headerRowIndex].map(h =>
        (h || '').toString().replace(/[\u200B-\u200D\uFEFF]/g, '').trim()
      );
    }

    thead.innerHTML = headerRow.length
      ? '<tr>' + headerRow.map(h => `<th>${esc(h)}</th>`).join('') + '</tr>'
      : '';

    const dataStartIndex = headerRowIndex + 1;
    let dataRows = allRows.slice(dataStartIndex).filter(row => {
      const firstCell = (row[0] || '').toString().trim();
      return firstCell !== '---' && firstCell !== '' && firstCell !== 'undefined';
    });

    // --- FILTRAR INACTIVOS ---
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

    // --- ÍNDICES IMPORTANTES ---
    const percentColumns = new Set();
    headerRow.forEach((h, idx) => {
      if (h.includes('%')) percentColumns.add(idx);
    });

    // Localiza las columnas Player y Rank (para aplicar color)
    const rankColIdx = headerRow.findIndex(h => h === 'Rank');
    const playerColForColor = headerRow.findIndex(h => h === 'Player');

    let ratingBeforeColIndex = -1, deltaColIndex = -1;
    if (isMatchReport) {
      ratingBeforeColIndex = headerRow.findIndex(h => h.includes('Rating Before'));
      deltaColIndex = headerRow.findIndex(h => h.includes('Δ') || h.includes('Rating Change') || h === 'Δ Rating');
    }

    // --- GENERAR FILAS ---
    tbody.innerHTML = dataRows.map(row => {
      // Determinar el rango (si existe la columna Rank)
      const rankName = (rankColIdx !== -1 ? String(row[rankColIdx] || '').trim() : '');
      const rankCssClass = RANK_CLASS_MAP[rankName] || '';

      let rowHTML = '<tr>';
      row.forEach((cell, colIdx) => {
        let display = cell ?? '';
        if (percentColumns.has(colIdx) && typeof cell === 'number') {
          display = (cell * 100).toFixed(1) + '%';
        } else if (typeof cell === 'number' && !Number.isInteger(cell)) {
          display = parseFloat(cell.toFixed(2));
        }

        let cellClass = '';

        // Solo colorear la columna Player (en Match Reports) o Player/Rank (en leaderboards)
        if (isMatchReport && colIdx === playerColForColor && ratingBeforeColIndex >= 0) {
          const ratingBefore = parseFloat(row[ratingBeforeColIndex]);
          if (!isNaN(ratingBefore)) {
            const rank = getRankFromRating(ratingBefore);
            cellClass = RANK_CLASS_MAP[rank] || '';
          }
        } else if (!isMatchReport && (colIdx === playerColForColor || colIdx === rankColIdx) && rankCssClass) {
          cellClass = rankCssClass;
        }

        // Colores Δ Rating (Match Reports)
        if (isMatchReport && colIdx === deltaColIndex && typeof cell === 'number') {
          if (cell > 0) cellClass = 'delta-positive';
          else if (cell < 0) cellClass = 'delta-negative';
        }

        rowHTML += `<td${cellClass ? ` class="${esc(cellClass)}"` : ''}>${esc(String(display))}</td>`;
      });
      rowHTML += '</tr>';
      return rowHTML;
    }).join('');
  } catch (err) {
    console.error(`Error loading sheet "${sheetName}":`, err);
    tbody.innerHTML = `<tr><td colspan="20">Error: ${esc(err.message)}</td></tr>`;
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
  } catch (err) { console.error('Error populating month selector:', err); }
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
    container.innerHTML = lines.map(line => `<p>${line}</p>`).join('');
  } catch (err) { container.textContent = `Error: ${err.message}`; }
}
