import { describe, expect, it } from 'vitest';
import { SPIN_ROLLS_PER_SEC, explosionFrame, planeScaleY, rollFrame, splitArrows } from './render';
import { EXPLOSION_FRAMES, ROLL_FRAMES } from './sprites';
import { TUNING } from '../sim/tuning';

describe('стрелки ←/→, которых нет в шрифте', () => {
  it('на их месте в строке пробел, а сами они — повёрнутая ↑ в той же клетке', () => {
    expect(splitArrows('P2: ←/→ — поворот')).toEqual({
      text: 'P2:  /  — поворот',
      arrows: [
        { at: 4, turn: -Math.PI / 2 },
        { at: 6, turn: Math.PI / 2 },
      ],
    });
  });

  it('клетки считаются по символам, а не по UTF-16: ↑/↓ и кириллица стрелки не сдвигают', () => {
    const { arrows } = splitArrows('↑/↓ — выбор, ←/→ — изменить');
    expect(arrows.map((a) => a.at)).toEqual([13, 15]);
  });

  it('строка без ←/→ остаётся как есть', () => {
    expect(splitArrows('ПРОБЕЛ — OK')).toEqual({ text: 'ПРОБЕЛ — OK', arrows: [] });
  });
});

describe('ориентация самолёта', () => {
  it('P1 стартует вправо и рисуется как есть', () => {
    expect(planeScaleY(0)).toBe(1);
  });

  it('P2 стартует влево и отражён, чтобы на старте быть колёсами вниз', () => {
    expect(planeScaleY(1)).toBe(-1);
  });
});

describe('кадры бочки в штопоре', () => {
  it('штопор начинается с бокового вида — того же кадра, что и обычный полёт', () => {
    expect(rollFrame(TUNING.spin.duration)).toBe(0);
  });

  it('кадры идут по кругу со скоростью SPIN_ROLLS_PER_SEC оборотов в секунду', () => {
    const frameTime = 1 / (SPIN_ROLLS_PER_SEC * ROLL_FRAMES);
    for (let k = 0; k < 2 * ROLL_FRAMES; k++) {
      const spinTimer = TUNING.spin.duration - (k + 0.5) * frameTime;
      if (spinTimer <= 0) break;
      expect(rollFrame(spinTimer)).toBe(k % ROLL_FRAMES);
    }
  });
});

describe('кадры взрыва', () => {
  it('взрыв начинается со вспышки и доходит до последнего кадра к концу жизни', () => {
    expect(explosionFrame(0)).toBe(0);
    expect(explosionFrame(TUNING.explosionTime - 1e-6)).toBe(EXPLOSION_FRAMES - 1);
  });

  it('кадры идут по порядку, каждый — равная доля времени взрыва', () => {
    const frameTime = TUNING.explosionTime / EXPLOSION_FRAMES;
    for (let k = 0; k < EXPLOSION_FRAMES; k++) {
      expect(explosionFrame((k + 0.5) * frameTime)).toBe(k);
    }
  });
});
