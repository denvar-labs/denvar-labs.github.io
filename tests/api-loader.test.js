// tests/api-loader.test.js
import { describe, test, expect } from '@jest/globals';

function escapeHtml(value) {
  const str = String(value ?? '');
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

const RATING_THRESHOLDS = [
  { rank: 'Grand Master', min: 2000 },
  { rank: 'Master',       min: 1800 },
  { rank: 'Pro',          min: 1600 },
  { rank: 'Expert',       min: 1400 },
  { rank: 'Advanced',     min: 1200 },
  { rank: 'Amateur',      min: 1000 },
  { rank: 'Padawan',      min: 0 },
];

function getRankFromRating(rating) {
  const r = Number(rating);
  for (const level of RATING_THRESHOLDS) {
    if (r >= level.min) return level.rank;
  }
  return 'Padawan';
}

describe('escapeHtml', () => {
  test('escapes < > &', () => {
    const result = escapeHtml('<script>alert("xss") & more</script>');
    expect(result).toBe('&lt;script&gt;alert("xss") &amp; more&lt;/script&gt;');
  });

  test('escapes ampersands first', () => {
    const result = escapeHtml('a & b < c');
    expect(result).toBe('a &amp; b &lt; c');
  });

  test('handles null and undefined', () => {
    expect(escapeHtml(null)).toBe('');
    expect(escapeHtml(undefined)).toBe('');
  });

  test('passes through normal text unchanged', () => {
    expect(escapeHtml('Hello world')).toBe('Hello world');
    expect(escapeHtml('12345')).toBe('12345');
    expect(escapeHtml('')).toBe('');
  });
});

describe('getRankFromRating', () => {
  test('returns Grand Master for rating >= 2000', () => {
    expect(getRankFromRating(2000)).toBe('Grand Master');
    expect(getRankFromRating(2500)).toBe('Grand Master');
  });

  test('returns Master for rating 1800–1999', () => {
    expect(getRankFromRating(1800)).toBe('Master');
    expect(getRankFromRating(1900)).toBe('Master');
    expect(getRankFromRating(1999)).toBe('Master');
  });

  test('returns Pro for rating 1600–1799', () => {
    expect(getRankFromRating(1600)).toBe('Pro');
    expect(getRankFromRating(1700)).toBe('Pro');
  });

  test('returns Expert for rating 1400–1599', () => {
    expect(getRankFromRating(1400)).toBe('Expert');
    expect(getRankFromRating(1500)).toBe('Expert');
  });

  test('returns Advanced for rating 1200–1399', () => {
    expect(getRankFromRating(1200)).toBe('Advanced');
    expect(getRankFromRating(1300)).toBe('Advanced');
  });

  test('returns Amateur for rating 1000–1199', () => {
    expect(getRankFromRating(1000)).toBe('Amateur');
    expect(getRankFromRating(1100)).toBe('Amateur');
  });

  test('returns Padawan for rating < 1000', () => {
    expect(getRankFromRating(0)).toBe('Padawan');
    expect(getRankFromRating(500)).toBe('Padawan');
    expect(getRankFromRating(999)).toBe('Padawan');
  });

  test('handles string numbers', () => {
    expect(getRankFromRating('1600')).toBe('Pro');
    expect(getRankFromRating('1400')).toBe('Expert');
  });
});
