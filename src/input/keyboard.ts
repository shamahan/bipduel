import { PlayerInput } from '../sim/state';

export class Keyboard {
  private pressed = new Set<string>();

  keyDown(code: string): void {
    this.pressed.add(code);
  }

  keyUp(code: string): void {
    this.pressed.delete(code);
  }

  clear(): void {
    this.pressed.clear();
  }

  readInputs(): [PlayerInput, PlayerInput] {
    return [
      {
        left: this.pressed.has('KeyA'),
        right: this.pressed.has('KeyD'),
        fire: this.pressed.has('KeyW') || this.pressed.has('KeyS'),
      },
      {
        left: this.pressed.has('ArrowLeft'),
        right: this.pressed.has('ArrowRight'),
        fire: this.pressed.has('ArrowUp') || this.pressed.has('ArrowDown'),
      },
    ];
  }
}
