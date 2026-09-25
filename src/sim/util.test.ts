import { describe, it, expect } from 'vitest';
import { dist, wrapAngle } from './util';

describe('util', () => {
  it('dist wraps correctly across screen seam', () => {
    expect(dist(799, 0, 1, 0)).toBeCloseTo(2);
  });

  it('dist calculates normal Euclidean distance', () => {
    expect(dist(0, 0, 3, 4)).toBeCloseTo(5);
  });

  it('wrapAngle приводит угол к (-π, π]', () => {
    expect(wrapAngle(0)).toBeCloseTo(0);
    expect(wrapAngle(3 * Math.PI)).toBeCloseTo(Math.PI);
    expect(wrapAngle(-Math.PI)).toBeCloseTo(Math.PI);
    expect(wrapAngle(-2.5 * Math.PI)).toBeCloseTo(-0.5 * Math.PI);
    expect(wrapAngle(7)).toBeCloseTo(7 - 2 * Math.PI);
  });
});
