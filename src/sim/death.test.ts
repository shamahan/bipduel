import { describe, it, expect } from 'vitest';
import { createInitialState } from './state';
import { step, killPlane } from './step';
import { TUNING } from './tuning';
import { flatGroundX, inputs, tallestColumn } from './test-helpers';
import { circleHitsTerrain } from './terrain';
import { SKYLINE } from './skyline';

function newState() {
  return createInitialState({ kind: 'endless' }, () => 0.5);
}

describe('земля и респаун', () => {
  it('касание земли — взрыв без очков', () => {
    const s = newState();
    const p = s.planes[0];
    p.x = flatGroundX(); p.y = TUNING.world.groundY - TUNING.plane.radius - 1; p.angle = Math.PI / 2; // вниз
    step(s, inputs(), 0.1);
    expect(p.alive).toBe(false);
    expect(s.explosions).toHaveLength(1);
    expect(s.scores).toEqual([0, 0]);
    expect(s.events).toContain('explosion');
  });

  it('таран постройки выше старой линии земли — такая же гибель', () => {
    const s = newState();
    const p = s.planes[0];
    const tower = tallestColumn();
    p.x = tower.x - 20; p.y = tower.top + 5; p.angle = 0; // горизонтально прямо в башню
    expect(circleHitsTerrain(SKYLINE, p.x, p.y, TUNING.plane.radius)).toBe(false);
    step(s, inputs(), 0.1);
    expect(p.alive).toBe(false);
    expect(s.explosions).toHaveLength(1);
    expect(s.scores).toEqual([0, 0]);
  });

  it('после delay секунд самолёт возрождается на своей стороне с неуязвимостью', () => {
    const s = newState();
    killPlane(s, 0, null);
    const p = s.planes[0];
    const maxTicks = Math.ceil((TUNING.respawn.delay + 0.1) / TUNING.fixedDt);
    let ticks = 0;
    while (!p.alive && ticks < maxTicks) {
      step(s, inputs(), TUNING.fixedDt);
      ticks++;
    }
    expect(p.alive).toBe(true);
    expect(ticks * TUNING.fixedDt).toBeGreaterThanOrEqual(TUNING.respawn.delay - 1e-9);
    expect(p.x).toBe(TUNING.spawn.xs[0]);
    expect(p.y).toBe(TUNING.spawn.ys[0]);
    expect(p.invulnTimer).toBeGreaterThan(0);
    expect(p.ammo).toBe(TUNING.bullet.magazine);
  });

  it('killPlane со scorer начисляет очко', () => {
    const s = newState();
    killPlane(s, 1, 0);
    expect(s.scores).toEqual([1, 0]);
  });
});
