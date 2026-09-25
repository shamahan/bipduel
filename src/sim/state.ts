import { TUNING } from './tuning';
import { wrapX } from './util';

export type PlayerInput = { left: boolean; right: boolean; fire: boolean };

export type Plane = {
  x: number;
  y: number;
  angle: number; // радианы, 0 = вправо, ось Y вниз (канвас)
  alive: boolean;
  respawnTimer: number; // сек до респауна, актуально когда !alive
  invulnTimer: number; // оставшаяся неуязвимость
  ammo: number;
  reloadTimer: number; // >0 — идёт перезарядка
  cooldownTimer: number; // время до следующего разрешённого выстрела
  spinTimer: number; // >0 — штопор: управления нет, самолёт падает вниз
};

export type Bullet = { x: number; y: number; vx: number; vy: number; ttl: number; owner: 0 | 1 };

// Для игры облако — эллипс (rx, ry — целые: рендер рисует им пиксельное тело).
// seed задаёт только раскладку клубов в рендере.
export type Cloud = { x: number; y: number; rx: number; ry: number; vx: number; seed: number };

export type Explosion = { x: number; y: number; age: number };

export type MatchMode = { kind: 'first-to'; target: number } | { kind: 'endless' };

export type GameEvent = 'shot' | 'explosion' | 'reloadDone';

export type GameState = {
  planes: [Plane, Plane];
  bullets: Bullet[];
  clouds: Cloud[];
  explosions: Explosion[];
  scores: [number, number];
  mode: MatchMode;
  magazine: number; // патронов в магазине в этом матче
  winner: 0 | 1 | null;
  events: GameEvent[];
  time: number; // сек с начала матча; стоит на паузе (анимация пропеллера)
};

export function createPlane(i: 0 | 1, magazine: number = TUNING.bullet.magazine): Plane {
  return {
    x: TUNING.spawn.xs[i],
    y: TUNING.spawn.ys[i],
    angle: TUNING.spawn.angles[i],
    alive: true,
    respawnTimer: 0,
    invulnTimer: 0,
    ammo: magazine,
    reloadTimer: 0,
    cooldownTimer: 0,
    spinTimer: 0,
  };
}

export function createClouds(rng: () => number): Cloud[] {
  const { area, maxDrift, kinds } = TUNING.clouds;
  const w = TUNING.world.width;
  // Облака одного вида получают каждое свою колонку и свою полосу высоты — иначе стартуют кучей.
  return kinds.flatMap((k) => {
    const colW = w / k.count;
    const bandH = (area.bottom - area.top) / k.count;
    const offset = rng() * w;
    return shuffled(k.count, rng).map((band, col) => {
      const rx = Math.round(k.minRx + rng() * (k.maxRx - k.minRx));
      const ry = Math.round(k.minRy + rng() * (k.maxRy - k.minRy));
      return {
        x: wrapX(offset + col * colW + rx + rng() * Math.max(0, colW - 2 * rx)),
        y: area.top + band * bandH + ry + rng() * Math.max(0, bandH - 2 * ry),
        rx,
        ry,
        vx: (rng() * 2 - 1) * maxDrift,
        seed: Math.floor(rng() * 2 ** 31),
      };
    });
  });
}

function shuffled(n: number, rng: () => number): number[] {
  const a = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function createInitialState(
  mode: MatchMode,
  rng: () => number = Math.random,
  magazine: number = TUNING.bullet.magazine,
): GameState {
  return {
    planes: [createPlane(0, magazine), createPlane(1, magazine)],
    bullets: [],
    clouds: createClouds(rng),
    explosions: [],
    scores: [0, 0],
    mode,
    magazine,
    winner: null,
    events: [],
    time: 0,
  };
}
