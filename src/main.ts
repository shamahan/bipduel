import '@fontsource/press-start-2p/400.css';
import { Keyboard } from './input/keyboard';
import { App } from './app/app';
import { Sound } from './audio/sound';
import { TUNING } from './sim/tuning';
import { loadSprites } from './render/sprites';
import { SettingsStorage, loadSettings, saveSettings } from './app/settings';
import { mountShareBar } from './app/share-bar';
import { mountMenuHit } from './app/menu-hit';
import { mountTouchMode } from './app/touch-mode';

const canvas = document.querySelector<HTMLCanvasElement>('#game')!;
canvas.width = TUNING.world.width;
canvas.height = TUNING.world.height;
const ctx = canvas.getContext('2d')!;
ctx.imageSmoothingEnabled = false;

const keyboard = new Keyboard();
const sound = new Sound();

function browserStorage(): SettingsStorage | null {
  try {
    return window.localStorage; // сам доступ к localStorage бросает исключение при запрете хранилища
  } catch {
    return null;
  }
}

const storage = browserStorage();
const settings = loadSettings(storage, navigator.languages ?? [navigator.language]);
document.documentElement.lang = settings.language;
const app = new App(sound, settings, (s) => {
  saveSettings(storage, s);
  document.documentElement.lang = s.language;
});

const GAME_KEYS = new Set([
  'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space',
  'KeyA', 'KeyD', 'KeyW', 'KeyS',
  'KeyP', 'KeyQ', 'KeyM', 'Escape', 'Enter',
]);

const muteBtn = document.querySelector<HTMLButtonElement>('#mute')!;
const shareBar = mountShareBar(document.querySelector<HTMLElement>('#share')!, location.href);
const menuHit = mountMenuHit(document.querySelector<HTMLElement>('#menu-hit')!, (index, dir) => app.tapMenu(index, dir));
const touchMode = mountTouchMode(document.documentElement, document.querySelector<HTMLElement>('#rotate')!);

function syncMuteButton() {
  muteBtn.textContent = sound.muted ? '🔇' : '🔊';
}

window.addEventListener('keydown', (e) => {
  if (GAME_KEYS.has(e.code)) touchMode.set(false); // играют с клавиатуры — кнопки на экране не нужны
  if (GAME_KEYS.has(e.code) && !e.ctrlKey && !e.metaKey && !e.altKey) e.preventDefault();
  if (!e.repeat) {
    app.handleKey(e.code);
    if (e.code === 'KeyM') {
      sound.resume();
      syncMuteButton();
    }
  }
  keyboard.keyDown(e.code);
});
window.addEventListener('keyup', (e) => keyboard.keyUp(e.code));

function releaseAll() {
  keyboard.clear();
  app.pauseIfPlaying();
}
window.addEventListener('blur', releaseAll);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) releaseAll();
});

muteBtn.addEventListener('click', () => {
  sound.resume();
  sound.toggleMute();
  syncMuteButton();
  muteBtn.blur();
});

let last = performance.now();
let acc = 0;
function frame(now: number) {
  app.touch = touchMode.on;
  if (touchMode.portrait) app.pauseIfPlaying(); // телефон повернули посреди боя: поле закрыто, матч ждёт
  acc += Math.min((now - last) / 1000, 0.25);
  last = now;
  while (acc >= TUNING.fixedDt) {
    app.update(keyboard.readInputs(), TUNING.fixedDt);
    acc -= TUNING.fixedDt;
  }
  app.draw(ctx);
  shareBar.sync(app.screen === 'menu', app.settings.language);
  menuHit.sync(app.screen === 'menu');
  touchMode.sync(app.settings.language);
  requestAnimationFrame(frame);
}
loadSprites().then(() => requestAnimationFrame(frame));
