// Рельеф — высотная карта: для каждой колонки пикселей x — y верхнего твёрдого пикселя.
// Твёрдое в колонке c — прямоугольник [c, c+1) × [sky[c], ∞). Мир заворачивается по X.

function column(sky: ArrayLike<number>, c: number): number {
  const w = sky.length;
  return sky[((c % w) + w) % w];
}

export function terrainTop(sky: ArrayLike<number>, x: number): number {
  return column(sky, Math.floor(x));
}

// Касание считается столкновением — как у ровной земли: y + r >= линия.
export function circleHitsTerrain(sky: ArrayLike<number>, x: number, y: number, r: number): boolean {
  for (let c = Math.floor(x - r); c <= Math.floor(x + r); c++) {
    const dx = Math.max(c - x, 0, x - (c + 1));
    const dy = Math.max(column(sky, c) - y, 0);
    if (dx * dx + dy * dy <= r * r) return true;
  }
  return false;
}
