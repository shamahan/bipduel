import { TUNING } from '../sim/tuning';
import { MENU_STEP, MENU_TOP, TEXT_SIZE } from '../render/render';
import { MENU_ITEMS } from './menu';

const W = TUNING.world.width;
const CQW = W / 100; // 1cqw = 8 px канваса: #stage шириной 100cqw

// Зона касания строки меню в пикселях канваса. dir: 0 — действие строки, −1/+1 — листать значение.
export type MenuZone = { index: number; dir: -1 | 0 | 1; x: number; y: number; w: number; h: number };

// По тем же MENU_TOP/MENU_STEP, что рисует drawMenu: зона высотой в шаг строки, текст посередине,
// соседние стыкуются без щелей. «Играть» — одна зона на всю ширину, у настройки — половины ‹ и ›.
export function menuZones(): MenuZone[] {
  return MENU_ITEMS.flatMap((item, index): MenuZone[] => {
    const y = MENU_TOP + index * MENU_STEP - (MENU_STEP - TEXT_SIZE.menu) / 2;
    const h = MENU_STEP;
    if (item === 'play') return [{ index, dir: 0, x: 0, y, w: W, h }];
    return [
      { index, dir: -1, x: 0, y, w: W / 2, h },
      { index, dir: 1, x: W / 2, y, w: W / 2, h },
    ];
  });
}

export type MenuHit = { sync(visible: boolean): void };

// «В меню» с оверлея паузы/конца матча лежит над правой половиной верхних строк меню — гасим
// тап по зоне, что пришёл слишком скоро после появления зон: это инерция того же двойного тапа.
const DOUBLE_TAP_GUARD_MS = 350;

// Невидимые зоны поверх строк меню — под палец и под мышь. Текст по-прежнему рисует канвас;
// скринридеру и Tab зоны не видны: с клавиатуры меню управляется стрелками.
export function mountMenuHit(root: HTMLElement, onTap: (index: number, dir: -1 | 0 | 1) => void): MenuHit {
  root.setAttribute('aria-hidden', 'true');
  let shownAt = 0;
  for (const z of menuZones()) {
    const el = document.createElement('div');
    el.className = 'menu-hit';
    el.style.left = `${z.x / CQW}cqw`;
    el.style.top = `${z.y / CQW}cqw`;
    el.style.width = `${z.w / CQW}cqw`;
    el.style.height = `${z.h / CQW}cqw`;
    el.addEventListener('click', () => {
      if (performance.now() - shownAt < DOUBLE_TAP_GUARD_MS) return;
      onTap(z.index, z.dir); // click — по отпусканию: так iOS разрешит звук
    });
    root.append(el);
  }
  let shown: boolean | null = null;
  return {
    sync(visible) {
      if (visible !== shown) {
        if (visible) shownAt = performance.now(); // ребро скрыто → видно
        root.hidden = !(shown = visible);
      }
    },
  };
}
