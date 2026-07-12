// tests/i18n.test.js
import { describe, test, expect, beforeEach, jest } from '@jest/globals';

const translations = {
  es: {
    nav_home: '🏠 Inicio',
    nav_ka_esports: '🏆 KA ESPORTS',
    loading: 'Cargando...',
    error: 'Error',
    col_player: 'Jugador',
    col_rating: 'Rating',
  },
  en: {
    nav_home: '🏠 Home',
    nav_ka_esports: '🏆 KA ESPORTS',
    loading: 'Loading...',
    error: 'Error',
    col_player: 'Player',
    col_rating: 'Rating',
  },
};

function createI18n() {
  const STORAGE_KEY = 'ka_lang';
  let currentLang = 'es';
  const I18n = {
    t(key) {
      return translations[currentLang]?.[key] ?? key;
    },
    getLang() {
      return currentLang;
    },
    setLang(lang) {
      currentLang = lang;
      try {
        localStorage.setItem(STORAGE_KEY, lang);
      } catch (e) { /* noop */ }
      return currentLang;
    },
    translatePage() {
      document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (key) el.textContent = this.t(key);
      });
    },
  };
  return I18n;
}

describe('I18n', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  test('t() returns correct Spanish translation', () => {
    const I18n = createI18n();
    expect(I18n.t('nav_home')).toBe('🏠 Inicio');
    expect(I18n.t('col_player')).toBe('Jugador');
    expect(I18n.t('error')).toBe('Error');
  });

  test('t() returns correct English translation after setLang', () => {
    const I18n = createI18n();
    I18n.setLang('en');
    expect(I18n.t('nav_home')).toBe('🏠 Home');
    expect(I18n.t('col_player')).toBe('Player');
    expect(I18n.t('loading')).toBe('Loading...');
  });

  test('setLang() changes language and persists to localStorage', () => {
    const I18n = createI18n();
    const spy = jest.spyOn(Storage.prototype, 'setItem');
    I18n.setLang('en');
    expect(I18n.getLang()).toBe('en');
    expect(spy).toHaveBeenCalledWith('ka_lang', 'en');
  });

  test('t() returns the key itself for missing translations (fallback)', () => {
    const I18n = createI18n();
    expect(I18n.t('nonexistent_key')).toBe('nonexistent_key');
    I18n.setLang('en');
    expect(I18n.t('nonexistent_key')).toBe('nonexistent_key');
  });

  test('translatePage() sets textContent for [data-i18n] elements', () => {
    const I18n = createI18n();
    document.body.innerHTML = `
      <span data-i18n="nav_home">placeholder</span>
      <span data-i18n="loading">placeholder</span>
    `;
    I18n.translatePage();
    const spans = document.querySelectorAll('[data-i18n]');
    expect(spans[0].textContent).toBe('🏠 Inicio');
    expect(spans[1].textContent).toBe('Cargando...');
  });
});
