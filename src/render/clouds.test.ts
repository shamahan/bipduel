import { describe, expect, it } from 'vitest';
import { PUFF_RADII, cloudPixels, layoutPuffs } from './clouds';
import { COLORS } from './palette';
import { TUNING } from '../sim/tuning';

// все размеры облаков, которые может выдать createClouds, по нескольку сидов на каждый
const CASES = TUNING.clouds.kinds.flatMap((k) =>
  [k.minRx, k.maxRx].flatMap((rx) =>
    [k.minRy, k.maxRy].flatMap((ry) => Array.from({ length: 20 }, (_, seed) => ({ rx, ry, seed }))),
  ),
);

describe('layoutPuffs', () => {
  it('одинаковый seed — одинаковое облако, разный — разное', () => {
    expect(layoutPuffs(7, 90, 26)).toEqual(layoutPuffs(7, 90, 26));
    expect(layoutPuffs(1, 90, 26)).not.toEqual(layoutPuffs(2, 90, 26));
  });

  it('центры клубов внутри эллипса и не ниже его середины', () => {
    for (const { rx, ry, seed } of CASES) {
      for (const p of layoutPuffs(seed, rx, ry)) {
        expect(p.dy).toBeLessThanOrEqual(0);
        expect((p.dx / rx) ** 2 + (p.dy / ry) ** 2).toBeLessThanOrEqual(1);
      }
    }
  });

  it('клубы тянутся на всю ширину и торчат над телом — край рваный', () => {
    for (const { rx, ry, seed } of CASES) {
      const puffs = layoutPuffs(seed, rx, ry);
      const r = (p: { v: number }) => PUFF_RADII[p.v];
      expect(Math.min(...puffs.map((p) => p.dx - r(p)))).toBeLessThanOrEqual(-rx * 0.85);
      expect(Math.max(...puffs.map((p) => p.dx + r(p)))).toBeGreaterThanOrEqual(rx * 0.85);
      expect(Math.min(...puffs.map((p) => p.dy - r(p)))).toBeLessThan(-ry);
    }
  });

  it('клубы соразмерны облаку и целочисленны', () => {
    for (const { rx, ry, seed } of CASES) {
      for (const p of layoutPuffs(seed, rx, ry)) {
        expect(PUFF_RADII[p.v]).toBeDefined();
        expect(PUFF_RADII[p.v]).toBeLessThanOrEqual(ry * 0.75);
        expect(Number.isInteger(p.dx) && Number.isInteger(p.dy)).toBe(true);
      }
    }
  });
});

describe('cloudPixels', () => {
  const FEW = CASES.filter((c) => c.seed < 4);
  const hex = (d: Uint8ClampedArray, i: number) =>
    '#' + [d[i], d[i + 1], d[i + 2]].map((v) => v.toString(16).padStart(2, '0')).join('');

  it('тело закрывает весь эллипс, в котором самолёт невидим', () => {
    const holes: string[] = [];
    for (const { rx, ry, seed } of FEW) {
      const { width, height, data } = cloudPixels(rx, ry, seed);
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const u = (x + 0.5 - width / 2) / rx;
          const v = (y + 0.5 - height / 2) / ry;
          if (u * u + v * v <= 1 && data[(y * width + x) * 4 + 3] !== 255) holes.push(`${rx}x${ry}#${seed} (${x},${y})`);
        }
      }
    }
    expect(holes).toEqual([]);
  });

  it('рисует только тонами облака из палитры, край без полупрозрачности', () => {
    const tones = new Set<string>(COLORS.cloudTones);
    const bad = new Set<string>();
    for (const { rx, ry, seed } of FEW) {
      const { data } = cloudPixels(rx, ry, seed);
      for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] !== 0 && data[i + 3] !== 255) bad.add(`alpha ${data[i + 3]}`);
        if (data[i + 3] && !tones.has(hex(data, i))) bad.add(hex(data, i));
      }
    }
    expect([...bad]).toEqual([]);
  });

  it('одинаковый seed — одинаковые пиксели', () => {
    expect(cloudPixels(90, 26, 7).data).toEqual(cloudPixels(90, 26, 7).data);
  });

  it('объём, а не заливка: большое облако использует все тона, малое — хотя бы четыре', () => {
    for (const { rx, ry, seed } of FEW) {
      const { data } = cloudPixels(rx, ry, seed);
      const used = new Set<string>();
      for (let i = 0; i < data.length; i += 4) if (data[i + 3]) used.add(hex(data, i));
      expect(used.size).toBeGreaterThanOrEqual(rx >= 80 ? COLORS.cloudTones.length : 4);
    }
  });

  it('свет сверху: верхняя треть облака светлее нижней', () => {
    for (const { rx, ry, seed } of FEW) {
      const { width, height, data } = cloudPixels(rx, ry, seed);
      const rows: number[] = [];
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const i = (y * width + x) * 4;
          if (data[i + 3]) rows.push(y);
        }
      }
      const top = Math.min(...rows);
      const span = Math.max(...rows) - top + 1;
      const light = (from: number, to: number) => {
        let sum = 0;
        let n = 0;
        for (let y = top + from; y < top + to; y++) {
          for (let x = 0; x < width; x++) {
            const i = (y * width + x) * 4;
            if (data[i + 3]) {
              sum += data[i] + data[i + 1] + data[i + 2];
              n++;
            }
          }
        }
        return sum / n;
      };
      expect(light(0, Math.floor(span / 3))).toBeGreaterThan(light(Math.ceil((span * 2) / 3), span));
    }
  });
});
