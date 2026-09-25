import { TUNING } from './tuning';

export function wrapX(x: number): number {
  const w = TUNING.world.width;
  return ((x % w) + w) % w;
}

export function dist(x1: number, y1: number, x2: number, y2: number): number {
  const w = TUNING.world.width;
  const dx = Math.abs(x2 - x1) % w;
  return Math.hypot(Math.min(dx, w - dx), y2 - y1);
}

export function wrapAngle(a: number): number {
  const turn = 2 * Math.PI;
  const r = ((a % turn) + turn) % turn;
  return r > Math.PI ? r - turn : r;
}
