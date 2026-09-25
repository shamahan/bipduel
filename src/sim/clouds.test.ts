import { describe, it, expect } from 'vitest';
import { createInitialState, createClouds } from './state';
import { isPlaneHidden } from './visibility';
import { step } from './step';
import { TUNING } from './tuning';
import { inputs } from './test-helpers';
import type { Plane } from './state';

describe('облака', () => {
  it('создаёт мелкие облака и тучи своих размеров внутри прямоугольника спавна', () => {
    const [small, big] = TUNING.clouds.kinds;
    for (const r of [0, 0.5, 0.999]) {
      const clouds = createClouds(() => r);
      expect(clouds).toHaveLength(small.count + big.count);
      clouds.forEach((c, i) => {
        const k = i < small.count ? small : big;
        expect(c.rx).toBeGreaterThanOrEqual(k.minRx);
        expect(c.rx).toBeLessThanOrEqual(k.maxRx);
        expect(c.ry).toBeGreaterThanOrEqual(k.minRy);
        expect(c.ry).toBeLessThanOrEqual(k.maxRy);
        expect(Number.isInteger(c.rx) && Number.isInteger(c.ry)).toBe(true); // пиксельное тело облака
        expect(c.y - c.ry).toBeGreaterThanOrEqual(TUNING.clouds.area.top);
        expect(c.y + c.ry).toBeLessThanOrEqual(TUNING.clouds.area.bottom);
        expect(Number.isInteger(c.seed) && c.seed >= 0).toBe(true);
      });
    }
  });

  it('облака одного вида спавнятся в разных частях экрана и на разной высоте', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const clouds = createClouds(lcg(seed));
      let from = 0;
      for (const k of TUNING.clouds.kinds) {
        const group = clouds.slice(from, from + k.count);
        from += k.count;
        for (let i = 0; i < group.length; i++) {
          for (let j = i + 1; j < group.length; j++) {
            const a = group[i];
            const b = group[j];
            expect(wrapDistX(a.x, b.x)).toBeGreaterThanOrEqual(a.rx + b.rx);
            expect(Math.abs(a.y - b.y)).toBeGreaterThanOrEqual(a.ry + b.ry);
          }
        }
      }
    }
  });

  it('createInitialState содержит облака всех видов', () => {
    const s = createInitialState({ kind: 'endless' }, () => 0.5);
    const total = TUNING.clouds.kinds.reduce((n, k) => n + k.count, 0);
    expect(s.clouds).toHaveLength(total);
  });

  it('облака дрейфуют и заворачиваются по X', () => {
    const s = createInitialState({ kind: 'endless' }, () => 0.5);
    s.clouds[0].x = TUNING.world.width - 0.5;
    s.clouds[0].vx = 10;
    step(s, inputs(), 1);
    expect(s.clouds[0].x).toBeCloseTo(9.5);
  });

  it('isPlaneHidden: внутри эллипса — true, снаружи — false', () => {
    const cloud = { x: 400, y: 200, rx: 60, ry: 26, vx: 0, seed: 0 };
    const inPlane: Plane = { ...basePlane(), x: 410, y: 205 };
    const outPlane: Plane = { ...basePlane(), x: 500, y: 205 };
    expect(isPlaneHidden(inPlane, [cloud])).toBe(true);
    expect(isPlaneHidden(outPlane, [cloud])).toBe(false);
  });

  it('isPlaneHidden: wrap-aware на X (облако в 790, самолет в 10)', () => {
    const cloud = { x: 790, y: 200, rx: 60, ry: 26, vx: 0, seed: 0 };
    const plane: Plane = { ...basePlane(), x: 10, y: 200 };
    expect(isPlaneHidden(plane, [cloud])).toBe(true);
  });
});

function basePlane(): Plane {
  return {
    x: 0, y: 0, angle: 0, alive: true, respawnTimer: 0,
    invulnTimer: 0, ammo: 20, reloadTimer: 0, cooldownTimer: 0, spinTimer: 0,
  };
}

function lcg(seed: number): () => number {
  let x = seed;
  return () => {
    x = (x * 1664525 + 1013904223) % 2 ** 32;
    return x / 2 ** 32;
  };
}

function wrapDistX(a: number, b: number): number {
  const d = Math.abs(a - b) % TUNING.world.width;
  return Math.min(d, TUNING.world.width - d);
}
