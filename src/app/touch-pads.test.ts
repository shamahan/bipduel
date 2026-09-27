import { describe, it, expect } from 'vitest';
import { TOUCH_FRAMES } from './touch-pads';
import iconsDataUrl from '../render/touch-buttons.png?inline';

describe('touch-buttons.png', () => {
  it('по кадру 16x16 на ⟲, огонь, ⟳ и ⏸ — в порядке TOUCH_FRAMES', () => {
    const png = atob(iconsDataUrl.split(',')[1]);
    const u32 = (at: number) => [0, 1, 2, 3].reduce((n, i) => n * 256 + png.charCodeAt(at + i), 0);
    expect(Object.values(TOUCH_FRAMES)).toEqual([0, 1, 2, 3]);
    expect(u32(16)).toBe(Object.keys(TOUCH_FRAMES).length * 16); // IHDR: ширина
    expect(u32(20)).toBe(16); // IHDR: высота
  });
});
