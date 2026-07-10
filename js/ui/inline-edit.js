// =====================================================
//  KA ESPORTS – Inline Editing
//  Click-to-edit table cells
// =====================================================

const InlineEdit = (() => {
  const instances = new Map();

  class Editor {
    constructor(tableId, options = {}) {
      this.table = document.getElementById(tableId);
      if (!this.table) return;

      this.editableColumns = options.editableColumns || [];
      this.onSave = options.onSave || (() => {});
      this.onCancel = options.onCancel || (() => {});
      this.inputType = options.inputType || 'text';

      this.init();
    }

    init() {
      this.table.addEventListener('dblclick', (e) => {
        const td = e.target.closest('td');
        if (!td) return;

        const th = this.getThForTd(td);
        if (!th) return;

        const colIndex = Array.from(th.parentNode.children).indexOf(th);
        const columnName = th.dataset.column || th.textContent.trim();

        if (this.editableColumns.length > 0 && !this.editableColumns.includes(columnName) && !this.editableColumns.includes(colIndex)) {
          return;
        }

        this.startEdit(td, columnName, colIndex);
      });
    }

    getThForTd(td) {
      const tr = td.closest('tr');
      if (!tr) return null;
      const tbody = this.table.querySelector('tbody');
      if (!tbody) return null;
      const rowIndex = Array.from(tbody.children).indexOf(tr);
      if (rowIndex !== 0) return null;

      const thead = this.table.querySelector('thead');
      if (!thead) return null;
      const headerRow = thead.querySelector('tr');
      if (!headerRow) return null;

      const colIndex = Array.from(tr.children).indexOf(td);
      return headerRow.children[colIndex];
    }

    startEdit(td, columnName, colIndex) {
      if (td.querySelector('.inline-edit-input')) return;

      const originalValue = td.textContent.trim();
      const tr = td.closest('tr');
      const rowId = tr.dataset.id || Array.from(tr.parentNode.children).indexOf(tr);

      td.dataset.originalValue = originalValue;

      const input = document.createElement('input');
      input.type = this.inputType;
      input.className = 'inline-edit-input';
      input.value = originalValue;
      input.style.cssText = 'width:100%;padding:4px 8px;border:2px solid var(--accent);border-radius:4px;font:inherit;background:var(--surface);color:var(--text);';

      td.textContent = '';
      td.appendChild(input);
      input.focus();
      input.select();

      const finishEdit = (save) => {
        const newValue = save ? input.value : originalValue;
        td.textContent = newValue;

        if (save && newValue !== originalValue) {
          this.onSave({
            row: tr,
            rowId,
            column: columnName,
            columnIndex: colIndex,
            oldValue: originalValue,
            newValue
          });
        } else if (!save) {
          this.onCancel({ row: tr, rowId, column: columnName });
        }
      };

      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { finishEdit(true); }
        else if (e.key === 'Escape') { finishEdit(false); }
        else if (e.key === 'Tab') {
          e.preventDefault();
          finishEdit(true);
          this.moveToNextEditable(td, e.shiftKey ? -1 : 1);
        }
      });

      input.addEventListener('blur', () => finishEdit(true));
    }

    moveToNextEditable(currentTd, direction) {
      const tr = currentTd.closest('tr');
      const cells = Array.from(tr.querySelectorAll('td'));
      const currentIndex = cells.indexOf(currentTd);
      let nextIndex = currentIndex + direction;

      while (nextIndex >= 0 && nextIndex < cells.length) {
        const th = this.getThForTd(cells[nextIndex]);
        if (th) {
          const columnName = th.dataset.column || th.textContent.trim();
          if (this.editableColumns.length === 0 || this.editableColumns.includes(columnName)) {
            cells[nextIndex].dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
            return;
          }
        }
        nextIndex += direction;
      }
    }

    destroy() {
      this.table.querySelectorAll('.inline-edit-input').forEach(input => {
        const td = input.closest('td');
        if (td && td.dataset.originalValue !== undefined) {
          td.textContent = td.dataset.originalValue;
          delete td.dataset.originalValue;
        }
      });
    }
  }

  function create(tableId, options) {
    if (instances.has(tableId)) instances.get(tableId).destroy();
    const editor = new Editor(tableId, options);
    instances.set(tableId, editor);
    return editor;
  }

  function get(tableId) { return instances.get(tableId); }

  return { create, get };
})();