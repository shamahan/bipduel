import { describe, it, expect } from 'vitest';
import { SHARE_NETWORKS, gameUrl, shareLinks } from './share';
import { SHARE_STRINGS } from '../i18n/share';
import { LANGUAGES } from '../i18n/languages';
import iconsDataUrl from '../render/share-icons.png?inline';

const GAME = 'https://example.org/bipduel/';
const TEXT = 'BipDuel: дуэль & бипланы #1';

// все параметры ссылки, в которых мог оказаться адрес игры или текст
function params(href: string): string[] {
  return [...new URL(href).searchParams.values()];
}

describe('набор кнопок', () => {
  it('сети и их порядок на панели', () => {
    expect(SHARE_NETWORKS.map((n) => n.id)).toEqual(['telegram', 'whatsapp', 'x', 'facebook', 'reddit']);
  });

  it('в share-icons.png по кадру 16x16 на сеть, «скопировать ссылку» и галочку «скопировано»', () => {
    const png = atob(iconsDataUrl.split(',')[1]);
    const u32 = (at: number) => [0, 1, 2, 3].reduce((n, i) => n * 256 + png.charCodeAt(at + i), 0);
    expect(u32(16)).toBe((SHARE_NETWORKS.length + 2) * 16); // IHDR: ширина
    expect(u32(20)).toBe(16); // IHDR: высота
  });
});

describe('ссылки для шаринга', () => {
  it('делятся адресом игры без query и hash', () => {
    expect(gameUrl('https://example.org/bipduel/?debug=1#menu')).toBe(GAME);
    expect(gameUrl('http://localhost:5173/')).toBe('http://localhost:5173/');
  });

  it('у каждой сети — своя ссылка на её сервис, открывается по https', () => {
    const links = shareLinks(GAME, TEXT);
    expect(links.map((l) => l.id)).toEqual(SHARE_NETWORKS.map((n) => n.id));
    for (const { id, href } of links) {
      const host = new URL(href).hostname;
      const expected = SHARE_NETWORKS.find((n) => n.id === id)!.host;
      expect(new URL(href).protocol).toBe('https:');
      expect(host === expected || host.endsWith('.' + expected)).toBe(true);
    }
  });

  it('каждая ссылка несёт адрес игры', () => {
    for (const { href } of shareLinks(GAME, TEXT)) {
      expect(params(href).some((v) => v.includes(GAME))).toBe(true);
    }
  });

  it('текст приглашения доходит без потерь, где сеть его принимает', () => {
    for (const { id, href } of shareLinks(GAME, TEXT)) {
      if (id === 'facebook') continue; // Facebook берёт только адрес, текст подтянет из страницы
      expect(params(href).some((v) => v.includes(TEXT))).toBe(true);
    }
  });
});

describe('переводы шаринга', () => {
  for (const lang of LANGUAGES) {
    it(`${lang}: все фразы есть`, () => {
      const t = SHARE_STRINGS[lang];
      for (const s of [t.label, t.copy, t.copied, t.text]) expect(s.trim()).not.toBe('');
      for (const n of SHARE_NETWORKS) expect(t.via(n.name)).toContain(n.name);
    });

    it(`${lang}: в словах не смешаны латиница и кириллица`, () => {
      const t = SHARE_STRINGS[lang];
      const words = [t.label, t.via('X'), t.copy, t.copied, t.text].flatMap((s) => s.split(/[^\p{L}]+/u));
      expect(words.filter((w) => /\p{Script=Latin}/u.test(w) && /\p{Script=Cyrillic}/u.test(w))).toEqual([]);
    });
  }
});
