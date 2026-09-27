import { STRINGS } from '../i18n';
import type { Language } from '../i18n/languages';
import type { Screen } from './app';

export type OverlayActions = { readonly screen: Screen; resume(): void; rematch(): void; toMenu(): void };
export type OverlayButtons = { sync(touch: boolean, language: Language): void };

// Кнопки под заголовком паузы и конца матча на сенсорном экране — там, где на ПК подсказка про
// клавиши (её канвас в сенсорном режиме не рисует). Первая — «Продолжить» или «Реванш», вторая —
// «В меню». Срабатывают по click, то есть по отпусканию пальца.
export function mountOverlayButtons(root: HTMLElement, app: OverlayActions): OverlayButtons {
  const primary = document.createElement('button');
  const menu = document.createElement('button');
  for (const b of [primary, menu]) {
    b.type = 'button';
    b.className = 'overlay-btn';
    root.append(b);
  }
  primary.addEventListener('click', () => {
    primary.blur();
    if (app.screen === 'paused') app.resume();
    else app.rematch();
  });
  menu.addEventListener('click', () => {
    menu.blur();
    app.toMenu();
  });

  let painted = '';
  return {
    sync(touch, language) {
      const screen = app.screen;
      const visible = touch && (screen === 'paused' || screen === 'gameover');
      const state = visible ? `${screen}:${language}` : '';
      if (state === painted) return; // DOM трогаем, только когда что-то поменялось
      painted = state;
      root.hidden = !visible;
      if (!visible) return;
      const t = STRINGS[language];
      primary.textContent = screen === 'paused' ? t.resume : t.rematch;
      menu.textContent = t.toMenu;
    },
  };
}
