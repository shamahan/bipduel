import { STRINGS } from '../i18n';
import type { Language } from '../i18n/languages';

export type TouchMode = {
  readonly on: boolean;
  // сенсорный режим в портрете: поле закрыто надписью «Поверните телефон», матч должен стоять
  readonly portrait: boolean;
  set(on: boolean): void;
  sync(language: Language): void;
};

// Сенсорный режим — data-input="touch" на <html>: по нему CSS освобождает место под кнопки по бокам
// поля и в портрете закрывает всё надписью. Включается, если у устройства только палец, и при любом
// касании; main.ts выключает его игровой клавишей (планшет с клавиатурой, сенсорный ноутбук).
export function mountTouchMode(html: HTMLElement, rotate: HTMLElement): TouchMode {
  const portrait = window.matchMedia('(orientation: portrait)');
  let on = false;
  let painted: Language | null = null;
  const mode: TouchMode = {
    get on() {
      return on;
    },
    get portrait() {
      return on && portrait.matches;
    },
    set(value) {
      if (value === on) return;
      on = value;
      if (on) html.dataset.input = 'touch';
      else delete html.dataset.input;
    },
    sync(language) {
      if (language === painted) return;
      painted = language;
      rotate.textContent = STRINGS[language].rotate;
    },
  };
  mode.set(window.matchMedia('(pointer: coarse)').matches && !window.matchMedia('(any-pointer: fine)').matches);
  window.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'touch') mode.set(true);
  }, true);
  return mode;
}
