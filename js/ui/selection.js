// =====================================================
//  KA ESPORTS – Row Selection
//  Checkbox-based row selection with bulk actions
// =====================================================

const RowSelection = (() => {
  const instances = new Map();

  class Selection {
    constructor(tableId, options = {}) {
      this.table = document.getElementById(tableId);
      if (!this.table) return;

      this.tbody = this.table.querySelector('tbody');
      this.selected = new Set();
      this.onSelect = options.onSelect || (() => {});
      this.onBulkAction = options.onBulkAction || (() => {});
      this.bulkActions = options.bulkActions || [];
      this.containerId = options.containerId || `${tableId}-bulk`;

      this.init();
    }

    init() {
      this.addCheckboxes();
      this.addSelectAllHeader();
      this.renderBulkBar();
      this.observe();
    }

    addCheckboxes() {
      if (!this.tbody) return;
      this.tbody.querySelectorAll('tr').forEach(tr => {
        if (tr.querySelector('.row-checkbox')) return;
        const td = document.createElement('td');
        td.className = 'row-checkbox';
        td.innerHTML = '<input type="checkbox" aria-label="Select row">';
        tr.insertBefore(td, tr.firstChild);
        td.querySelector('input').addEventListener('change', (e) => {
          const rowId = tr.dataset.id || tr.rowIndex;
          if (e.target.checked) {
            this.selected.add(rowId);
            tr.classList.add('selected');
          } else {
            this.selected.delete(rowId);
            tr.classList.remove('selected');
          }
          this.updateBulkBar();
          this.onSelect(Array.from(this.selected));
        });
      });
    }

    addSelectAllHeader() {
      const thead = this.table.querySelector('thead');
      if (!thead) return;
      const firstRow = thead.querySelector('tr');
      if (!firstRow) return;
      if (firstRow.querySelector('.row-checkbox')) return;

      const th = document.createElement('th');
      th.className = 'row-checkbox';
      th.innerHTML = '<input type="checkbox" aria-label="Select all rows">';
      firstRow.insertBefore(th, firstRow.firstChild);

      th.querySelector('input').addEventListener('change', (e) => {
        const checked = e.target.checked;
        this.tbody.querySelectorAll('tr').forEach(tr => {
          const cb = tr.querySelector('.row-checkbox input');
          if (!cb) return;
          const rowId = tr.dataset.id || tr.rowIndex;
          cb.checked = checked;
          if (checked) {
            this.selected.add(rowId);
            tr.classList.add('selected');
          } else {
            this.selected.delete(rowId);
            tr.classList.remove('selected');
          }
        });
        this.updateBulkBar();
        this.onSelect(Array.from(this.selected));
      });
    }

    renderBulkBar() {
      let container = document.getElementById(this.containerId);
      if (!container) {
        container = document.createElement('div');
        container.id = this.containerId;
        container.className = 'bulk-actions';
        container.style.display = 'none';
        this.table.parentElement.insertBefore(container, this.table);
      }
      this.container = container;
      this.updateBulkBar();
    }

    updateBulkBar() {
      if (!this.container) return;
      const count = this.selected.size;
      if (count === 0) {
        this.container.style.display = 'none';
        return;
      }
      this.container.style.display = 'flex';
      let html = `<span class="selected-count">${count} selected</span>`;
      this.bulkActions.forEach(action => {
        html += `<button class="btn btn-sm ${action.class || 'btn-secondary'}" data-action="${action.id}">${action.icon || ''} ${action.label}</button>`;
      });
      html += `<button class="btn btn-sm btn-ghost" data-action="clear">Clear</button>`;
      this.container.innerHTML = html;

      this.container.querySelectorAll('[data-action]').forEach(btn => {
        btn.addEventListener('click', () => {
          const actionId = btn.dataset.action;
          if (actionId === 'clear') {
            this.clear();
          } else {
            this.onBulkAction(actionId, Array.from(this.selected));
          }
        });
      });
    }

    clear() {
      this.selected.clear();
      this.tbody.querySelectorAll('tr').forEach(tr => {
        tr.classList.remove('selected');
        const cb = tr.querySelector('.row-checkbox input');
        if (cb) cb.checked = false;
      });
      const headerCb = this.table.querySelector('thead .row-checkbox input');
      if (headerCb) headerCb.checked = false;
      this.updateBulkBar();
      this.onSelect([]);
    }

    getSelected() { return Array.from(this.selected); }

    observe() {
      const observer = new MutationObserver(() => {
        this.addCheckboxes();
        this.updateBulkBar();
      });
      observer.observe(this.tbody, { childList: true });
    }

    destroy() {
      if (this.container) this.container.remove();
    }
  }

  function create(tableId, options) {
    if (instances.has(tableId)) instances.get(tableId).destroy();
    const selection = new Selection(tableId, options);
    instances.set(tableId, selection);
    return selection;
  }

  function get(tableId) { return instances.get(tableId); }

  return { create, get };
})();