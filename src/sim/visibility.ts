import { Cloud, Plane } from './state';
import { TUNING } from './tuning';

export function isPlaneHidden(plane: Plane, clouds: Cloud[]): boolean {
  return clouds.some((c) => {
    const w = TUNING.world.width;
    const ax = Math.abs(plane.x - c.x) % w;
    const dx = Math.min(ax, w - ax) / c.rx;
    const dy = (plane.y - c.y) / c.ry;
    return dx * dx + dy * dy <= 1;
  });
}
