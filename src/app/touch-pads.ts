import iconsUrl from '../render/touch-buttons.png';
import { PAD_CODES, TouchControls } from '../input/touch';
import { STRINGS } from '../i18n';
import type { Language } from '../i18n/languages';

// Кадры touch-buttons.png по 16x16 — рисует pixel-art/touch/build.py
export const TOUCH_FRAMES = { ccw: 0, fire: 1, cw: 2, pause: 3 } as const;

export type TouchPads = { sync(visible: boolean, language: Language): void };

type Label = 'turnCcw' | 'fire' | 'turnCw' | 'pause';
type PadButton = { el: HTMLButtonElement; player: number; label: Label; code: string | null; pressed: boolean };

// Полосы кнопок по бокам поля: сверху ⏸, под ней ⟲ / огонь / ⟳ на всю ширину. Кнопки боя
// срабатывают на касание, без задержки; палец можно вести с кнопки на кнопку своей полосы,
// не отрывая. ⏸ — по click, то есть по отпусканию пальца, как остальные кнопки экрана.
export function mountTouchPads(
  pads: readonly [HTMLElement, HTMLElement],
  touch: TouchControls,
  onPause: () => void,
): TouchPads {
  document.documentElement.style.setProperty('--touch-icons', `url(${iconsUrl})`);
  const buttons: PadButton[] = [];

  pads.forEach((pad, player) => {
    const add = (frame: number, label: Label, code: string | null) => {
      const el = document.createElement('button');
      el.type = 'button';
      el.className = code === null ? 'pad-btn pad-pause' : 'pad-btn';
      if (code !== null) el.dataset.code = code;
      const icon = document.createElement('span');
      icon.className = 'pad-icon';
      icon.style.setProperty('--frame', String(frame));
      el.append(icon);
      pad.append(el);
      buttons.push({ el, player, label, code, pressed: false });
      return el;
    };
    const codes = PAD_CODES[player];
    const pause = add(TOUCH_FRAMES.pause, 'pause', null);
    add(TOUCH_FRAMES.ccw, 'turnCcw', codes.ccw);
    add(TOUCH_FRAMES.fire, 'fire', codes.fire);
    add(TOUCH_FRAMES.cw, 'turnCw', codes.cw);
    pause.addEventListener('click', () => {
      pause.blur();
      onPause();
    });

    // код кнопки боя под пальцем; вне кнопок своей полосы — null
    const codeAt = (x: number, y: number): string | null => {
      const hit = document.elementFromPoint(x, y)?.closest<HTMLElement>('[data-code]');
      return hit && pad.contains(hit) ? hit.dataset.code! : null;
    };
    pad.addEventListener('pointerdown', (e) => {
      const code = codeAt(e.clientX, e.clientY);
      if (code === null) return; // ⏸ и зазоры между кнопками
      e.preventDefault(); // без фокуса, выделения и эмуляции мыши
      pad.setPointerCapture(e.pointerId); // палец, соскользнувший на поле, по-прежнему наш
      touch.press(e.pointerId, code);
    });
    pad.addEventListener('pointermove', (e) => {
      if (pad.hasPointerCapture(e.pointerId)) touch.press(e.pointerId, codeAt(e.clientX, e.clientY));
    });
    const lift = (e: PointerEvent) => touch.release(e.pointerId);
    pad.addEventListener('pointerup', lift);
    pad.addEventListener('pointercancel', lift);
    pad.addEventListener('lostpointercapture', lift);
    pad.addEventListener('contextmenu', (e) => e.preventDefault()); // долгое нажатие — не меню браузера
  });

  let shown: boolean | null = null;
  let painted: Language | null = null;
  return {
    sync(visible, language) {
      if (visible !== shown) {
        shown = visible;
        for (const pad of pads) pad.hidden = !visible;
        if (!visible) touch.clear(); // полосы спрятались под пальцами — pointerup может и не прийти
      }
      for (const b of buttons) {
        const pressed = b.code !== null && touch.isHeld(b.code);
        if (pressed !== b.pressed) b.el.classList.toggle('pressed', (b.pressed = pressed));
      }
      if (language === painted) return;
      painted = language;
      const t = STRINGS[language];
      for (const b of buttons) b.el.setAttribute('aria-label', `P${b.player + 1}: ${t[b.label]}`);
    },
  };
}
