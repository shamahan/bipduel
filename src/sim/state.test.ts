import { describe, it, expect } from 'vitest';
import { createInitialState } from './state';
import { TUNING } from './tuning';

describe('createInitialState', () => {
  it('создаёт два живых самолёта на своих сторонах с полным магазином', () => {
    const s = createInitialState({ kind: 'endless' }, () => 0.5);
    expect(s.planes).toHaveLength(2);
    expect(s.planes[0].x).toBe(TUNING.spawn.xs[0]);
    expect(s.planes[1].x).toBe(TUNING.spawn.xs[1]);
    expect(s.planes[0].alive).toBe(true);
    expect(s.planes[0].ammo).toBe(TUNING.bullet.magazine);
    expect(s.scores).toEqual([0, 0]);
    expect(s.winner).toBeNull();
    expect(s.bullets).toEqual([]);
    expect(s.events).toEqual([]);
  });

  it('самолёты стартуют на разной высоте (не зеркальный джостинг)', () => {
    const s = createInitialState({ kind: 'endless' }, () => 0.5);
    expect(s.planes[0].y).not.toBe(s.planes[1].y);
  });
});
