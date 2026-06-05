// =====================================================
//  KA ESPORTS – API Data Loader (v12 – Fixed Match Reports)
// =====================================================

const API_BASE = 'https://script.google.com/macros/s/AKfycbzSTtjN74DSUTTC47Zindyl_-zzLaQPsH3Z3qokhDwvPEG8T-ZOa5ZpdB87adYejh2g/exec';

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

// ========== TABLA GENÉRICA (para la mayoría de hojas) ==========
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
    const dataRows = allRows.slice(dataStartIndex).filter(row => {
      const firstCell = (row[0] || '').toString().trim();
      return firstCell !== '---' && firstCell !== '' && firstCell !== 'undefined';
    });

    if (dataRows.length === 0) {
      tbody.innerHTML = '<tr><td colspan="20">No data available.</td></tr>';
      return;
    }

    const percentColumns = new Set();
    headerRow.forEach((h, idx) => {
      if (h.includes('%')) percentColumns.add(idx);
    });

    let playerColIndex = -1, ratingBeforeColIndex = -1, deltaColIndex = -1;
    if (isMatchReport) {
      playerColIndex = headerRow.findIndex(h => h.includes('Player'));
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

// ========== RENDERIZADO ESPECÍFICO PARA MATCH REPORTS ==========
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

    // Clean up the rows: trim whitespace and remove invisible chars
    const cleanRows = allRows.map(row => row.map(cell => (cell || '').toString().replace(/[\u200B-\u200D\uFEFF]/g, '').trim()));

    // Find all lines that start with "## Match ID:" – each starts a new match block
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

      // Extract match ID and date/quality
      const matchIdRow = block[0];
      const matchId = matchIdRow[0].replace('## Match ID:', '').trim();
      const dateQualityRow = block[1] ? block[1][0] : '';
      // dateQualityRow format: **Date:** ... | **Quality:** ...
      let date = '', quality = '';
      if (dateQualityRow) {
        const dateMatch = dateQualityRow.match(/\*\*Date:\*\*\s*(.*?)\s*\|/);
        const qualityMatch = dateQualityRow.match(/\*\*Quality:\*\*\s*(.*)/);
        if (dateMatch) date = dateMatch[1].trim();
        if (qualityMatch) quality = qualityMatch[1].trim();
      }

      // Find the sub‑header row (Player, Points, Pos, …) within this block
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
      if (!headerRow) continue; // skip if no header

      // Collect data rows until we hit a separator or end of block
      const dataRows = [];
      for (let j = dataStart; j < block.length; j++) {
        const row = block[j];
        if (row[0] === '---' || row[0] === '') break;
        dataRows.push(row);
      }

      // Find column indices
      const playerColIndex = headerRow.findIndex(h => h === 'Player');
      const ratingBeforeColIndex = headerRow.findIndex(h => h === 'Rating Before Match');
      const deltaColIndex = headerRow.findIndex(h => h === 'Δ Rating');
      // fallback for Rating Before Match typo
      const ratingBeforeIdx = ratingBeforeColIndex >= 0 ? ratingBeforeColIndex : headerRow.findIndex(h => h === 'Rating Before Matcl');

      // Build the match card
      html += '<div style="margin-bottom:30px;">';
      html += `<h3 style="margin:0 0 5px;">Match ID: ${matchId}</h3>`;
      html += `<p style="margin:0 0 10px; color:var(--text-muted);"><strong>Date:</strong> ${date} | <strong>Quality:</strong> ${quality}</p>`;
      html += '<div class="table-responsive"><table class="data-table"><thead><tr>';
      headerRow.forEach(h => html += `<th>${h}</th>`);
      html += '</tr></thead><tbody>';

      dataRows.forEach(row => {
        html += '<tr>';
        row.forEach((cell, colIdx) => {
          let display = cell;
          // Format Δ Rating numbers
          if (colIdx === deltaColIndex && typeof cell === 'number') {
            display = cell.toFixed(2);
          } else if (typeof cell === 'number' && !Number.isInteger(cell) && colIdx !== ratingBeforeIdx) {
            display = parseFloat(cell.toFixed(2));
          }

          let cellStyle = '';
          // Color de rango en Player
          if (colIdx === playerColIndex && ratingBeforeIdx >= 0) {
            const ratingBefore = parseFloat(row[ratingBeforeIdx]);
            if (!isNaN(ratingBefore)) {
              const rank = getRankFromRating(ratingBefore);
              cellStyle = ` class="${RANK_CLASS_MAP[rank] || ''}"`;
            }
          }
          // Color Δ Rating
          if (colIdx === deltaColIndex && typeof cell === 'number') {
            if (cell > 0) cellStyle = ' class="delta-positive"';
            else if (cell < 0) cellStyle = ' class="delta-negative"';
          }

          html += `<td${cellStyle}>${display}</td>`;
        });
        html += '</tr>';
      });

      html += '</tbody></table></div></div>';
    }

    container.innerHTML = html || '<p>No matches found.</p>';
  } catch (err) {
    console.error(err);
    container.innerHTML = `<p>Error: ${err.message}</p>`;
  }
}

// ----- Helpers -----
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
    if (nameCol === -1) return [];
    const names = playersSheet.slice(1).map(row => row[nameCol]).filter(Boolean);
    return [...new Set(names)].sort();
  } catch (err) { return []; }
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
