import { GameState, MatchMode, PlayerInput, createInitialState } from '../sim/state';
import { step } from '../sim/step';
import { drawGame, drawGameOver, drawMenu, drawPause } from '../render/render';
import { LANGUAGES } from '../i18n/languages';
import { STRINGS } from '../i18n';
import { Strings } from '../i18n/strings';
import { MENU_ITEMS, menuRows } from './menu';
import { MAGAZINE_OPTIONS, Settings, TARGET_OPTIONS, loadSettings, nextOption } from './settings';

export type Screen = 'menu' | 'playing' | 'paused' | 'gameover';

const UP = ['ArrowUp', 'KeyW'];
const DOWN = ['ArrowDown', 'KeyS'];
const LEFT = ['ArrowLeft', 'KeyA'];
const RIGHT = ['ArrowRight', 'KeyD'];
const CONFIRM = ['Space', 'Enter'];
const MENU_INDEXES = MENU_ITEMS.map((_, i) => i);

export interface SoundPort {
  resume(): void;
  shot(): void;
  explosion(): void;
  reloadDone(): void;
  toggleMute(): void;
}

export class NullSound implements SoundPort {
  resume(): void {}
  shot(): void {}
  explosion(): void {}
  reloadDone(): void {}
  toggleMute(): void {}
}

export class App {
  screen: Screen = 'menu';
  menuIndex = 0;
  state: GameState | null = null;
  touch = false; // сенсорный режим: подсказки меню и оверлеев — под кнопки на экране, а не под клавиши

  constructor(
    private sound: SoundPort,
    public settings: Settings = loadSettings(null, []),
    private onSettingsChange: (settings: Settings) => void = () => {},
  ) {}

  handleKey(code: string): void {
    if (code === 'KeyM') {
      this.sound.toggleMute();
      return;
    }
    switch (this.screen) {
      case 'menu':
        this.handleMenuKey(code);
        break;
      case 'playing':
        if (code === 'Escape' || code === 'KeyP') this.pauseIfPlaying();
        break;
      case 'paused':
        if (code === 'Escape' || code === 'KeyP' || code === 'Space') this.resume();
        else if (code === 'KeyQ') this.toMenu();
        break;
      case 'gameover':
        if (CONFIRM.includes(code)) this.rematch();
        else if (code === 'Escape') this.toMenu();
        break;
    }
  }

  private handleMenuKey(code: string): void {
    const onPlay = MENU_ITEMS[this.menuIndex] === 'play';
    if (UP.includes(code)) this.menuIndex = nextOption(MENU_INDEXES, this.menuIndex, -1);
    else if (DOWN.includes(code)) this.menuIndex = nextOption(MENU_INDEXES, this.menuIndex, 1);
    else if (onPlay && CONFIRM.includes(code)) this.startMatch();
    else if (LEFT.includes(code)) this.changeOption(-1);
    else if (RIGHT.includes(code) || CONFIRM.includes(code)) this.changeOption(1);
  }

  // Тап по строке меню: строка становится выбранной. На «Играть» — старт; на настройке
  // dir −1/+1 листает значение назад/вперёд, 0 — вперёд, как пробел.
  tapMenu(index: number, dir: -1 | 0 | 1): void {
    if (this.screen !== 'menu') return;
    this.menuIndex = index;
    if (MENU_ITEMS[index] === 'play') this.startMatch();
    else this.changeOption(dir === -1 ? -1 : 1);
  }

  // Действия кнопок паузы и конца матча; не на своём экране ничего не делают — клик мог
  // прийти по кнопке, которую следующий кадр уже спрятал бы.
  resume(): void {
    if (this.screen === 'paused') this.screen = 'playing';
  }

  toMenu(): void {
    if (this.screen === 'paused' || this.screen === 'gameover') this.screen = 'menu';
  }

  rematch(): void {
    if (this.screen === 'gameover') this.startMatch();
  }

  private changeOption(dir: 1 | -1): void {
    const s = this.settings;
    switch (MENU_ITEMS[this.menuIndex]) {
      case 'language':
        s.language = nextOption(LANGUAGES, s.language, dir);
        break;
      case 'target':
        s.target = nextOption(TARGET_OPTIONS, s.target, dir);
        break;
      case 'magazine':
        s.magazine = nextOption(MAGAZINE_OPTIONS, s.magazine, dir);
        break;
      case 'play':
        return;
    }
    this.onSettingsChange(s);
  }

  private startMatch(): void {
    const { target, magazine } = this.settings;
    const mode: MatchMode = target === null ? { kind: 'endless' } : { kind: 'first-to', target };
    this.state = createInitialState(mode, Math.random, magazine);
    this.screen = 'playing';
    this.sound.resume();
  }

  private get strings(): Strings {
    return STRINGS[this.settings.language];
  }

  pauseIfPlaying(): void {
    if (this.screen === 'playing') this.screen = 'paused';
  }

  update(inputs: [PlayerInput, PlayerInput], dt: number): void {
    if (this.screen !== 'playing' || !this.state) return;
    step(this.state, inputs, dt);
    for (const ev of this.state.events) {
      switch (ev) {
        case 'shot':
          this.sound.shot();
          break;
        case 'explosion':
          this.sound.explosion();
          break;
        case 'reloadDone':
          this.sound.reloadDone();
          break;
        default: {
          const never: never = ev;
          void never;
        }
      }
    }
    if (this.state.winner !== null) this.screen = 'gameover';
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const t = this.strings;
    switch (this.screen) {
      case 'menu': {
        const help = this.touch ? [t.touchHelp] : [t.helpP1, t.helpP2, t.helpMenu];
        drawMenu(ctx, menuRows(t, this.settings), this.menuIndex, help);
        break;
      }
      case 'playing':
        drawGame(ctx, this.state!, t);
        break;
      case 'paused':
        drawGame(ctx, this.state!, t);
        drawPause(ctx, t, !this.touch);
        break;
      case 'gameover':
        drawGame(ctx, this.state!, t);
        drawGameOver(ctx, this.state!, t, !this.touch);
        break;
    }
  }
}
