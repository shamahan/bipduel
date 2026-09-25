import { PlayerInput } from './state';
import { SKYLINE } from './skyline';
import { TUNING } from './tuning';

// Колонка самого высокого объекта на земле (сейчас башня КДП) и y её верха.
export function tallestColumn(): { x: number; top: number } {
  const top = Math.min(...SKYLINE);
  return { x: SKYLINE.indexOf(top), top };
}

// Середина колонки, над которой в радиусе самолёта только ровная земля.
export function flatGroundX(): number {
  const r = Math.ceil(TUNING.plane.radius) + 1;
  const w = SKYLINE.length;
  const x = SKYLINE.findIndex((_, c) =>
    Array.from({ length: 2 * r + 1 }, (_, k) => SKYLINE[(c - r + k + w) % w]).every((y) => y === TUNING.world.groundY),
  );
  return x + 0.5;
}

export const IDLE: PlayerInput = { left: false, right: false, fire: false };

export function inputs(
  p1: Partial<PlayerInput> = {},
  p2: Partial<PlayerInput> = {},
): [PlayerInput, PlayerInput] {
  return [
    { ...IDLE, ...p1 },
    { ...IDLE, ...p2 },
  ];
}
