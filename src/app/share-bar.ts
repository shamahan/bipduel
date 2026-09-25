import iconsUrl from '../render/share-icons.png';
import { SHARE_NETWORKS, gameUrl, shareLinks } from './share';
import { SHARE_STRINGS } from '../i18n/share';
import type { Language } from '../i18n/languages';

const COPIED_MS = 2000; // сколько вместо подписи висит «ссылка скопирована»

export type ShareBar = { sync(visible: boolean, language: Language): void };

// Панель «поделиться» внизу меню: настоящие ссылки поверх канваса, чтобы работали клик,
// Tab и открытие в новой вкладке. Иконки — кадры share-icons.png, по кадру на сеть.
export function mountShareBar(root: HTMLElement, href: string): ShareBar {
  const url = gameUrl(href);
  root.style.setProperty('--icons', `url(${iconsUrl})`);
  root.style.setProperty('--frames', String(SHARE_NETWORKS.length + 1)); // сети + «скопировать ссылку»

  const label = document.createElement('span');
  label.id = 'share-label';
  label.setAttribute('aria-live', 'polite');
  root.setAttribute('aria-labelledby', label.id);
  const icons = document.createElement('div');
  icons.className = 'share-icons';
  root.append(label, icons);

  const anchors = SHARE_NETWORKS.map((_, k) => {
    const a = document.createElement('a');
    a.className = 'share-btn';
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.style.setProperty('--frame', String(k));
    a.addEventListener('click', () => a.blur()); // фокус не должен оставаться на ссылке после клика
    icons.append(a);
    return a;
  });

  const copy = document.createElement('button');
  copy.type = 'button';
  copy.className = 'share-btn';
  copy.style.setProperty('--frame', String(SHARE_NETWORKS.length));
  icons.append(copy);

  // Enter/Space на кнопке панели — её действие, а не старт матча: окно их глотает через preventDefault
  root.addEventListener('keydown', (e) => {
    if (e.code === 'Enter' || e.code === 'Space') e.stopPropagation();
  });

  let copiedUntil = 0;
  let shown: boolean | null = null;
  let painted = '';
  copy.addEventListener('click', async () => {
    copy.blur();
    if (await copyText(url)) copiedUntil = performance.now() + COPIED_MS;
  });

  return {
    sync(visible, language) {
      if (visible !== shown) root.hidden = !(shown = visible);
      const copied = performance.now() < copiedUntil;
      const state = `${language}:${copied}`;
      if (state === painted) return; // DOM трогаем, только когда что-то поменялось
      painted = state;
      const t = SHARE_STRINGS[language];
      label.textContent = copied ? t.copied : t.label;
      shareLinks(url, t.text).forEach((link, k) => {
        anchors[k].href = link.href;
        anchors[k].title = t.via(link.name);
        anchors[k].setAttribute('aria-label', t.via(link.name));
      });
      copy.title = t.copy;
      copy.setAttribute('aria-label', t.copy);
    },
  };
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // буфер обмена недоступен (страница не по https, запрет браузера) — старый способ
    const area = document.createElement('textarea');
    area.value = text;
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.append(area);
    area.select();
    const ok = document.execCommand('copy');
    area.remove();
    return ok;
  }
}
