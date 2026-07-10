// =====================================================
//  KA ESPORTS – Table Pagination
//  Client-side pagination for data tables
// =====================================================

const TablePagination = (() => {
  const instances = new Map();

  class Pagination {
    constructor(tableId, options = {}) {
      this.table = document.getElementById(tableId);
      if (!this.table) return;

      this.tbody = this.table.querySelector('tbody');
      this.pageSize = options.pageSize || 25;
      this.currentPage = 1;
      this.totalRows = 0;
      this.totalPages = 0;
      this.containerId = options.containerId || `${tableId}-pagination`;

      this.render();
      this.observe();
    }

    getVisibleRows() {
      if (!this.tbody) return [];
      return Array.from(this.tbody.querySelectorAll('tr')).filter(
        tr => tr.style.display !== 'none' && !tr.classList.contains('skeleton-row')
      );
    }

    update() {
      const rows = this.getVisibleRows();
      this.totalRows = rows.length;
      this.totalPages = Math.max(1, Math.ceil(this.totalRows / this.pageSize));

      if (this.currentPage > this.totalPages) this.currentPage = this.totalPages;
      if (this.currentPage < 1) this.currentPage = 1;

      const start = (this.currentPage - 1) * this.pageSize;
      const end = start + this.pageSize;

      rows.forEach((row, i) => {
        row.style.display = (i >= start && i < end) ? '' : 'none';
      });

      this.render();
    }

    goTo(page) {
      this.currentPage = Math.max(1, Math.min(page, this.totalPages));
      this.update();
    }

    render() {
      let container = document.getElementById(this.containerId);
      if (!container) {
        container = document.createElement('div');
        container.id = this.containerId;
        container.className = 'table-pagination';
        this.table.parentElement.insertAdjacentElement('afterend', container);
      }

      if (this.totalRows === 0) {
        container.innerHTML = '';
        return;
      }

      const start = (this.currentPage - 1) * this.pageSize + 1;
      const end = Math.min(this.currentPage * this.pageSize, this.totalRows);

      let pagesHTML = '';
      const maxVisible = 5;
      let startPage = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
      let endPage = Math.min(this.totalPages, startPage + maxVisible - 1);
      if (endPage - startPage < maxVisible - 1) {
        startPage = Math.max(1, endPage - maxVisible + 1);
      }

      if (startPage > 1) {
        pagesHTML += `<button class="page-btn" data-page="1">1</button>`;
        if (startPage > 2) pagesHTML += `<span class="page-ellipsis">...</span>`;
      }

      for (let i = startPage; i <= endPage; i++) {
        pagesHTML += `<button class="page-btn ${i === this.currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
      }

      if (endPage < this.totalPages) {
        if (endPage < this.totalPages - 1) pagesHTML += `<span class="page-ellipsis">...</span>`;
        pagesHTML += `<button class="page-btn" data-page="${this.totalPages}">${this.totalPages}</button>`;
      }

      container.innerHTML = `
        <div class="pagination-info">
          Showing ${start}–${end} of ${this.totalRows}
        </div>
        <div class="pagination-controls">
          <button class="page-btn" data-page="${this.currentPage - 1}" ${this.currentPage === 1 ? 'disabled' : ''}>&laquo; Prev</button>
          ${pagesHTML}
          <button class="page-btn" data-page="${this.currentPage + 1}" ${this.currentPage === this.totalPages ? 'disabled' : ''}>Next &raquo;</button>
        </div>
      `;

      container.querySelectorAll('.page-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const page = parseInt(btn.dataset.page);
          if (!isNaN(page)) this.goTo(page);
        });
      });
    }

    observe() {
      const observer = new MutationObserver(() => this.update());
      observer.observe(this.tbody, { childList: true });
    }

    destroy() {
      const container = document.getElementById(this.containerId);
      if (container) container.remove();
    }
  }

  function create(tableId, options) {
    if (instances.has(tableId)) {
      instances.get(tableId).destroy();
    }
    const pagination = new Pagination(tableId, options);
    instances.set(tableId, pagination);
    return pagination;
  }

  function get(tableId) {
    return instances.get(tableId);
  }

  return { create, get };
})();