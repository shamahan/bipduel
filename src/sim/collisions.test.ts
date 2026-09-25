import { describe, it, expect } from 'vitest';
import { createInitialState } from './state';
import { step } from './step';
import { TUNING } from './tuning';
import { inputs } from './test-helpers';

function newState() {
  return createInitialState({ kind: 'endless' }, () => 0.5);
}

describe('коллизии', () => {
  it('пуля сбивает чужой самолёт, владелец получает очко', () => {
    const s = newState();
    s.planes[1].x = 400; s.planes[1].y = 300; s.planes[1].angle = 0;
    s.bullets.push({ x: 398, y: 300, vx: 0, vy: 0, ttl: 1, owner: 0 });
    step(s, inputs(), TUNING.fixedDt);
    expect(s.planes[1].alive).toBe(false);
    expect(s.scores).toEqual([1, 0]);
    expect(s.bullets).toHaveLength(0);
  });

  it('пуля не бьёт своего владельца', () => {
    const s = newState();
    s.planes[0].x = 400; s.planes[0].y = 300;
    s.bullets.push({ x: 400, y: 300, vx: 0, vy: 0, ttl: 1, owner: 0 });
    step(s, inputs(), TUNING.fixedDt);
    expect(s.planes[0].alive).toBe(true);
  });

  it('неуязвимый самолёт не поражается', () => {
    const s = newState();
    s.planes[1].x = 400; s.planes[1].y = 300; s.planes[1].invulnTimer = 1;
    s.bullets.push({ x: 400, y: 300, vx: 0, vy: 0, ttl: 1, owner: 0 });
    step(s, inputs(), TUNING.fixedDt);
    expect(s.planes[1].alive).toBe(true);
    expect(s.bullets.length).toBeGreaterThan(0);
  });

  it('столкновение самолётов убивает обоих без очков', () => {
    const s = newState();
    s.planes[0].x = 400; s.planes[0].y = 300; s.planes[0].angle = 0;
    s.planes[1].x = 405; s.planes[1].y = 300; s.planes[1].angle = Math.PI;
    step(s, inputs(), TUNING.fixedDt);
    expect(s.planes[0].alive).toBe(false);
    expect(s.planes[1].alive).toBe(false);
    expect(s.scores).toEqual([0, 0]);
  });

  it('пуля попадает через шов экрана', () => {
    const s = newState();
    s.planes[1].x = TUNING.world.width - 3; s.planes[1].y = 300; s.planes[1].angle = 0;
    s.bullets.push({ x: 1, y: 300, vx: 0, vy: 0, ttl: 1, owner: 0 });
    step(s, inputs(), TUNING.fixedDt);
    expect(s.planes[1].alive).toBe(false);
    expect(s.scores).toEqual([1, 0]);
  });

  it('неуязвимые самолёты пролетают друг сквозь друга', () => {
    const s = newState();
    s.planes[0].x = 400; s.planes[0].y = 300; s.planes[0].angle = 0; s.planes[0].invulnTimer = 1;
    s.planes[1].x = 405; s.planes[1].y = 300; s.planes[1].angle = Math.PI;
    step(s, inputs(), TUNING.fixedDt);
    expect(s.planes[0].alive).toBe(true);
    expect(s.planes[1].alive).toBe(true);
    expect(s.scores).toEqual([0, 0]);
  });
});
