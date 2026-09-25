import { describe, it, expect } from 'vitest';
import { createInitialState } from './state';
import { step, killPlane } from './step';
import { TUNING } from './tuning';
import { flatGroundX, inputs, tallestColumn } from './test-helpers';

function newState() {
  const s = createInitialState({ kind: 'endless' }, () => 0.5);
  // разводим самолёты, чтобы пули не долетали
  s.planes[0].x = 100; s.planes[0].y = 100; s.planes[0].angle = 0;
  s.planes[1].x = 700; s.planes[1].y = 400; s.planes[1].angle = Math.PI;
  return s;
}

describe('стрельба', () => {
  it('fire спавнит пулю у носа и тратит патрон', () => {
    const s = newState();
    step(s, inputs({ fire: true }), TUNING.fixedDt);
    expect(s.bullets).toHaveLength(1);
    expect(s.bullets[0].owner).toBe(0);
    expect(s.planes[0].ammo).toBe(TUNING.bullet.magazine - 1);
    expect(s.events).toContain('shot');
  });

  it('кулдаун не даёт стрелять каждый тик', () => {
    const s = newState();
    step(s, inputs({ fire: true }), TUNING.fixedDt);
    step(s, inputs({ fire: true }), TUNING.fixedDt);
    expect(s.bullets).toHaveLength(1);
  });

  it('пустой магазин запускает перезарядку, после неё магазин полон', () => {
    const s = newState();
    s.planes[0].ammo = 1;
    step(s, inputs({ fire: true }), TUNING.fixedDt);
    expect(s.planes[0].ammo).toBe(0);
    expect(s.planes[0].reloadTimer).toBeGreaterThan(0);
    // во время перезарядки стрелять нельзя
    const cooldownTicks = Math.ceil(TUNING.bullet.cooldown / TUNING.fixedDt) + 1;
    for (let t = 0; t < cooldownTicks; t++) step(s, inputs({ fire: true }), TUNING.fixedDt);
    expect(s.planes[0].ammo).toBe(0);
    // дожидаемся конца перезарядки
    const ticks = Math.ceil(TUNING.bullet.reloadTime / TUNING.fixedDt) + 1;
    let sawReloadDone = false;
    for (let t = 0; t < ticks; t++) {
      step(s, inputs(), TUNING.fixedDt);
      if (s.events.includes('reloadDone')) sawReloadDone = true;
    }
    expect(s.planes[0].ammo).toBe(TUNING.bullet.magazine);
    expect(sawReloadDone).toBe(true);
  });

  it('пуля исчезает по истечении ttl', () => {
    const s = newState();
    step(s, inputs({ fire: true }), TUNING.fixedDt);
    const ticks = Math.ceil(TUNING.bullet.ttl / TUNING.fixedDt) + 2;
    for (let t = 0; t < ticks; t++) step(s, inputs(), TUNING.fixedDt);
    expect(s.bullets).toHaveLength(0);
  });

  it('пуля исчезает при попадании в землю', () => {
    const s = newState();
    s.bullets.push({ x: flatGroundX(), y: TUNING.world.groundY - 1, vx: 0, vy: 100, ttl: 1, owner: 0 });
    step(s, inputs(), TUNING.fixedDt);
    expect(s.bullets).toHaveLength(0);
  });

  it('пуля гаснет о постройку выше старой линии земли', () => {
    const s = newState();
    const tower = tallestColumn();
    s.bullets.push({ x: tower.x + 0.5, y: tower.top + 2, vx: 0, vy: 0, ttl: 1, owner: 0 });
    step(s, inputs(), TUNING.fixedDt);
    expect(s.bullets).toHaveLength(0);
  });

  it('во время неуязвимости после респауна стрелять нельзя', () => {
    const s = newState();
    const p = s.planes[0];
    p.invulnTimer = 0.5;
    step(s, inputs({ fire: true }), TUNING.fixedDt);
    expect(s.bullets).toHaveLength(0);
    expect(p.ammo).toBe(TUNING.bullet.magazine);
    const ticks = Math.ceil(0.5 / TUNING.fixedDt) + 1;
    for (let t = 0; t < ticks; t++) step(s, inputs({ fire: true }), TUNING.fixedDt);
    expect(s.bullets.length).toBeGreaterThan(0);
  });

  it('размер магазина задаётся матчем: с магазином 20 перезарядка только после 20 выстрелов', () => {
    const s = createInitialState({ kind: 'endless' }, () => 0.5, 20);
    s.planes[0].x = 100; s.planes[0].y = 100; s.planes[0].angle = 0;
    s.planes[1].x = 700; s.planes[1].y = 400; s.planes[1].angle = Math.PI;
    expect(s.planes[0].ammo).toBe(20);
    const shotTicks = Math.ceil(TUNING.bullet.cooldown / TUNING.fixedDt) + 1;
    for (let n = 0; n < 19; n++) {
      for (let t = 0; t < shotTicks; t++) step(s, inputs({ fire: t === 0 }), TUNING.fixedDt);
    }
    expect(s.planes[0].ammo).toBe(1);
    expect(s.planes[0].reloadTimer).toBe(0);
    step(s, inputs({ fire: true }), TUNING.fixedDt);
    expect(s.planes[0].reloadTimer).toBeGreaterThan(0);
    const ticks = Math.ceil(TUNING.bullet.reloadTime / TUNING.fixedDt) + 1;
    for (let t = 0; t < ticks; t++) step(s, inputs(), TUNING.fixedDt);
    expect(s.planes[0].ammo).toBe(20);
  });

  it('после респауна магазин матча снова полный', () => {
    const s = createInitialState({ kind: 'endless' }, () => 0.5, 15);
    const p = s.planes[0];
    p.ammo = 2;
    killPlane(s, 0, null);
    const maxTicks = Math.ceil((TUNING.respawn.delay + 0.1) / TUNING.fixedDt);
    for (let t = 0; t < maxTicks && !p.alive; t++) step(s, inputs(), TUNING.fixedDt);
    expect(p.alive).toBe(true);
    expect(p.ammo).toBe(15);
  });
});
