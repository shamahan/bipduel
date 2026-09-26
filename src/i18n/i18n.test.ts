import { describe, it, expect } from 'vitest';
import { STRINGS } from './index';
import { LANGUAGES } from './languages';
import { TEXT_SIZE } from '../render/render';
import { menuRows } from '../app/menu';
import { MAGAZINE_OPTIONS, TARGET_OPTIONS } from '../app/settings';

const SCREEN_W = 800;
// Этих символов нет в Press Start 2P — браузер молча подставил бы другой шрифт
const MISSING_GLYPHS = ['◀', '▶', '∞', '←', '→'];
// ←/→ тоже нет, но подсказки меню рисуются через splitArrows — повёрнутой ↑ из шрифта
const DRAWN_ARROWS = ['←', '→'];

// Шрифт моноширинный: каждый символ занимает квадрат со стороной в кегль
const width = (text: string, size: number) => [...text].length * size;

function allTexts(lang: (typeof LANGUAGES)[number]): string[] {
  const t = STRINGS[lang];
  return Object.values(t).flatMap((v) => (typeof v === 'function' ? [v(1), v(50)] : [v]));
}

describe('переводы', () => {
  for (const lang of LANGUAGES) {
    const t = STRINGS[lang];

    it(`${lang}: фразы непустые и без символов, которых нет в шрифте`, () => {
      const help = [t.helpP1, t.helpP2, t.helpMenu];
      for (const text of allTexts(lang)) {
        expect(text.trim()).not.toBe('');
        const allowed = help.includes(text) ? DRAWN_ARROWS : [];
        for (const glyph of MISSING_GLYPHS) if (!allowed.includes(glyph)) expect(text).not.toContain(glyph);
      }
    });

    it(`${lang}: клавиши влево/вправо в подсказках — стрелками ←/→`, () => {
      for (const line of [t.helpP2, t.helpMenu]) {
        expect(line).toContain('←/→');
        expect(line).not.toContain('</>');
      }
    });

    it(`${lang}: фразы помещаются на свои места на экране`, () => {
      const rows: string[] = [];
      for (const target of TARGET_OPTIONS) {
        for (const magazine of MAGAZINE_OPTIONS) rows.push(...menuRows(t, { language: lang, target, magazine }));
      }
      for (const row of rows) expect(width('> ' + row, TEXT_SIZE.menu)).toBeLessThanOrEqual(SCREEN_W - 40);
      for (const line of [t.helpP1, t.helpP2, t.helpMenu, t.touchHelp, t.pauseHint, t.gameOverHint]) {
        expect(width(line, TEXT_SIZE.help)).toBeLessThanOrEqual(SCREEN_W - 20);
      }
      // кнопки паузы и конца матча на сенсорном экране стоят по две в ряд
      for (const label of [t.resume, t.toMenu, t.rematch]) {
        expect(width(label, TEXT_SIZE.button)).toBeLessThanOrEqual(320);
      }
      expect(width(t.rotate, TEXT_SIZE.button)).toBeLessThanOrEqual(SCREEN_W - 20);
      for (const title of [t.paused, t.winner(1), t.winner(2), t.matchOver]) {
        expect(width(title, TEXT_SIZE.overlayTitle)).toBeLessThanOrEqual(SCREEN_W - 20);
      }
      // «перезарядка» под счётом слева не должна доставать до надписи «до N» по центру
      expect(width(t.reloading, TEXT_SIZE.reload)).toBeLessThanOrEqual(180);
      expect(width(t.firstTo(50), TEXT_SIZE.hudTarget)).toBeLessThanOrEqual(360);
    });
  }
});
