import { describe, it, expect } from 'vitest';
import { createInitialState } from './state';
import { step, killPlane } from './step';
import { TUNING } from './tuning';
import { inputs } from './test-helpers';

describe('правила матча', () => {
  it('N-я победа в режиме first-to выставляет winner', () => {
    const s = createInitialState({ kind: 'first-to', target: 2 }, () => 0.5);
    killPlane(s, 1, 0);
    expect(s.winner).toBeNull();
    // ждём респауна и убиваем снова
    const ticks = Math.ceil((TUNING.respawn.delay + 0.1) / TUNING.fixedDt);
    for (let t = 0; t < ticks; t++) step(s, inputs(), TUNING.fixedDt);
    killPlane(s, 1, 0);
    expect(s.winner).toBe(0);
  });

  it('после победы мир заморожен', () => {
    const s = createInitialState({ kind: 'first-to', target: 1 }, () => 0.5);
    killPlane(s, 1, 0);
    expect(s.winner).toBe(0);
    const x0 = s.planes[0].x;
    step(s, inputs(), 1);
    expect(s.planes[0].x).toBe(x0);
  });

  it('в endless winner не выставляется', () => {
    const s = createInitialState({ kind: 'endless' }, () => 0.5);
    for (let k = 0; k < 50; k++) killPlane(s, 1, 0);
    expect(s.winner).toBeNull();
  });

  it('одновременное обоюдное убийство не даёт второму убийце украсть победу', () => {
    const s = createInitialState({ kind: 'first-to', target: 1 }, () => 0.5);
    killPlane(s, 1, 0);
    killPlane(s, 0, 1);
    expect(s.winner).toBe(0);
    expect(s.scores).toEqual([1, 0]);
    expect(s.planes[0].alive).toBe(false);
    expect(s.planes[1].alive).toBe(false);
  });

  it('после победы взрывы и облака всё ещё анимируются', () => {
    const s = createInitialState({ kind: 'first-to', target: 1 }, () => 0.5);
    killPlane(s, 1, 0);
    expect(s.winner).toBe(0);
    const age0 = s.explosions[0].age;
    step(s, inputs(), 0.1);
    expect(s.explosions[0].age).toBeGreaterThan(age0);
  });
});
