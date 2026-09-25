import { COLORS } from './palette';

// Облако для игры — эллипс (sim/visibility.ts). Для глаза: тело-суперэллипс, которое целиком
// содержит этот эллипс, плюс клубы по верхней дуге — они и дают рваный край. Всё это один объём:
// тело и клубы — полусферы, пиксель берёт тон по свету на самой высокой из них.
export const PUFF_RADII = [6, 9, 12, 15];
const BODY_EXPONENT = 2.5; // при n > 2 суперэллипс содержит эллипс того же размера
const PAD = Math.max(...PUFF_RADII) + 1; // клубы вылезают за эллипс не дальше своего радиуса

export type Puff = { dx: number; dy: number; v: number }; // центр относительно центра облака, v — индекс радиуса

export function layoutPuffs(seed: number, rx: number, ry: number): Puff[] {
  const rnd = mulberry32(seed);
  const fits = PUFF_RADII.map((r, v) => ({ r, v })).filter(({ r }) => r >= ry * 0.34 && r <= ry * 0.75);
  // крупные клубы к середине, мелкие к краям — облако получается куполом
  const sizeAt = (x: number) => fits[Math.min(fits.length - 1, Math.floor((1 - Math.abs(x) / rx) * fits.length + rnd() * 1.2))];
  const end = fits[0];
  const crown = fits[fits.length - 1];
  const halfHeight = (x: number) => ry * Math.sqrt(Math.max(0, 1 - (x / rx) ** 2));
  // lift 0..1: насколько центр клуба поднят от оси к верхней границе эллипса
  const at = (x: number, v: number, lift: number): Puff => {
    const dx = Math.round(x);
    return { dx, dy: -Math.floor(halfHeight(dx) * lift), v };
  };

  // верхний ярус рисуется первым, основной ряд ложится поверх
  const puffs = [at((rnd() * 2 - 1) * rx * 0.25, crown.v, 0.8 + rnd() * 0.2)];
  if (ry >= 20) {
    for (let n = Math.floor(rnd() * 3); n > 0; n--) {
      const x = (rnd() * 2 - 1) * rx * 0.45;
      puffs.push(at(x, sizeAt(x).v, 0.85 + rnd() * 0.15));
    }
  }

  // основной ряд слева направо; крайние клубы закрывают скругления тела
  const left = -rx + end.r * 0.9;
  const right = rx - end.r * 0.9;
  puffs.push(at(left, end.v, 0.3 + rnd() * 0.3));
  let x = left;
  let r = end.r;
  for (;;) {
    const next = sizeAt(x + r);
    const nx = x + (r + next.r) * (0.6 + rnd() * 0.35);
    if (nx > right - (next.r + end.r) * 0.5) break;
    puffs.push(at(nx, next.v, 0.45 + rnd() * 0.55));
    x = nx;
    r = next.r;
  }
  puffs.push(at(right, end.v, 0.3 + rnd() * 0.3));
  return puffs;
}

// Свет почти скользящий, сверху-слева: блик ложится ободком по верхнему краю клубов,
// а не пятном в центре каждого (иначе клубы выглядят жемчужинами).
const LIGHT = unit(-0.4, -0.9, 0.2);
const TONE_STEPS = [0.24, 0.45, 0.62, 0.86]; // пороги яркости между соседними тонами
const DITHER = 0.03; // у двух тёмных порогов полоса такой ширины идёт шахматкой — мягкий переход в тень
const BASE_EXPONENT = 4.5; // низ тела площе верха: у кучевого облака плоское основание
const PUFF_LIFT = 0.45; // клуб сидит на теле: центр сферы поднят на эту долю высоты тела под ним
const FRONT_LIFT = 0.62; // передние клубы выпирают из тела к зрителю сильнее верхних
const UNDERSIDE = 0.34; // насколько темнеет низ облака, куда не достаёт свет
const OVERHANG = 1.5; // клуб выше соседа на столько px — отбрасывает на него тень

export type CloudPixels = { width: number; height: number; data: Uint8ClampedArray<ArrayBuffer> };

// Пиксели облака (RGBA), центр облака — центр картинки.
export function cloudPixels(rx: number, ry: number, seed: number): CloudPixels {
  const width = 2 * (rx + PAD);
  const height = 2 * (ry + PAD);
  // Тело — суперэллипс: верх со степенью BODY_EXPONENT, низ площе. Обе степени > 2,
  // так что тело содержит эллипс, в котором самолёт невидим.
  const ey = (y: number) => (y > 0 ? BASE_EXPONENT : BODY_EXPONENT);
  const bodyShape = (x: number, y: number) => Math.abs(x / rx) ** BODY_EXPONENT + Math.abs(y / ry) ** ey(y);
  const bodyHeight = (x: number, y: number) => {
    const q = bodyShape(x, y);
    return q > 1 ? -1 : ry * Math.sqrt(1 - q ** 0.8);
  };
  const puffs = layoutPuffs(seed, rx, ry).map((p) => ({
    x: p.dx,
    y: p.dy,
    r: PUFF_RADII[p.v],
    lift: Math.max(0, bodyHeight(p.dx, p.dy)) * PUFF_LIFT,
  }));
  const rnd = mulberry32(seed ^ 0x5bd1e995);
  // передний ряд клубов на середине тела: граница света и тени идёт по их буграм
  const front = Math.max(2, Math.round(rx / 18));
  for (let k = 0; k < front; k++) {
    const x = Math.round(-rx * 0.72 + (rx * 1.44 * (k + 0.25 + rnd() * 0.5)) / front);
    const y = Math.round(ry * (0.02 + rnd() * 0.2));
    puffs.push({ x, y, r: Math.round(ry * (0.36 + rnd() * 0.26)), lift: Math.max(0, bodyHeight(x, y)) * FRONT_LIFT });
  }
  // волна по границе тени снизу — чтобы полосы не шли по линейке
  const p1 = rnd() * 6.3;
  const p2 = rnd() * 6.3;
  const wobble = (x: number) => 1.6 * Math.sin(x * 0.19 + p1) + 0.9 * Math.sin(x * 0.47 + p2);

  // 1. высота и свет самой высокой поверхности в каждом пикселе
  const owner = new Int16Array(width * height).fill(-1); // -1 пусто, 0 тело, k+1 — клуб k
  const top = new Float32Array(width * height);
  const light = new Float32Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const px = x + 0.5 - width / 2;
      const py = y + 0.5 - height / 2;
      const i = y * width + x;
      let best = bodyHeight(px, py);
      let n: [number, number, number] | null = null;
      if (best >= 0) {
        owner[i] = 0;
        // как у сферы: z-компонента — доля высоты, по x/y — вдоль градиента формы
        const gx = (BODY_EXPONENT * Math.sign(px) * Math.abs(px / rx) ** (BODY_EXPONENT - 1)) / rx;
        const gy = (ey(py) * Math.sign(py) * Math.abs(py / ry) ** (ey(py) - 1)) / ry;
        const nz = best / ry;
        const side = Math.sqrt(1 - nz * nz) / (Math.hypot(gx, gy) || 1);
        n = [gx * side, gy * side, nz];
      }
      for (let k = 0; k < puffs.length; k++) {
        const { r, lift } = puffs[k];
        const dx = px - puffs[k].x;
        const dy = py - puffs[k].y;
        const d2 = dx * dx + dy * dy;
        if (d2 > r * r) continue;
        const dz = Math.sqrt(r * r - d2);
        if (dz + lift <= best) continue;
        best = dz + lift;
        owner[i] = k + 1;
        n = [dx / r, dy / r, dz / r];
      }
      if (!n) continue;
      top[i] = best;
      const under = Math.max(0, Math.min(1, (py + wobble(px) + ry * 0.05) / (ry * 0.95))); // 0 выше середины, 1 у дна
      light[i] = 0.62 + 0.42 * dot(n, LIGHT) - UNDERSIDE * under;
    }
  }

  // 2. тона; клуб, нависающий сверху-слева над соседом, отбрасывает на него тень
  const tone = new Int8Array(width * height).fill(-1);
  const dithered = new Uint8Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      if (owner[i] < 0) continue;
      const bias = (x + y) & 1 ? DITHER : -DITHER;
      let t = 0;
      TONE_STEPS.forEach((s, k) => {
        const soft = k < 2 && Math.abs(light[i] - s) < DITHER;
        if (soft) dithered[i] = 1;
        if (light[i] >= s + (soft ? bias : 0)) t++;
      });
      for (const [ox, oy] of [[-1, -1], [0, -1], [-1, 0]]) {
        const j = (y + oy) * width + (x + ox);
        if (x + ox >= 0 && y + oy >= 0 && owner[j] >= 0 && owner[j] !== owner[i] && top[j] > top[i] + OVERHANG) {
          t = Math.max(0, t - 1);
          dithered[i] = 0;
          break;
        }
      }
      tone[i] = t;
    }
  }

  // 3. одиночный пиксель своего тона — шум при 1x: перекрашиваем в тон соседей (шахматку не трогаем)
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = y * width + x;
      if (tone[i] < 0 || dithered[i]) continue;
      const around = [tone[i - 1], tone[i + 1], tone[i - width], tone[i + width]].filter((t) => t >= 0);
      if (around.length && !around.includes(tone[i])) tone[i] = mostCommon(around);
    }
  }

  const rgb = COLORS.cloudTones.map((hex) => [1, 3, 5].map((k) => parseInt(hex.slice(k, k + 2), 16)));
  const data = new Uint8ClampedArray(width * height * 4);
  tone.forEach((t, i) => {
    if (t < 0) return;
    data.set([...rgb[t], 255], i * 4);
  });
  return { width, height, data };
}

// Картинка облака для рендера: центр облака — центр холста.
export function renderCloud(rx: number, ry: number, seed: number): HTMLCanvasElement {
  const { width, height, data } = cloudPixels(rx, ry, seed);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  canvas.getContext('2d')!.putImageData(new ImageData(data, width, height), 0, 0);
  return canvas;
}

function unit(x: number, y: number, z: number): [number, number, number] {
  const l = Math.hypot(x, y, z);
  return [x / l, y / l, z / l];
}

function dot(a: [number, number, number], b: [number, number, number]): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

function mostCommon(xs: number[]): number {
  let best = xs[0];
  let count = 0;
  for (const x of xs) {
    const c = xs.filter((y) => y === x).length;
    if (c > count) [best, count] = [x, c];
  }
  return best;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
