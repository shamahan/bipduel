import { GameState, Plane, PlayerInput } from './state';
import { TUNING } from './tuning';
import { wrapX, dist, wrapAngle } from './util';
import { circleHitsTerrain, terrainTop } from './terrain';
import { SKYLINE } from './skyline';

export function step(state: GameState, inputs: [PlayerInput, PlayerInput], dt: number): void {
  state.events = [];
  state.time += dt;
  if (state.winner === null) {
    for (const i of [0, 1] as const) updatePlane(state, i, inputs[i], dt);
    for (const b of state.bullets) {
      b.x = wrapX(b.x + b.vx * dt);
      b.y += b.vy * dt;
      b.ttl -= dt;
    }
    state.bullets = state.bullets.filter(
      (b) => b.ttl > 0 && b.y < terrainTop(SKYLINE, b.x) && b.y > -TUNING.world.offscreenMargin,
    );
    handleBulletHits(state);
    handlePlaneCollision(state);
  }
  for (const c of state.clouds) c.x = wrapX(c.x + c.vx * dt);
  for (const e of state.explosions) e.age += dt;
  state.explosions = state.explosions.filter((e) => e.age < TUNING.explosionTime);
}

export function killPlane(state: GameState, victim: 0 | 1, scorer: 0 | 1 | null): void {
  const p = state.planes[victim];
  p.alive = false;
  p.respawnTimer = TUNING.respawn.delay;
  state.explosions.push({ x: p.x, y: p.y, age: 0 });
  state.events.push('explosion');
  if (scorer !== null && state.winner === null) {
    state.scores[scorer]++;
    if (state.mode.kind === 'first-to' && state.scores[scorer] >= state.mode.target) {
      state.winner = scorer;
    }
  }
}

function respawn(p: Plane, i: 0 | 1, magazine: number): void {
  p.alive = true;
  p.x = TUNING.spawn.xs[i];
  p.y = TUNING.spawn.ys[i];
  p.angle = TUNING.spawn.angles[i];
  p.invulnTimer = TUNING.respawn.invulnTime;
  p.ammo = magazine;
  p.reloadTimer = 0;
  p.cooldownTimer = 0;
  p.spinTimer = 0;
}

function fireBullet(state: GameState, i: 0 | 1): void {
  const p = state.planes[i];
  const nose = TUNING.plane.radius + TUNING.bullet.noseOffset;
  state.bullets.push({
    x: wrapX(p.x + Math.cos(p.angle) * nose),
    y: p.y + Math.sin(p.angle) * nose,
    vx: Math.cos(p.angle) * TUNING.bullet.speed,
    vy: Math.sin(p.angle) * TUNING.bullet.speed,
    ttl: TUNING.bullet.ttl,
    owner: i,
  });
  p.ammo--;
  p.cooldownTimer = TUNING.bullet.cooldown;
  if (p.ammo === 0) p.reloadTimer = TUNING.bullet.reloadTime;
  state.events.push('shot');
}

function updatePlane(state: GameState, i: 0 | 1, input: PlayerInput, dt: number): void {
  const p = state.planes[i];
  if (!p.alive) {
    p.respawnTimer -= dt;
    if (p.respawnTimer <= 0) respawn(p, i, state.magazine);
    return;
  }
  if (p.spinTimer > 0) {
    p.spinTimer = Math.max(0, p.spinTimer - dt);
    const toDown = wrapAngle(Math.PI / 2 - p.angle);
    const turn = TUNING.spin.pitchRate * dt;
    p.angle += Math.max(-turn, Math.min(turn, toDown));
    p.y += TUNING.plane.speed * dt;
  } else {
    if (input.left) p.angle -= TUNING.plane.turnRate * dt;
    if (input.right) p.angle += TUNING.plane.turnRate * dt;
    p.x = wrapX(p.x + Math.cos(p.angle) * TUNING.plane.speed * dt);
    p.y += Math.sin(p.angle) * TUNING.plane.speed * dt;
    if (p.y < TUNING.world.ceilingY) {
      p.y = TUNING.world.ceilingY;
      p.spinTimer = TUNING.spin.duration;
    }
  }
  p.invulnTimer = Math.max(0, p.invulnTimer - dt);
  if (circleHitsTerrain(SKYLINE, p.x, p.y, TUNING.plane.radius)) {
    killPlane(state, i, null);
    return;
  }
  p.cooldownTimer = Math.max(0, p.cooldownTimer - dt);
  if (p.reloadTimer > 0) {
    p.reloadTimer -= dt;
    if (p.reloadTimer <= 0) {
      p.reloadTimer = 0;
      p.ammo = state.magazine;
      state.events.push('reloadDone');
    }
  }
  if (input.fire && p.invulnTimer === 0 && p.spinTimer === 0 && p.cooldownTimer === 0 && p.reloadTimer === 0 && p.ammo > 0) {
    fireBullet(state, i);
  }
}

function handleBulletHits(state: GameState): void {
  for (const b of state.bullets) {
    const enemy = (1 - b.owner) as 0 | 1;
    const p = state.planes[enemy];
    if (!p.alive || p.invulnTimer > 0) continue;
    if (dist(b.x, b.y, p.x, p.y) < TUNING.plane.radius + TUNING.bullet.radius) {
      b.ttl = 0;
      killPlane(state, enemy, b.owner);
    }
  }
  state.bullets = state.bullets.filter((b) => b.ttl > 0);
}

function handlePlaneCollision(state: GameState): void {
  const [a, b] = state.planes;
  if (!a.alive || !b.alive || a.invulnTimer > 0 || b.invulnTimer > 0) return;
  if (dist(a.x, a.y, b.x, b.y) < TUNING.plane.radius * 2) {
    killPlane(state, 0, null);
    killPlane(state, 1, null);
  }
}
