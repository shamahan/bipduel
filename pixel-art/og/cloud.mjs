// Пиксели облака из игры (src/render/clouds.ts) для build.py: node cloud.mjs RX RY SEED
// -> строка JSON {width, height}, затем width*height*4 байт RGBA.
import { createServer } from 'vite';
import { fileURLToPath } from 'node:url';

const [rx, ry, seed] = process.argv.slice(2).map(Number);
const root = fileURLToPath(new URL('../..', import.meta.url));
const server = await createServer({ root, appType: 'custom', logLevel: 'silent', server: { middlewareMode: true } });
try {
  const { cloudPixels } = await server.ssrLoadModule('/src/render/clouds.ts');
  const c = cloudPixels(rx, ry, seed);
  process.stdout.write(JSON.stringify({ width: c.width, height: c.height }) + '\n');
  process.stdout.write(Buffer.from(c.data.buffer, c.data.byteOffset, c.data.byteLength));
} finally {
  await server.close();
}
