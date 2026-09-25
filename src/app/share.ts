// Кнопки «поделиться игрой»: адреса сервисов, которые открывают окно публикации
// с уже подставленной ссылкой на игру. Сервисы сами ничего не знают об игре — всё в параметрах.

export type ShareNetworkId = 'telegram' | 'whatsapp' | 'x' | 'facebook' | 'reddit';

type Network = {
  id: ShareNetworkId;
  name: string; // как сеть пишет себя сама — подставляется в подписи
  host: string;
  link: (url: string, text: string) => string;
};

// Порядок — порядок кнопок и кадров в src/render/share-icons.png (pixel-art/share/build.py).
export const SHARE_NETWORKS: readonly Network[] = [
  { id: 'telegram', name: 'Telegram', host: 't.me', link: (url, text) => build('https://t.me/share/url', { url, text }) },
  { id: 'whatsapp', name: 'WhatsApp', host: 'wa.me', link: (url, text) => build('https://wa.me/', { text: `${text} ${url}` }) },
  { id: 'x', name: 'X', host: 'twitter.com', link: (url, text) => build('https://twitter.com/intent/tweet', { url, text }) },
  { id: 'facebook', name: 'Facebook', host: 'facebook.com', link: (url) => build('https://www.facebook.com/sharer/sharer.php', { u: url }) },
  { id: 'reddit', name: 'Reddit', host: 'reddit.com', link: (url, text) => build('https://www.reddit.com/submit', { url, title: text }) },
];

// Делимся самой игрой, а не текущим состоянием адресной строки.
export function gameUrl(href: string): string {
  const u = new URL(href);
  u.search = '';
  u.hash = '';
  return u.href;
}

export function shareLinks(url: string, text: string): { id: ShareNetworkId; name: string; href: string }[] {
  return SHARE_NETWORKS.map((n) => ({ id: n.id, name: n.name, href: n.link(url, text) }));
}

// encodeURIComponent, а не URLSearchParams: пробел как %20, а не «+», — так его понимают все сервисы
function build(base: string, params: Record<string, string>): string {
  const query = Object.entries(params).map(([k, v]) => `${k}=${encodeURIComponent(v)}`);
  return `${base}?${query.join('&')}`;
}
