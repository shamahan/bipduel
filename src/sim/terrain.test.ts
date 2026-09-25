import { describe, it, expect } from 'vitest';
import { circleHitsTerrain, terrainTop } from './terrain';
import { SKYLINE } from './skyline';
import { TUNING } from './tuning';

function flat(y: number): number[] {
  return Array.from({ length: 800 }, () => y);
}

describe('рельеф', () => {
  it('над ровной землёй круг сталкивается, когда нижняя точка касается линии', () => {
    const sky = flat(580);
    expect(circleHitsTerrain(sky, 400, 569, 10)).toBe(false);
    expect(circleHitsTerrain(sky, 400, 570, 10)).toBe(true);
  });

  it('узкая башня сбоку сбивает круг ниже своего верха', () => {
    const sky = flat(580);
    sky[405] = 540;
    expect(circleHitsTerrain(sky, 400, 545, 10)).toBe(true);
    expect(circleHitsTerrain(sky, 394, 545, 10)).toBe(false); // до левого края колонки 11 px
  });

  it('над углом башни считается расстояние до угла, а не до квадрата вокруг круга', () => {
    const sky = flat(580);
    sky[405] = 540;
    expect(circleHitsTerrain(sky, 403, 532, 10)).toBe(true); // dx 2, dy 8
    expect(circleHitsTerrain(sky, 397, 533, 10)).toBe(false); // dx 8, dy 7: угол квадрата, но не круга
  });

  it('препятствие у шва экрана сбивает самолёт на другом краю', () => {
    const sky = flat(580);
    sky[0] = 540;
    expect(circleHitsTerrain(sky, 796, 545, 10)).toBe(true);
    expect(circleHitsTerrain(sky, 4, 545, 10)).toBe(true);
  });

  it('terrainTop отдаёт верх рельефа в колонке точки с учётом шва', () => {
    const sky = flat(580);
    sky[0] = 540;
    sky[799] = 550;
    expect(terrainTop(sky, 0.7)).toBe(540);
    expect(terrainTop(sky, 799.5)).toBe(550);
    expect(terrainTop(sky, -0.5)).toBe(550);
    expect(terrainTop(sky, 800.2)).toBe(540);
  });
});

describe('высотная карта из спрайта земли', () => {
  it('по колонке на каждый пиксель ширины мира', () => {
    expect(SKYLINE).toHaveLength(TUNING.world.width);
  });

  it('ниже линии земли ничего нет, а ровные участки лежат ровно на ней', () => {
    expect(Math.max(...SKYLINE)).toBe(TUNING.world.groundY);
  });

  it('высокие постройки торчат над старой линией земли 560', () => {
    expect(Math.min(...SKYLINE)).toBeLessThan(560);
  });
});
