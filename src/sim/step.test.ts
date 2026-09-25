import { describe, it, expect } from 'vitest';
import { createInitialState } from './state';
import { step } from './step';
import { TUNING } from './tuning';
import { inputs } from './test-helpers';

function newState() {
  return createInitialState({ kind: 'endless' }, () => 0.5);
}

describe('движение', () => {
  it('самолёт летит с постоянной скоростью в направлении носа', () => {
    const s = newState();
    const p = s.planes[0];
    p.x = 400; p.y = 300; p.angle = 0;
    step(s, inputs(), 0.5);
    expect(p.x).toBeCloseTo(400 + TUNING.plane.speed * 0.5);
    expect(p.y).toBeCloseTo(300);
  });

  it('left уменьшает угол, right увеличивает', () => {
    const s = newState();
    const a0 = s.planes[0].angle;
    step(s, inputs({ left: true }), 0.1);
    expect(s.planes[0].angle).toBeCloseTo(a0 - TUNING.plane.turnRate * 0.1);
    const s2 = newState();
    step(s2, inputs({ right: true }), 0.1);
    expect(s2.planes[0].angle).toBeCloseTo(a0 + TUNING.plane.turnRate * 0.1);
  });

  it('экран заворачивается по горизонтали', () => {
    const s = newState();
    const p = s.planes[0];
    p.x = TUNING.world.width - 1; p.y = 300; p.angle = 0;
    step(s, inputs(), 0.1);
    expect(p.x).toBeCloseTo(TUNING.plane.speed * 0.1 - 1);
  });

  it('выше потолка подняться нельзя', () => {
    const s = newState();
    const p = s.planes[0];
    p.x = 400; p.y = TUNING.world.ceilingY + 2; p.angle = -Math.PI / 2; // вверх
    step(s, inputs(), 0.5);
    expect(p.y).toBe(TUNING.world.ceilingY);
  });
});

describe('часы матча', () => {
  it('матч начинается с нуля, и step накапливает прошедшее время', () => {
    const s = newState();
    expect(s.time).toBe(0);
    step(s, inputs(), 0.5);
    step(s, inputs(), 0.25);
    expect(s.time).toBeCloseTo(0.75);
  });
});
