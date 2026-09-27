import { STRINGS } from '../i18n';
import type { Language } from '../i18n/languages';
import type { Screen } from './app';

export type OverlayActions = { readonly screen: Screen; resume(): void; rematch(): void; toMenu(): void };
export type OverlayButtons = { sync(touch: boolean, language: Language): void };

// Кнопки под заголовком паузы и конца матча на сенсорном экране — там, где на ПК подсказка про
// клавиши (её канвас в сенсорном режиме не рисует). Первая — «Продолжить» или «Реванш», вторая —
// «В меню». Срабатывают по click (мышь, клавиатура) и по pointerup для касания/пера: палец
// автозахватывается той кнопкой, на которой опустился, так что pointerup придёт именно на неё,
// а click при другом пальце на экране может и не случиться. Экранные guard'ы в App делают
// повторный click после pointerup безопасным no-op.
export function mountOverlayButtons(root: HTMLElement, app: OverlayActions): OverlayButtons {
  const primary = document.createElement('button');
  const menu = document.createElement('button');
  for (const b of [primary, menu]) {
    b.type = 'button';
    b.className = 'overlay-btn';
    root.append(b);
  }
  const activatePrimary = () => {
    primary.blur();
    if (app.screen === 'paused') app.resume();
    else app.rematch();
  };
  primary.addEventListener('click', activatePrimary);
  primary.addEventListener('pointerup', (e) => {
    if (e.pointerType !== 'mouse') activatePrimary();
  });
  const activateMenu = () => {
    menu.blur();
    app.toMenu();
  };
  menu.addEventListener('click', activateMenu);
  menu.addEventListener('pointerup', (e) => {
    if (e.pointerType !== 'mouse') activateMenu();
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
