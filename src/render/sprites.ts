import planeUrl from './plane.png';
import planeRollUrl from './plane-roll.png';
import explosionUrl from './explosion.png';
import groundUrl from './ground.png';
import farHillsUrl from './far-hills.png';
import { renderCloud } from './clouds';
import type { Cloud } from '../sim/state';

// PNG рисуют скрипты pixel-art/*/build.py — правь скрипт и перезапускай, а не PNG.
// Самолёт нарисован носом вправо, кадры пропеллера лежат лентой по горизонтали.
// Синий самолёт P2 получается при загрузке перекраской красных оттенков.
export const PLANE_FRAMES = 4;
// Бочка для штопора — отдельная лента: 8 кадров полного оборота вокруг оси фюзеляжа.
export const ROLL_FRAMES = 8;
// Взрыв: вспышка, огненный шар, дым — кадры лентой, игра берёт кадр по возрасту взрыва.
export const EXPLOSION_FRAMES = 10;

const RED_HUE_MIN = 300; // красные оттенки: от пурпурного контура...
const RED_HUE_MAX = 11; // ...до алого; коричневое дерево пропеллера (14–20°) не трогаем
const MIN_SATURATION = 0.2; // серые стойки и металл не трогаем
const HUE_SHIFT = 220; // красный ~358° → синий ~218°, в тон PLAYER_COLORS[1]

export function recolorRedToBlue(data: Uint8ClampedArray): Uint8ClampedArray {
  const out = new Uint8ClampedArray(data);
  for (let i = 0; i < out.length; i += 4) {
    if (out[i + 3] === 0) continue;
    const [h, s, l] = rgbToHsl(out[i], out[i + 1], out[i + 2]);
    if (s < MIN_SATURATION || (h > RED_HUE_MAX && h < RED_HUE_MIN)) continue;
    const [r, g, b] = hslToRgb((h + HUE_SHIFT) % 360, s, l);
    out[i] = r;
    out[i + 1] = g;
    out[i + 2] = b;
  }
  return out;
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return [0, 0, l];
  const s = d / (1 - Math.abs(2 * l - 1));
  let h: number;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return [(h * 60 + 360) % 360, s, l];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const [r, g, b] =
    h < 60 ? [c, x, 0] :
    h < 120 ? [x, c, 0] :
    h < 180 ? [0, c, x] :
    h < 240 ? [0, x, c] :
    h < 300 ? [x, 0, c] :
    [c, 0, x];
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
}

let planeSprites: [HTMLCanvasElement, HTMLCanvasElement] | null = null;
let rollSprites: [HTMLCanvasElement, HTMLCanvasElement] | null = null;
let groundImage: HTMLImageElement | null = null;
let explosionImage: HTMLImageElement | null = null;
let farHillsImage: HTMLImageElement | null = null;
const cloudCache = new WeakMap<Cloud, HTMLCanvasElement>(); // новый матч — новые облака, старые уходят в GC

export async function loadSprites(): Promise<void> {
  const [plane, roll, explosion, ground, farHills] = await Promise.all([
    loadImage(planeUrl),
    loadImage(planeRollUrl),
    loadImage(explosionUrl),
    loadImage(groundUrl),
    loadImage(farHillsUrl),
  ]);
  planeSprites = redAndBlue(plane);
  rollSprites = redAndBlue(roll);
  explosionImage = explosion;
  groundImage = ground;
  farHillsImage = farHills;
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`не удалось загрузить спрайт ${url}`));
    img.src = url;
  });
}

function redAndBlue(img: HTMLImageElement): [HTMLCanvasElement, HTMLCanvasElement] {
  const red = spriteCanvas(img);
  const blue = spriteCanvas(img);
  const bctx = blue.getContext('2d')!;
  const pixels = bctx.getImageData(0, 0, blue.width, blue.height);
  pixels.data.set(recolorRedToBlue(pixels.data));
  bctx.putImageData(pixels, 0, 0);
  return [red, blue];
}

function spriteCanvas(img: HTMLImageElement): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  canvas.getContext('2d')!.drawImage(img, 0, 0);
  return canvas;
}

export function planeSprite(player: 0 | 1): HTMLCanvasElement {
  if (!planeSprites) throw notLoaded();
  return planeSprites[player];
}

export function planeRollSprite(player: 0 | 1): HTMLCanvasElement {
  if (!rollSprites) throw notLoaded();
  return rollSprites[player];
}

export function explosionSprite(): HTMLImageElement {
  if (!explosionImage) throw notLoaded();
  return explosionImage;
}

export function groundSprite(): HTMLImageElement {
  if (!groundImage) throw notLoaded();
  return groundImage;
}

export function farHillsSprite(): HTMLImageElement {
  if (!farHillsImage) throw notLoaded();
  return farHillsImage;
}

export function cloudSprite(c: Cloud): HTMLCanvasElement {
  let img = cloudCache.get(c);
  if (!img) {
    img = renderCloud(c.rx, c.ry, c.seed);
    cloudCache.set(c, img);
  }
  return img;
}

function notLoaded(): Error {
  return new Error('спрайты не загружены: сначала вызови loadSprites()');
}
