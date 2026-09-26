import { describe, it, expect } from 'vitest';
import { menuZones } from './menu-hit';
import { MENU_ITEMS } from './menu';
import { MENU_STEP, MENU_TOP, TEXT_SIZE } from '../render/render';
import { TUNING } from '../sim/tuning';

const W = TUNING.world.width;
const SHARE_TOP = 532; // верх ряда «поделиться»: bottom 4.5cqw и высота иконок 4cqw в index.html

describe('зоны касания меню', () => {
  const zones = menuZones();
  const row = (i: number) => zones.filter((z) => z.index === i);

  it('зона строки накрывает её текст', () => {
    MENU_ITEMS.forEach((_, i) => {
      const top = MENU_TOP + i * MENU_STEP;
      for (const z of row(i)) {
        expect(z.y).toBeLessThanOrEqual(top);
        expect(z.y + z.h).toBeGreaterThanOrEqual(top + TEXT_SIZE.menu);
      }
    });
  });

  it('строки стыкуются без щелей и не залезают друг на друга', () => {
    for (let i = 1; i < MENU_ITEMS.length; i++) {
      const [prev] = row(i - 1);
      const [cur] = row(i);
      expect(cur.y).toBe(prev.y + prev.h);
    }
  });

  it('«Играть» — одна зона на всю ширину, строка настройки — половины назад и вперёд', () => {
    expect(MENU_ITEMS[0]).toBe('play');
    expect(row(0).map((z) => [z.dir, z.x, z.w])).toEqual([[0, 0, W]]);
    for (let i = 1; i < MENU_ITEMS.length; i++) {
      expect(row(i).map((z) => [z.dir, z.x, z.w])).toEqual([[-1, 0, W / 2], [1, W / 2, W / 2]]);
    }
  });

  it('зоны кончаются выше ряда «поделиться»', () => {
    for (const z of zones) expect(z.y + z.h).toBeLessThanOrEqual(SHARE_TOP);
  });
});
