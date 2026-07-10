// tests/table-enhance.test.js
import { TableEnhance } from '../ka-esports/js/table-enhance.js';
import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';

describe('TableEnhance', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  test('sort toggles asc/desc/none on header click', () => {
    document.body.innerHTML = `
      <table id="test-table">
        <thead><tr><th data-sort="rating">Rating</th></tr></thead>
        <tbody>
          <tr><td data-label="Rating">1400</td></tr>
          <tr><td data-label="Rating">1600</td></tr>
          <tr><td data-label="Rating">1500</td></tr>
        </tbody>
      </table>
    `;

    const enhance = new TableEnhance('test-table');
    enhance.init({ sortable: true });

    // Click header once → asc
    document.querySelector('th[data-sort="rating"]').click();
    let rows = Array.from(document.querySelectorAll('tbody tr td'));
    expect(rows.map(r => r.textContent)).toEqual(['1400', '1500', '1600']);

    // Click again → desc
    document.querySelector('th[data-sort="rating"]').click();
    rows = Array.from(document.querySelectorAll('tbody tr td'));
    expect(rows.map(r => r.textContent)).toEqual(['1600', '1500', '1400']);

    // Click third → none (original order)
    document.querySelector('th[data-sort="rating"]').click();
    rows = Array.from(document.querySelectorAll('tbody tr td'));
    expect(rows.map(r => r.textContent)).toEqual(['1400', '1600', '1500']);
  });

  test('filter input hides non-matching rows', () => {
    document.body.innerHTML = `
      <div id="filter-container"></div>
      <table id="test-table">
        <thead><tr><th data-sort="player">Player</th></tr></thead>
        <tbody>
          <tr><td data-label="Player">Alice</td></tr>
          <tr><td data-label="Player">Bob</td></tr>
          <tr><td data-label="Player">Charlie</td></tr>
        </tbody>
      </table>
    `;

    const enhance = new TableEnhance('test-table');
    enhance.init({ filterable: true, filterPlaceholder: 'Search players...' });

    const input = document.querySelector('#filter-container input');
    expect(input).toBeTruthy();
    expect(input.placeholder).toBe('Search players...');

    input.value = 'al';
    input.dispatchEvent(new Event('input'));

    // Debounce timer
    jest.advanceTimersByTime(300);

    const visibleRows = Array.from(document.querySelectorAll('tbody tr')).filter(r => r.style.display !== 'none');
    expect(visibleRows.length).toBe(1);
    expect(visibleRows[0].textContent).toContain('Alice');
  });

  test('column picker dropdown toggles column visibility', () => {
    document.body.innerHTML = `
      <div id="column-picker-container"></div>
      <table id="test-table">
        <thead><tr><th data-sort="a">Col A</th><th data-sort="b">Col B</th></tr></thead>
        <tbody><tr><td data-label="Col A">1</td><td data-label="Col B">2</td></tr></tbody>
      </table>
    `;

    const enhance = new TableEnhance('test-table');
    enhance.init({ columnPicker: true });

    const btn = document.querySelector('#column-picker-container button');
    expect(btn).toBeTruthy();

    btn.click();
    const checkboxes = document.querySelectorAll('.column-picker-dropdown input[type="checkbox"]');
    expect(checkboxes.length).toBe(2);

    checkboxes[1].checked = false;
    checkboxes[1].dispatchEvent(new Event('change'));

    const colB = document.querySelector('th[data-sort="b"]');
    expect(colB.style.display).toBe('none');
    const hiddenCells = document.querySelectorAll('td[data-label="Col B"]');
    hiddenCells.forEach(td => expect(td.style.display).toBe('none'));
  });

  test('sort state syncs to URL and restores on load', () => {
    const replaceState = jest.spyOn(history, 'replaceState').mockImplementation();

    document.body.innerHTML = `
      <table id="test-table">
        <thead><tr><th data-sort="rating">Rating</th></tr></thead>
        <tbody><tr><td data-label="Rating">1500</td></tr><tr><td data-label="Rating">1600</td></tr></tbody>
      </table>
    `;

    const enhance = new TableEnhance('test-table');
    enhance.init({ sortable: true, deepLink: true });

    document.querySelector('th[data-sort="rating"]').click();

    expect(replaceState).toHaveBeenCalledWith(
      null, '', expect.stringContaining('sort=rating&dir=asc')
    );

    // Test restoreFromURL directly by passing search string
    const enhance2 = new TableEnhance('test-table');
    enhance2.init({ sortable: true, deepLink: true });
    enhance2.restoreFromURL('?sort=rating&dir=desc');

    const th = document.querySelector('th[data-sort="rating"]');
    expect(th.classList.contains('sort-desc')).toBe(true);
  });
});