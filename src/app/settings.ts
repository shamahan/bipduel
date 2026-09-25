import { LANGUAGES, Language } from '../i18n/languages';
import { TUNING } from '../sim/tuning';

export type Settings = {
  language: Language;
  target: number | null; // очков до победы; null — без лимита
  magazine: number;
};

export const TARGET_OPTIONS: readonly (number | null)[] = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, null];
export const MAGAZINE_OPTIONS: readonly number[] = [5, 10, 15, 20];
export const SETTINGS_KEY = 'bipduel.settings';

export type SettingsStorage = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
};

export function detectLanguage(browserLanguages: readonly string[]): Language {
  for (const tag of browserLanguages) {
    const code = tag.toLowerCase().split('-')[0];
    const language = LANGUAGES.find((l) => l === code);
    if (language) return language;
  }
  return 'en';
}

export function loadSettings(storage: SettingsStorage | null, browserLanguages: readonly string[]): Settings {
  const defaults: Settings = { language: detectLanguage(browserLanguages), target: 10, magazine: TUNING.bullet.magazine };
  let raw: unknown = null;
  try {
    const text = storage?.getItem(SETTINGS_KEY);
    raw = text ? JSON.parse(text) : null;
  } catch {
    raw = null; // приватный режим, запрет хранилища или битый JSON — играем с настройками по умолчанию
  }
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return defaults;
  const r = raw as Record<string, unknown>;
  return {
    language: LANGUAGES.find((l) => l === r.language) ?? defaults.language,
    target: TARGET_OPTIONS.includes(r.target as number | null) ? (r.target as number | null) : defaults.target,
    magazine: MAGAZINE_OPTIONS.includes(r.magazine as number) ? (r.magazine as number) : defaults.magazine,
  };
}

export function saveSettings(storage: SettingsStorage | null, settings: Settings): void {
  try {
    storage?.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // без хранилища настройки просто не запоминаются
  }
}

export function nextOption<T>(options: readonly T[], current: T, dir: 1 | -1): T {
  const i = options.indexOf(current);
  return options[(i + dir + options.length) % options.length];
}
