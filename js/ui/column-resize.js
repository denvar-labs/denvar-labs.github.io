// =====================================================
//  KA ESPORTS – Column Resize
//  Drag-to-resize table columns
// =====================================================

const ColumnResize = (() => {
  const instances = new Map();

  class Resizer {
    constructor(tableId, options = {}) {
      this.table = document.getElementById(tableId);
      if (!this.table) return;
      this.minWidth = options.minWidth || 60;
      this.init();
    }

    init() {
      const thead = this.table.querySelector('thead');
      if (!thead) return;
      const headerCells = thead.querySelectorAll('th');

      headerCells.forEach((th, index) => {
        const resizeHandle = document.createElement('div');
        resizeHandle.className = 'col-resize';
        th.style.position = 'relative';
        th.appendChild(resizeHandle);

        let startX, startWidth;

        const onMouseMove = (e) => {
          const diff = e.clientX - startX;
          const newWidth = Math.max(this.minWidth, startWidth + diff);
          th.style.width = newWidth + 'px';
          th.style.minWidth = newWidth + 'px';
          th.style.maxWidth = newWidth + 'px';

          const rows = this.table.querySelectorAll('tbody tr');
          rows.forEach(row => {
            const cell = row.children[index];
            if (cell) {
              cell.style.width = newWidth + 'px';
              cell.style.minWidth = newWidth + 'px';
              cell.style.maxWidth = newWidth + 'px';
            }
          });
        };

        const onMouseUp = () => {
          document.removeEventListener('mousemove', onMouseMove);
          document.removeEventListener('mouseup', onMouseUp);
          document.body.style.cursor = '';
          this.table.style.userSelect = '';
        };

        resizeHandle.addEventListener('mousedown', (e) => {
          e.preventDefault();
          startX = e.clientX;
          startWidth = th.offsetWidth;
          document.body.style.cursor = 'col-resize';
          this.table.style.userSelect = 'none';
          document.addEventListener('mousemove', onMouseMove);
          document.addEventListener('mouseup', onMouseUp);
        });
      });
    }

    destroy() {
      this.table.querySelectorAll('.col-resize').forEach(el => el.remove());
    }
  }

  function create(tableId, options) {
    if (instances.has(tableId)) instances.get(tableId).destroy();
    const resizer = new Resizer(tableId, options);
    instances.set(tableId, resizer);
    return resizer;
  }

  function get(tableId) { return instances.get(tableId); }

  return { create, get };
})();