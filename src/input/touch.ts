// Касания кнопок на экране → те же коды клавиш, что читает Keyboard. Помнит, какой палец
// (pointerId) на какой кнопке: код отпускается, только когда его отпустил последний палец, —
// двое могут жать одну кнопку, а палец — скользить с кнопки на кнопку, не отрываясь.
export interface KeyPort {
  keyDown(code: string): void;
  keyUp(code: string): void;
}

export class TouchControls {
  private fingers = new Map<number, string>();

  constructor(private keys: KeyPort) {}

  // палец pointerId теперь на кнопке с этим кодом; null — вне кнопок
  press(pointerId: number, code: string | null): void {
    const was = this.fingers.get(pointerId) ?? null;
    if (was === code) return;
    if (code !== null && !this.isHeld(code)) this.keys.keyDown(code);
    if (code === null) this.fingers.delete(pointerId);
    else this.fingers.set(pointerId, code);
    if (was !== null && !this.isHeld(was)) this.keys.keyUp(was);
  }

  release(pointerId: number): void {
    this.press(pointerId, null);
  }

  clear(): void {
    const held = new Set(this.fingers.values());
    this.fingers.clear();
    for (const code of held) this.keys.keyUp(code);
  }

  isHeld(code: string): boolean {
    for (const c of this.fingers.values()) if (c === code) return true;
    return false;
  }
}

// Кнопки боя игрока и их коды — те же, что у его клавиш: ⟲ как A/←, огонь как W/↑, ⟳ как D/→.
// ⟲ = left в симуляции: угол уменьшается, то есть нос крутится против часовой (ось Y вниз).
export type PadCodes = { ccw: string; fire: string; cw: string };

export const PAD_CODES: readonly [PadCodes, PadCodes] = [
  { ccw: 'KeyA', fire: 'KeyW', cw: 'KeyD' },
  { ccw: 'ArrowLeft', fire: 'ArrowUp', cw: 'ArrowRight' },
];
