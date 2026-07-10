// =====================================================
//  KA ESPORTS – Export Utilities
//  CSV export and screenshot functionality
// =====================================================

const ExportUtils = (() => {

  function exportCSV(tableId, filename) {
    const table = document.getElementById(tableId);
    if (!table || !table.querySelector('thead th')) {
      if (typeof showToast === 'function') showToast('Table not loaded yet.', 'error');
      return false;
    }
    const rows = table.querySelectorAll('tr');
    const csv = Array.from(rows).map(row =>
      Array.from(row.querySelectorAll('th,td')).map(cell =>
        '"' + cell.textContent.replace(/"/g, '""') + '"'
      ).join(',')
    ).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    const dateStr = new Date().toISOString().split('T')[0];
    link.download = filename.replace('{date}', dateStr);
    link.click();
    if (typeof showToast === 'function') showToast('CSV downloaded successfully', 'success');
    return true;
  }

  async function exportScreenshot(tableId, filename, btn) {
    const table = document.getElementById(tableId);
    if (!table || !table.querySelector('thead th')) {
      if (typeof showToast === 'function') showToast('Table not loaded yet.', 'error');
      return false;
    }
    if (typeof html2canvas === 'undefined') {
      if (typeof showToast === 'function') showToast('Screenshot library not loaded.', 'error');
      return false;
    }

    const prevDisabled = btn ? btn.disabled : false;
    const prevHTML = btn ? btn.innerHTML : '';
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<span>⏳ Generating...</span>';
    }

    try {
      const wrapper = table.closest('.table-responsive');
      const originalOverflow = wrapper ? wrapper.style.overflow : '';
      if (wrapper) wrapper.style.overflow = 'visible';
      const originalScrollX = window.scrollX;
      const originalScrollY = window.scrollY;
      window.scrollTo(0, 0);

      const canvas = await html2canvas(table, {
        scale: 3,
        useCORS: true,
        logging: false,
        backgroundColor: getComputedStyle(document.body).backgroundColor,
        width: table.scrollWidth,
        height: table.scrollHeight,
        windowWidth: table.scrollWidth,
        windowHeight: table.scrollHeight
      });

      if (wrapper) wrapper.style.overflow = originalOverflow;
      window.scrollTo(originalScrollX, originalScrollY);

      const dateStr = new Date().toISOString().split('T')[0];
      const link = document.createElement('a');
      link.download = filename.replace('{date}', dateStr);
      link.href = canvas.toDataURL('image/png');
      link.click();
      if (typeof showToast === 'function') showToast('Screenshot downloaded', 'success');
      return true;
    } catch (err) {
      console.error('Screenshot failed:', err);
      if (typeof showToast === 'function') showToast('Failed to generate screenshot.', 'error');
      return false;
    } finally {
      if (btn) {
        btn.disabled = prevDisabled;
        btn.innerHTML = prevHTML;
      }
    }
  }

  function bindCSV(buttonId, tableId, filenamePattern) {
    const btn = document.getElementById(buttonId);
    if (!btn) return;
    btn.addEventListener('click', () => exportCSV(tableId, filenamePattern));
  }

  function bindScreenshot(buttonId, tableId, filenamePattern) {
    const btn = document.getElementById(buttonId);
    if (!btn) return;
    btn.addEventListener('click', () => exportScreenshot(tableId, filenamePattern, btn));
  }

  return { exportCSV, exportScreenshot, bindCSV, bindScreenshot };
})();