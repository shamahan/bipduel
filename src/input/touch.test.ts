import { describe, it, expect } from 'vitest';
import { PAD_CODES, TouchControls } from './touch';
import { Keyboard } from './keyboard';

function recorder() {
  const log: string[] = [];
  return { log, port: { keyDown: (c: string) => log.push(`down ${c}`), keyUp: (c: string) => log.push(`up ${c}`) } };
}

const IDLE = { left: false, right: false, fire: false };

describe('TouchControls', () => {
  it('палец на кнопке держит её код, поднял — код отпущен', () => {
    const kb = new Keyboard();
    const touch = new TouchControls(kb);
    touch.press(1, 'KeyA');
    expect(kb.readInputs()[0].left).toBe(true);
    touch.release(1);
    expect(kb.readInputs()[0].left).toBe(false);
  });

  it('двое жмут одновременно: P1 поворачивает, P2 стреляет', () => {
    const kb = new Keyboard();
    const touch = new TouchControls(kb);
    touch.press(1, 'KeyA');
    touch.press(2, 'ArrowUp');
    expect(kb.readInputs()).toEqual([
      { ...IDLE, left: true },
      { ...IDLE, fire: true },
    ]);
  });

  it('палец скользнул с кнопки на кнопку: новый код нажат, старый отпущен', () => {
    const { log, port } = recorder();
    const touch = new TouchControls(port);
    touch.press(1, 'KeyA');
    touch.press(1, 'KeyW');
    expect(log).toEqual(['down KeyA', 'down KeyW', 'up KeyA']);
  });

  it('движение пальца в пределах той же кнопки ничего не шлёт', () => {
    const { log, port } = recorder();
    const touch = new TouchControls(port);
    touch.press(1, 'KeyW');
    touch.press(1, 'KeyW');
    expect(log).toEqual(['down KeyW']);
  });

  it('два пальца на одной кнопке: код держится, пока не ушёл последний', () => {
    const { log, port } = recorder();
    const touch = new TouchControls(port);
    touch.press(1, 'KeyW');
    touch.press(2, 'KeyW');
    touch.release(1);
    expect(touch.isHeld('KeyW')).toBe(true);
    expect(log).toEqual(['down KeyW']);
    touch.release(2);
    expect(touch.isHeld('KeyW')).toBe(false);
    expect(log).toEqual(['down KeyW', 'up KeyW']);
  });

  it('палец ушёл с кнопок — press(id, null) — код отпущен, вернулся — снова нажат', () => {
    const { log, port } = recorder();
    const touch = new TouchControls(port);
    touch.press(1, 'KeyD');
    touch.press(1, null);
    touch.press(1, 'KeyD');
    expect(log).toEqual(['down KeyD', 'up KeyD', 'down KeyD']);
  });

  it('release пальца, который ничего не держал, ничего не шлёт', () => {
    const { log, port } = recorder();
    new TouchControls(port).release(7);
    expect(log).toEqual([]);
  });

  it('clear() отпускает всё, что держали пальцы', () => {
    const kb = new Keyboard();
    const touch = new TouchControls(kb);
    touch.press(1, 'KeyA');
    touch.press(2, 'ArrowUp');
    touch.clear();
    expect(kb.readInputs()).toEqual([IDLE, IDLE]);
    expect(touch.isHeld('KeyA')).toBe(false);
  });

  it('кнопки игрока дают те же входы, что его клавиши: ⟲ — left, огонь — fire, ⟳ — right', () => {
    for (const player of [0, 1] as const) {
      for (const [kind, input] of [['ccw', 'left'], ['fire', 'fire'], ['cw', 'right']] as const) {
        const kb = new Keyboard();
        new TouchControls(kb).press(1, PAD_CODES[player][kind]);
        expect(kb.readInputs()[player]).toEqual({ ...IDLE, [input]: true });
        expect(kb.readInputs()[1 - player]).toEqual(IDLE);
      }
    }
  });
});
