import { describe, expect, it } from 'vitest';
import { recolorRedToBlue } from './sprites';

function px(hex: string, a = 255): number[] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255, a];
}

function recolorOne(hex: string, a = 255): number[] {
  return Array.from(recolorRedToBlue(new Uint8ClampedArray(px(hex, a))));
}

describe('recolorRedToBlue', () => {
  it('перекрашивает красный корпус в синий', () => {
    const [r, g, b, a] = recolorOne('#b52b30');
    expect(b).toBeGreaterThan(150);
    expect(b).toBeGreaterThan(g);
    expect(g).toBeGreaterThan(r);
    expect(a).toBe(255);
  });

  it('тёмно-красный контур становится тёмно-синим', () => {
    const [r, g, b] = recolorOne('#2b0e15');
    expect(b).toBeGreaterThan(r);
    expect(Math.max(r, g, b)).toBeLessThan(60);
  });

  it('не трогает дерево пропеллера, кожу пилота и серые стойки', () => {
    for (const hex of ['#a56a4c', '#844f3f', '#e6cd96', '#5a686c', '#a9a9a0']) {
      expect(recolorOne(hex)).toEqual(px(hex));
    }
  });

  it('не трогает прозрачные пиксели', () => {
    expect(recolorOne('#b52b30', 0)).toEqual(px('#b52b30', 0));
  });

  it('обрабатывает каждый пиксель массива и не меняет исходный', () => {
    const src = new Uint8ClampedArray([...px('#b52b30'), ...px('#a56a4c')]);
    const out = recolorRedToBlue(src);
    expect(Array.from(src)).toEqual([...px('#b52b30'), ...px('#a56a4c')]);
    expect(out[2]).toBeGreaterThan(out[0]);
    expect(Array.from(out.slice(4))).toEqual(px('#a56a4c'));
  });
});
