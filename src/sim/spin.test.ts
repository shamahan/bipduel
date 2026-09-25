import { describe, it, expect } from 'vitest';
import { createInitialState } from './state';
import { step, killPlane } from './step';
import { TUNING } from './tuning';
import { flatGroundX, inputs } from './test-helpers';

function newState() {
  const s = createInitialState({ kind: 'endless' }, () => 0.5);
  s.planes[0].x = 400; s.planes[0].y = 100; s.planes[0].angle = 0;
  // второй самолёт летит горизонтально вдали и никому не мешает
  s.planes[1].x = 700; s.planes[1].y = 400; s.planes[1].angle = Math.PI;
  return s;
}

describe('штопор', () => {
  it('касание потолка срывает в штопор', () => {
    const s = newState();
    const p = s.planes[0];
    p.y = TUNING.world.ceilingY + 2; p.angle = -Math.PI / 2; // вверх
    step(s, inputs(), TUNING.fixedDt);
    expect(p.y).toBe(TUNING.world.ceilingY);
    expect(p.spinTimer).toBe(TUNING.spin.duration);
  });

  it('в штопоре самолёт падает вниз и не слушается поворота, нос уходит вниз', () => {
    const s = newState();
    const p = s.planes[0];
    p.spinTimer = TUNING.spin.duration;
    step(s, inputs({ left: true }), 0.05);
    expect(p.x).toBe(400);
    expect(p.y).toBeCloseTo(100 + TUNING.plane.speed * 0.05);
    expect(p.angle).toBeCloseTo(TUNING.spin.pitchRate * 0.05); // от курса вправо — по часовой к низу
  });

  it('нос кратчайшим путём разворачивается вниз и там остаётся', () => {
    for (const start of [Math.PI, -Math.PI / 2 + 0.1, 3 * Math.PI]) {
      const s = newState();
      const p = s.planes[0];
      p.angle = start;
      p.spinTimer = TUNING.spin.duration;
      step(s, inputs(), 0.05);
      expect(Math.abs(p.angle - start)).toBeCloseTo(TUNING.spin.pitchRate * 0.05);
      for (let t = 0; t < 30; t++) step(s, inputs(), TUNING.fixedDt);
      expect(Math.sin(p.angle)).toBeCloseTo(1);
      expect(Math.cos(p.angle)).toBeCloseTo(0);
    }
  });

  it('в штопоре нельзя стрелять', () => {
    const s = newState();
    const p = s.planes[0];
    p.spinTimer = TUNING.spin.duration;
    step(s, inputs({ fire: true }), TUNING.fixedDt);
    expect(s.bullets).toHaveLength(0);
    expect(p.ammo).toBe(TUNING.bullet.magazine);
  });

  it('через duration управление возвращается', () => {
    const s = newState();
    const p = s.planes[0];
    p.spinTimer = TUNING.spin.duration;
    const ticks = Math.ceil(TUNING.spin.duration / TUNING.fixedDt) + 1;
    for (let t = 0; t < ticks; t++) step(s, inputs(), TUNING.fixedDt);
    expect(p.spinTimer).toBe(0);
    expect(Math.sin(p.angle)).toBeCloseTo(1); // выходит носом вниз
    const a = p.angle;
    const { x, y } = p;
    step(s, inputs({ right: true }), 0.1);
    const heading = a + TUNING.plane.turnRate * 0.1;
    expect(p.angle).toBeCloseTo(heading);
    expect(p.y - y).toBeCloseTo(Math.sin(heading) * TUNING.plane.speed * 0.1);
    expect(p.x - x).toBeCloseTo(Math.cos(heading) * TUNING.plane.speed * 0.1);
  });

  it('штопор до земли — обычная гибель без очков', () => {
    const s = newState();
    const p = s.planes[0];
    p.spinTimer = TUNING.spin.duration;
    p.x = flatGroundX();
    p.y = TUNING.world.groundY - TUNING.plane.radius - 1;
    step(s, inputs(), 0.1);
    expect(p.alive).toBe(false);
    expect(s.scores).toEqual([0, 0]);
  });

  it('в штопоре самолёт уязвим для пуль', () => {
    const s = newState();
    const p = s.planes[0];
    p.spinTimer = TUNING.spin.duration;
    s.bullets.push({ x: 400, y: 102, vx: 0, vy: 0, ttl: 1, owner: 1 });
    step(s, inputs(), TUNING.fixedDt);
    expect(p.alive).toBe(false);
    expect(s.scores).toEqual([0, 1]);
  });

  it('респаун сбрасывает штопор', () => {
    const s = newState();
    const p = s.planes[0];
    p.spinTimer = 0.5;
    killPlane(s, 0, null);
    const maxTicks = Math.ceil((TUNING.respawn.delay + 0.1) / TUNING.fixedDt);
    for (let t = 0; t < maxTicks && !p.alive; t++) step(s, inputs(), TUNING.fixedDt);
    expect(p.alive).toBe(true);
    expect(p.spinTimer).toBe(0);
  });
});
