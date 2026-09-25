export const TUNING = {
  // groundY — ровная земля; постройки и деревья над ней — в SKYLINE (sim/skyline.ts)
  world: { width: 800, height: 600, groundY: 580, ceilingY: 24, offscreenMargin: 20 },
  plane: { speed: 160, turnRate: Math.PI, radius: 10 },
  bullet: { speed: 420, ttl: 1.1, cooldown: 1 / 6, magazine: 5, reloadTime: 8 / 3, radius: 2, noseOffset: 4 },
  spawn: { xs: [100, 700] as [number, number], ys: [180, 260] as [number, number], angles: [0, Math.PI] as [number, number] },
  respawn: { delay: 2, invulnTime: 2 },
  spin: { duration: 1, pitchRate: 5 * Math.PI }, // pitchRate: нос уходит вниз не дольше чем за 0,2 с
  clouds: {
    area: { top: 40, bottom: 250 }, // прямоугольник спавна во всю ширину: тела облаков целиком внутри
    maxDrift: 14,
    kinds: [
      { count: 3, minRx: 26, maxRx: 34, minRy: 12, maxRy: 14 }, // мелкие
      { count: 2, minRx: 80, maxRx: 100, minRy: 24, maxRy: 28 }, // тучи
    ],
  },
  explosionTime: 1,
  fixedDt: 1 / 60,
};
