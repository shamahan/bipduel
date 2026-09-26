import { Cloud, GameState, Plane } from '../sim/state';
import { TUNING } from '../sim/tuning';
import { isPlaneHidden } from '../sim/visibility';
import { Strings } from '../i18n/strings';
import { COLORS, PLAYER_COLORS } from './palette';
import { EXPLOSION_FRAMES, PLANE_FRAMES, ROLL_FRAMES, cloudSprite, explosionSprite, farHillsSprite, groundSprite, planeRollSprite, planeSprite } from './sprites';

const W = TUNING.world.width;
const H = TUNING.world.height;
const FONT = '"Press Start 2P", monospace';
// кегли текстов; тест переводов проверяет по ним, что каждая фраза помещается на своё место.
// button — DOM-кнопки паузы и конца матча (в CSS это 2cqw) и надпись «Поверните телефон».
export const TEXT_SIZE = { title: 40, menu: 16, help: 12, overlayTitle: 28, hudScore: 18, hudTarget: 12, reload: 10, button: 16 };
const PROP_FPS = 30; // кадров анимации пропеллера в секунду
const SMOKE_STEP = 10; // px по вертикали между клубами дыма штопора
// Оборотов бочки в секунду. Пусть за штопор набирается целое число оборотов (сейчас 2 за 1 с):
// тогда штопор кончается на боковом кадре и переход к обычному спрайту без скачка.
export const SPIN_ROLLS_PER_SEC = 2;
const EXPLOSION_ANCHOR = { x: 32, y: 35 }; // точка взрыва в кадре — CX, CY в pixel-art/explosion/build.py

export function drawGame(ctx: CanvasRenderingContext2D, state: GameState, t: Strings): void {
  ctx.fillStyle = COLORS.sky;
  ctx.fillRect(0, 0, W, H);

  const far = farHillsSprite();
  ctx.drawImage(far, 0, H - far.height); // дальний план: только фон, столкновений нет

  for (const p of state.planes) drawSpinSmoke(ctx, p);
  state.planes.forEach((p, i) => drawPlane(ctx, state, p, i as 0 | 1));

  for (const c of state.clouds) drawCloud(ctx, c);

  ctx.fillStyle = COLORS.bullet;
  for (const b of state.bullets) {
    ctx.fillRect(Math.round(b.x) - 2, Math.round(b.y) - 2, 4, 4);
  }

  const ground = groundSprite();
  ctx.drawImage(ground, 0, H - ground.height); // по нижнему краю: постройки и деревья торчат над линией земли

  const boom = explosionSprite();
  const bw = boom.width / EXPLOSION_FRAMES;
  for (const e of state.explosions) {
    const sx = explosionFrame(e.age) * bw;
    for (const dx of [-W, 0, W]) {
      const x = Math.round(e.x + dx - EXPLOSION_ANCHOR.x);
      ctx.drawImage(boom, sx, 0, bw, boom.height, x, Math.round(e.y - EXPLOSION_ANCHOR.y), bw, boom.height);
    }
  }

  drawHud(ctx, state, t);
}

// Клубы остаются там, где самолёт их выпустил, и расплываются с возрастом. В штопоре самолёт
// падает строго вниз с постоянной скоростью, поэтому клубы выводятся из spinTimer без частиц.
function drawSpinSmoke(ctx: CanvasRenderingContext2D, p: Plane): void {
  if (!p.alive || p.spinTimer === 0) return;
  const fallen = (TUNING.spin.duration - p.spinTimer) * TUNING.plane.speed;
  const span = TUNING.spin.duration * TUNING.plane.speed;
  const top = p.y - fallen; // где начался штопор
  ctx.fillStyle = COLORS.smoke;
  for (let k = 0; k * SMOKE_STEP <= fallen; k++) {
    const age = (fallen - k * SMOKE_STEP) / span; // 0 — только что выпущен, 1 — самый старый
    const size = 4 + 2 * Math.round(age * 4);
    const x = Math.round(p.x + Math.sin(k * 1.7) * 2 - size / 2);
    const y = Math.round(top + k * SMOKE_STEP - size / 2);
    ctx.globalAlpha = 0.7 * (1 - age);
    for (const dx of [-W, 0, W]) ctx.fillRect(x + dx, y, size, size);
  }
  ctx.globalAlpha = 1;
}

function drawPlane(ctx: CanvasRenderingContext2D, state: GameState, p: Plane, i: 0 | 1): void {
  if (!p.alive) return;
  if (isPlaneHidden(p, state.clouds)) return; // в облаке не виден никому
  if (p.invulnTimer > 0 && Math.floor(p.invulnTimer * 10) % 2 === 0) return; // мигание
  const spinning = p.spinTimer > 0;
  const sheet = spinning ? planeRollSprite(i) : planeSprite(i);
  const fw = sheet.width / (spinning ? ROLL_FRAMES : PLANE_FRAMES);
  const fh = sheet.height;
  const frame = spinning ? rollFrame(p.spinTimer) : Math.floor(state.time * PROP_FPS) % PLANE_FRAMES;
  const sx = frame * fw;
  // рисуем в трёх позициях для бесшовного wrap по X
  for (const dx of [-W, 0, W]) {
    ctx.save();
    ctx.translate(p.x + dx, p.y);
    ctx.rotate(p.angle);
    ctx.scale(1, planeScaleY(i));
    ctx.drawImage(sheet, sx, 0, fw, fh, -fw / 2, -fh / 2, fw, fh);
    ctx.restore();
  }
}

export function explosionFrame(age: number): number {
  return Math.min(EXPLOSION_FRAMES - 1, Math.floor((age / TUNING.explosionTime) * EXPLOSION_FRAMES));
}

export function rollFrame(spinTimer: number): number {
  const elapsed = TUNING.spin.duration - spinTimer;
  return Math.floor(elapsed * SPIN_ROLLS_PER_SEC * ROLL_FRAMES) % ROLL_FRAMES;
}

// Отражение зависит только от стороны старта, а не от курса: в петле самолёт честно
// оказывается вверх колёсами. P2 стартует влево, поэтому отражён, чтобы начинать колёсами вниз.
export function planeScaleY(i: 0 | 1): 1 | -1 {
  return Math.cos(TUNING.spawn.angles[i]) < 0 ? -1 : 1;
}

function drawCloud(ctx: CanvasRenderingContext2D, c: Cloud): void {
  const img = cloudSprite(c);
  for (const dx of [-W, 0, W]) {
    ctx.drawImage(img, Math.round(c.x + dx - img.width / 2), Math.round(c.y - img.height / 2));
  }
}

function drawHud(ctx: CanvasRenderingContext2D, state: GameState, t: Strings): void {
  ctx.font = `700 ${TEXT_SIZE.hudScore}px ${FONT}`;
  ctx.textBaseline = 'top';
  ctx.textAlign = 'left';
  ctx.fillStyle = COLORS.textShadow;
  ctx.fillText(`P1  ${state.scores[0]}`, 18, 12);
  ctx.fillStyle = PLAYER_COLORS[0].body;
  ctx.fillText(`P1  ${state.scores[0]}`, 16, 10);
  ctx.textAlign = 'right';
  ctx.fillStyle = COLORS.textShadow;
  ctx.fillText(`${state.scores[1]}  P2`, W - 14, 12);
  ctx.fillStyle = PLAYER_COLORS[1].body;
  ctx.fillText(`${state.scores[1]}  P2`, W - 16, 10);
  if (state.mode.kind === 'first-to') {
    ctx.textAlign = 'center';
    ctx.fillStyle = COLORS.text;
    ctx.font = `700 ${TEXT_SIZE.hudTarget}px ${FONT}`;
    ctx.fillText(t.firstTo(state.mode.target), W / 2, 16);
  }
  drawAmmo(ctx, state.planes[0], 16, 46, 1, t);
  drawAmmo(ctx, state.planes[1], W - 16, 46, -1, t);
}

function drawAmmo(ctx: CanvasRenderingContext2D, p: Plane, x: number, y: number, dir: 1 | -1, t: Strings): void {
  if (p.reloadTimer > 0) {
    ctx.font = `700 ${TEXT_SIZE.reload}px ${FONT}`;
    ctx.textAlign = dir === 1 ? 'left' : 'right';
    ctx.fillStyle = COLORS.text;
    if (Math.floor(p.reloadTimer * 4) % 2 === 0) ctx.fillText(t.reloading, x, y);
    return;
  }
  ctx.fillStyle = COLORS.text;
  for (let i = 0; i < p.ammo; i++) {
    ctx.fillRect(x + dir * i * 6 - (dir === -1 ? 3 : 0), y, 3, 10);
  }
}

export function drawMenu(ctx: CanvasRenderingContext2D, rows: string[], selected: number, help: string[]): void {
  ctx.fillStyle = COLORS.sky;
  ctx.fillRect(0, 0, W, H);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillStyle = COLORS.text;
  ctx.font = `700 ${TEXT_SIZE.title}px ${FONT}`;
  ctx.fillText('BIPDUEL', W / 2, 90);
  ctx.font = `700 ${TEXT_SIZE.menu}px ${FONT}`;
  rows.forEach((row, i) => {
    const prefix = i === selected ? '> ' : '  ';
    ctx.fillText(prefix + row, W / 2, 230 + i * 40);
  });
  ctx.font = `${TEXT_SIZE.help}px ${FONT}`;
  help.forEach((line, i) => fillTextArrows(ctx, line, W / 2, 440 + i * 20));
}

// В Press Start 2P есть ↑ и ↓, но нет ← и →: их рисуем повёрнутой ↑ в той же клетке —
// шрифт моноширинный, так что клетка стрелки известна по номеру символа.
const ARROW_TURNS = new Map([
  ['←', -Math.PI / 2],
  ['→', Math.PI / 2],
]);

export function splitArrows(line: string): { text: string; arrows: { at: number; turn: number }[] } {
  const chars = [...line];
  const arrows = chars.flatMap((c, at) => (ARROW_TURNS.has(c) ? [{ at, turn: ARROW_TURNS.get(c)! }] : []));
  return { text: chars.map((c) => (ARROW_TURNS.has(c) ? ' ' : c)).join(''), arrows };
}

// fillText, который умеет ←/→. Рассчитан на textAlign 'center' и textBaseline 'top'.
function fillTextArrows(ctx: CanvasRenderingContext2D, line: string, x: number, y: number): void {
  const { text, arrows } = splitArrows(line);
  ctx.fillText(text, x, y);
  if (arrows.length === 0) return;
  const cell = ctx.measureText('↑').width; // клетка квадратная: ширина символа = кегль
  const left = x - ctx.measureText(text).width / 2;
  for (const { at, turn } of arrows) {
    ctx.save();
    ctx.translate(left + (at + 0.5) * cell, y + cell / 2);
    ctx.rotate(turn);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('↑', 0, 0);
    ctx.restore();
  }
}

export function drawPause(ctx: CanvasRenderingContext2D, t: Strings): void {
  overlay(ctx, t.paused, t.pauseHint);
}

export function drawGameOver(ctx: CanvasRenderingContext2D, state: GameState, t: Strings): void {
  const title = state.winner === null ? t.matchOver : t.winner(state.winner + 1);
  overlay(ctx, title, t.gameOverHint);
}

function overlay(ctx: CanvasRenderingContext2D, title: string, hint: string): void {
  ctx.fillStyle = COLORS.overlay;
  ctx.fillRect(0, 0, W, H);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = COLORS.overlayText;
  ctx.font = `700 ${TEXT_SIZE.overlayTitle}px ${FONT}`;
  ctx.fillText(title, W / 2, H / 2 - 30);
  ctx.font = `${TEXT_SIZE.help}px ${FONT}`;
  ctx.fillText(hint, W / 2, H / 2 + 30);
}
