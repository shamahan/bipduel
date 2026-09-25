import { describe, it, expect } from 'vitest';
import { Keyboard } from './keyboard';

describe('Keyboard', () => {
  it('маппит клавиши обоих игроков одновременно', () => {
    const kb = new Keyboard();
    kb.keyDown('KeyA');
    kb.keyDown('KeyW');
    kb.keyDown('ArrowRight');
    kb.keyDown('ArrowUp');
    const [p1, p2] = kb.readInputs();
    expect(p1).toEqual({ left: true, right: false, fire: true });
    expect(p2).toEqual({ left: false, right: true, fire: true });
  });

  it('огонь — любая из двух клавиш игрока: W/S у P1, ↑/↓ у P2', () => {
    const kb = new Keyboard();
    kb.keyDown('KeyS');
    kb.keyDown('ArrowDown');
    const [p1, p2] = kb.readInputs();
    expect(p1.fire).toBe(true);
    expect(p2.fire).toBe(true);
  });

  it('огонь держится, пока зажата хотя бы одна из двух клавиш', () => {
    const kb = new Keyboard();
    kb.keyDown('KeyW');
    kb.keyDown('KeyS');
    kb.keyUp('KeyW');
    expect(kb.readInputs()[0].fire).toBe(true);
    kb.keyUp('KeyS');
    expect(kb.readInputs()[0].fire).toBe(false);
  });

  it('Shift больше не стреляет', () => {
    const kb = new Keyboard();
    kb.keyDown('ShiftLeft');
    kb.keyDown('ShiftRight');
    const [p1, p2] = kb.readInputs();
    expect(p1.fire).toBe(false);
    expect(p2.fire).toBe(false);
  });

  it('keyUp снимает нажатие', () => {
    const kb = new Keyboard();
    kb.keyDown('KeyD');
    kb.keyUp('KeyD');
    expect(kb.readInputs()[0].right).toBe(false);
  });

  it('clear() сбрасывает все нажатые клавиши', () => {
    const kb = new Keyboard();
    kb.keyDown('KeyW');
    kb.keyDown('ArrowLeft');
    kb.clear();
    const [p1, p2] = kb.readInputs();
    expect(p1).toEqual({ left: false, right: false, fire: false });
    expect(p2).toEqual({ left: false, right: false, fire: false });
  });
});
