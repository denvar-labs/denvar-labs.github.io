// ka-esports/js/table-enhance.js
export class TableEnhance {
  constructor(tableId) {
    this.table = document.getElementById(tableId);
    this.originalRows = null;
    this.sortState = new Map(); // column -> 'asc'|'desc'|null
    this.filterInput = null;
    this.columnPickerBtn = null;
    this.columnPickerDropdown = null;
    this.deepLink = false;
  }

  init({ sortable = true, filterable = false, filterPlaceholder = 'Search...', columnPicker = true, deepLink = false } = {}) {
    if (!this.table) return;
    this.originalRows = Array.from(this.table.tBodies[0].rows);

    if (sortable) {
      this.table.tHead.querySelectorAll('th').forEach(th => {
        th.style.cursor = 'pointer';
        th.addEventListener('click', () => this.handleSort(th));
      });
    }

    if (filterable) this.createFilterInput(filterPlaceholder || 'Search...');
    if (columnPicker) this.createColumnPicker();
    if (deepLink) {
      this.deepLink = true;
      this.restoreFromURL();
      this.originalHandleSort = this.handleSort.bind(this);
      this.handleSort = (th) => { this.originalHandleSort(th); this.pushToURL(); };
    }
  }

  handleSort(th) {
    const column = th.dataset.sort || th.textContent.trim().toLowerCase();
    const current = this.sortState.get(column) || null;
    const next = current === 'asc' ? 'desc' : current === 'desc' ? null : 'asc';
    this.sortState.set(column, next);

    this.table.tHead.querySelectorAll('th').forEach(h => h.classList.remove('sort-asc', 'sort-desc'));
    if (next) th.classList.add(`sort-${next}`);

    if (next === null) this.restoreOriginalOrder();
    else this.sortColumn(column, next);
  }

  sortColumn(column, direction) {
    const tbody = this.table.tBodies[0];
    const rows = Array.from(tbody.rows);
    const colIndex = Array.from(this.table.tHead.rows[0].cells).findIndex(
      th => (th.dataset.sort || th.textContent.trim().toLowerCase()) === column
    );

    if (colIndex === -1) return;

    rows.sort((a, b) => {
      const aVal = a.cells[colIndex]?.textContent.trim() || '';
      const bVal = b.cells[colIndex]?.textContent.trim() || '';
      const aNum = parseFloat(aVal), bNum = parseFloat(bVal);
      const cmp = isNaN(aNum) || isNaN(bNum)
        ? aVal.localeCompare(bVal, undefined, { numeric: true })
        : aNum - bNum;
      // direction 'asc': return cmp (a < b → negative → a first)
      // direction 'desc': return -cmp (reverse)
      return direction === 'asc' ? cmp : -cmp;
    });

    rows.forEach(r => tbody.appendChild(r));
  }

  restoreOriginalOrder() {
    const tbody = this.table.tBodies[0];
    this.originalRows.forEach(r => tbody.appendChild(r));
  }

  createFilterInput(placeholder) {
    const container = document.getElementById('filter-container') || this.table.parentElement;
    this.filterInput = document.createElement('input');
    this.filterInput.type = 'search';
    this.filterInput.placeholder = placeholder;
    this.filterInput.className = 'table-filter-input';
    this.filterInput.style.cssText = 'width:100%; padding:8px 12px; margin-bottom:12px; border:1px solid var(--border); border-radius:6px; font-size:14px;';
    container.appendChild(this.filterInput); // appendChild, not insertBefore

    let debounceTimer;
    this.filterInput.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => this.applyFilter(this.filterInput.value), 300);
    });
  }

  applyFilter(query) {
    const q = query.toLowerCase().trim();
    const tbody = this.table.tBodies[0];
    Array.from(tbody.rows).forEach(row => {
      const text = row.textContent.toLowerCase();
      row.style.display = text.includes(q) ? '' : 'none';
    });
  }

  createColumnPicker() {
    const container = document.getElementById('column-picker-container') || this.table.parentElement;
    this.columnPickerBtn = document.createElement('button');
    this.columnPickerBtn.type = 'button';
    this.columnPickerBtn.className = 'column-picker-btn';
    this.columnPickerBtn.textContent = 'Columns ▼';
    this.columnPickerBtn.style.cssText = 'padding:6px 12px; margin-bottom:12px; border:1px solid var(--border); border-radius:6px; background:var(--surface); cursor:pointer; font-size:13px;';
    container.appendChild(this.columnPickerBtn);

    this.columnPickerDropdown = document.createElement('div');
    this.columnPickerDropdown.className = 'column-picker-dropdown';
    this.columnPickerDropdown.style.cssText = 'position:absolute; display:none; background:var(--surface); border:1px solid var(--border); border-radius:6px; padding:8px; box-shadow:0 4px 12px rgba(0,0,0,0.1); z-index:100; min-width:180px;';
    container.appendChild(this.columnPickerDropdown);

    this.columnPickerBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleColumnPicker();
    });

    document.addEventListener('click', () => this.closeColumnPicker());

    this.populateColumnPicker();
  }

  populateColumnPicker() {
    const headers = Array.from(this.table.tHead.rows[0].cells);
    this.columnPickerDropdown.innerHTML = '';
    headers.forEach((th, idx) => {
      const label = document.createElement('label');
      label.style.cssText = 'display:flex; align-items:center; gap:8px; padding:6px 10px; cursor:pointer;';
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = true;
      checkbox.dataset.colIndex = idx;
      checkbox.addEventListener('change', (e) => this.toggleColumn(idx, e.target.checked));
      label.appendChild(checkbox);
      label.appendChild(document.createTextNode(th.textContent.trim() || `Column ${idx + 1}`));
      this.columnPickerDropdown.appendChild(label);
    });
  }

  toggleColumnPicker() {
    this.columnPickerDropdown.style.display = this.columnPickerDropdown.style.display === 'none' ? 'block' : 'none';
  }

  closeColumnPicker() {
    this.columnPickerDropdown.style.display = 'none';
  }

  toggleColumn(index, show) {
    const th = this.table.tHead.rows[0].cells[index];
    th.style.display = show ? '' : 'none';
    const tbody = this.table.tBodies[0];
    Array.from(tbody.rows).forEach(row => {
      if (row.cells[index]) row.cells[index].style.display = show ? '' : 'none';
    });
  }

  pushToURL() {
    if (!this.deepLink) return;
    const params = new URLSearchParams(window.location.search);
    const sortCol = Array.from(this.sortState.entries()).find(([,v]) => v !== null);
    if (sortCol) {
      params.set('sort', sortCol[0]);
      params.set('dir', sortCol[1]);
    } else {
      params.delete('sort');
      params.delete('dir');
    }
    const filter = this.filterInput?.value?.trim();
    if (filter) params.set('filter', filter);
    else params.delete('filter');

    const newUrl = `${window.location.pathname}?${params.toString()}`;
    history.replaceState(null, '', newUrl);
  }

  restoreFromURL(search = window.location.search) {
    const params = new URLSearchParams(search);
    const sort = params.get('sort');
    const dir = params.get('dir');
    const filter = params.get('filter');

    if (sort && dir) {
      const th = Array.from(this.table.tHead.rows[0].cells).find(
        h => (h.dataset.sort || h.textContent.trim().toLowerCase()) === sort
      );
      if (th) {
        this.sortState.set(sort, dir);
        th.classList.add(`sort-${dir}`);
        this.sortColumn(sort, dir);
      }
    }
    if (filter && this.filterInput) {
      this.filterInput.value = filter;
      this.applyFilter(filter);
    }
  }
}