import { describe, it, expect } from 'vitest';
import {
  MAGAZINE_OPTIONS,
  SETTINGS_KEY,
  TARGET_OPTIONS,
  SettingsStorage,
  detectLanguage,
  loadSettings,
  nextOption,
  saveSettings,
} from './settings';

function memoryStorage(initial: Record<string, string> = {}): SettingsStorage & { data: Record<string, string> } {
  const data = { ...initial };
  return {
    data,
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => {
      data[k] = v;
    },
  };
}

const brokenStorage: SettingsStorage = {
  getItem: () => {
    throw new Error('SecurityError');
  },
  setItem: () => {
    throw new Error('QuotaExceededError');
  },
};

describe('настройки', () => {
  it('без сохранённых настроек: язык браузера, до 10 очков, 5 патронов', () => {
    expect(loadSettings(memoryStorage(), ['uk-UA', 'en'])).toEqual({ language: 'uk', target: 10, magazine: 5 });
  });

  it('язык браузера: первый поддерживаемый по префиксу, иначе английский', () => {
    expect(detectLanguage(['ja-JP', 'pt-BR', 'de'])).toBe('pt');
    expect(detectLanguage(['ja', 'zh-CN'])).toBe('en');
    expect(detectLanguage([])).toBe('en');
  });

  it('сохранённые настройки читаются обратно, включая «без лимита»', () => {
    const storage = memoryStorage();
    saveSettings(storage, { language: 'pl', target: null, magazine: 20 });
    expect(loadSettings(storage, ['en'])).toEqual({ language: 'pl', target: null, magazine: 20 });
  });

  it('битое поле заменяется значением по умолчанию, остальные сохраняются', () => {
    const storage = memoryStorage({
      [SETTINGS_KEY]: JSON.stringify({ language: 'xx', target: 35, magazine: 7 }),
    });
    expect(loadSettings(storage, ['fr'])).toEqual({ language: 'fr', target: 35, magazine: 5 });
  });

  it('битый JSON и чужие данные дают значения по умолчанию', () => {
    expect(loadSettings(memoryStorage({ [SETTINGS_KEY]: '{oops' }), ['de'])).toEqual({ language: 'de', target: 10, magazine: 5 });
    expect(loadSettings(memoryStorage({ [SETTINGS_KEY]: '[1,2]' }), ['de']).language).toBe('de');
  });

  it('недоступное хранилище не ломает игру', () => {
    expect(loadSettings(brokenStorage, ['ru'])).toEqual({ language: 'ru', target: 10, magazine: 5 });
    expect(() => saveSettings(brokenStorage, { language: 'ru', target: 10, magazine: 5 })).not.toThrow();
    expect(loadSettings(null, ['ru']).language).toBe('ru');
  });

  it('варианты: очки 5–50 шагом 5 и без лимита, патроны 5–20 шагом 5', () => {
    expect(TARGET_OPTIONS).toEqual([5, 10, 15, 20, 25, 30, 35, 40, 45, 50, null]);
    expect(MAGAZINE_OPTIONS).toEqual([5, 10, 15, 20]);
  });

  it('nextOption листает по кругу в обе стороны', () => {
    expect(nextOption(MAGAZINE_OPTIONS, 20, 1)).toBe(5);
    expect(nextOption(MAGAZINE_OPTIONS, 5, -1)).toBe(20);
    expect(nextOption(TARGET_OPTIONS, 50, 1)).toBeNull();
    expect(nextOption(TARGET_OPTIONS, null, 1)).toBe(5);
  });
});
