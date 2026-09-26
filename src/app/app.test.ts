import { describe, it, expect } from 'vitest';
import { App, NullSound } from './app';
import { inputs } from '../sim/test-helpers';
import { TUNING } from '../sim/tuning';
import { Settings } from './settings';
import { STRINGS } from '../i18n';
import { fillTextCalls } from '../render/test-helpers';

function newApp() {
  return new App(new NullSound());
}

describe('App', () => {
  it('старт матча разблокирует звук (resume по нажатию клавиши)', () => {
    const sound = new NullSound();
    let resumed = 0;
    sound.resume = () => { resumed++; };
    const app = new App(sound);
    app.handleKey('Space');
    expect(resumed).toBe(1);
  });

  it('«Игра» запускает матч с очками и магазином из настроек', () => {
    const app = new App(new NullSound(), { language: 'en', target: 25, magazine: 15 });
    app.handleKey('Space');
    expect(app.screen).toBe('playing');
    expect(app.state!.mode).toEqual({ kind: 'first-to', target: 25 });
    expect(app.state!.magazine).toBe(15);
    expect(app.state!.planes[0].ammo).toBe(15);
  });

  it('очки «без лимита» — бесконечный матч', () => {
    const app = new App(new NullSound(), { language: 'en', target: null, magazine: 5 });
    app.handleKey('Enter');
    expect(app.state!.mode).toEqual({ kind: 'endless' });
  });

  it('в меню ←/→ листают значения по кругу и сразу сохраняют настройки', () => {
    const saved: Settings[] = [];
    const app = new App(new NullSound(), { language: 'en', target: 50, magazine: 20 }, (s) => saved.push({ ...s }));
    app.handleKey('KeyS'); // язык
    app.handleKey('ArrowRight'); // en -> de
    expect(app.settings.language).toBe('de');
    app.handleKey('ArrowDown'); // очки
    app.handleKey('ArrowRight'); // 50 -> без лимита
    expect(app.settings.target).toBeNull();
    app.handleKey('KeyS'); // патроны
    app.handleKey('KeyD'); // 20 -> 5
    expect(app.settings.magazine).toBe(5);
    app.handleKey('KeyA'); // 5 -> 20
    expect(app.settings.magazine).toBe(20);
    expect(saved).toHaveLength(4);
    expect(saved[3]).toEqual({ language: 'de', target: null, magazine: 20 });
    expect(app.screen).toBe('menu');
  });

  it('Space на значении листает вперёд, на «Играть» — запускает матч', () => {
    const app = new App(new NullSound(), { language: 'en', target: 10, magazine: 5 });
    app.handleKey('ArrowUp'); // по кругу вверх: «Играть» -> патроны
    app.handleKey('Space');
    expect(app.settings.magazine).toBe(10);
    expect(app.screen).toBe('menu');
    app.handleKey('ArrowDown'); // по кругу вниз: патроны -> «Играть»
    app.handleKey('Space');
    expect(app.screen).toBe('playing');
    expect(app.state!.magazine).toBe(10);
  });

  it('←/→ на «Играть» ничего не меняют и матч не запускают', () => {
    const saved: Settings[] = [];
    const app = new App(new NullSound(), { language: 'en', target: 10, magazine: 5 }, (s) => saved.push(s));
    app.handleKey('ArrowLeft');
    app.handleKey('ArrowRight');
    expect(app.screen).toBe('menu');
    expect(saved).toHaveLength(0);
  });

  it('смена настроек после старта не влияет на идущий матч', () => {
    const app = new App(new NullSound(), { language: 'en', target: 10, magazine: 5 });
    app.handleKey('Space');
    app.settings.magazine = 20;
    app.settings.target = null;
    expect(app.state!.magazine).toBe(5);
    expect(app.state!.mode).toEqual({ kind: 'first-to', target: 10 });
  });

  it('Escape ставит на паузу и снимает с паузы', () => {
    const app = newApp();
    app.handleKey('Space');
    app.handleKey('Escape');
    expect(app.screen).toBe('paused');
    app.handleKey('Escape');
    expect(app.screen).toBe('playing');
  });

  it('на паузе симуляция не тикает', () => {
    const app = newApp();
    app.handleKey('Space');
    app.handleKey('Escape');
    const x0 = app.state!.planes[0].x;
    app.update(inputs(), TUNING.fixedDt);
    expect(app.state!.planes[0].x).toBe(x0);
  });

  it('победа переводит на экран gameover; Space — реванш с нулевым счётом', () => {
    const app = newApp();
    app.handleKey('Space');
    app.state!.winner = 0;
    app.update(inputs(), TUNING.fixedDt);
    expect(app.screen).toBe('gameover');
    app.handleKey('Space');
    expect(app.screen).toBe('playing');
    expect(app.state!.scores).toEqual([0, 0]);
    expect(app.state!.winner).toBeNull();
  });

  it('на экране gameover Enter тоже запускает реванш', () => {
    const app = newApp();
    app.handleKey('Space');
    app.state!.winner = 0;
    app.update(inputs(), TUNING.fixedDt);
    expect(app.screen).toBe('gameover');
    app.handleKey('Enter');
    expect(app.screen).toBe('playing');
    expect(app.state!.scores).toEqual([0, 0]);
    expect(app.state!.winner).toBeNull();
  });

  it('Q на паузе выходит в меню', () => {
    const app = newApp();
    app.handleKey('Space');
    app.handleKey('KeyP');
    app.handleKey('KeyQ');
    expect(app.screen).toBe('menu');
  });

  it('pauseIfPlaying() переводит playing в paused', () => {
    const app = newApp();
    app.handleKey('Space');
    expect(app.screen).toBe('playing');
    app.pauseIfPlaying();
    expect(app.screen).toBe('paused');
  });

  it('pauseIfPlaying() не меняет экран если не playing', () => {
    const app = newApp();
    expect(app.screen).toBe('menu');
    app.pauseIfPlaying();
    expect(app.screen).toBe('menu');
    app.handleKey('Space');
    app.handleKey('Escape');
    expect(app.screen).toBe('paused');
    app.pauseIfPlaying();
    expect(app.screen).toBe('paused');
  });
});

describe('App: касания', () => {
  it('тап по «Играть» запускает матч и разблокирует звук', () => {
    const sound = new NullSound();
    let resumed = 0;
    sound.resume = () => { resumed++; };
    const app = new App(sound);
    app.tapMenu(0, 0);
    expect(app.screen).toBe('playing');
    expect(resumed).toBe(1);
  });

  it('строка «Играть» запускает матч, какой половиной ни тапни', () => {
    const app = newApp();
    app.tapMenu(0, 1);
    expect(app.screen).toBe('playing');
  });

  it('половины строки настройки листают назад и вперёд, курсор встаёт на строку', () => {
    const saved: Settings[] = [];
    const app = new App(new NullSound(), { language: 'en', target: 10, magazine: 5 }, (s) => saved.push({ ...s }));
    app.tapMenu(2, -1); // очки: 10 -> 5
    expect(app.menuIndex).toBe(2);
    app.tapMenu(1, 1); // язык: en -> de
    expect(app.menuIndex).toBe(1);
    app.tapMenu(3, -1); // патроны: 5 -> 20 по кругу
    expect(app.menuIndex).toBe(3);
    expect(saved).toEqual([
      { language: 'en', target: 5, magazine: 5 },
      { language: 'de', target: 5, magazine: 5 },
      { language: 'de', target: 5, magazine: 20 },
    ]);
    expect(app.screen).toBe('menu');
  });

  it('вне меню тапы по строкам ничего не делают', () => {
    const app = new App(new NullSound(), { language: 'en', target: 10, magazine: 5 });
    app.tapMenu(0, 0);
    app.tapMenu(1, 1);
    expect(app.settings.language).toBe('en');
    expect(app.menuIndex).toBe(0);
  });

  it('⏸, «Продолжить» и «В меню»', () => {
    const app = newApp();
    app.tapMenu(0, 0);
    app.pauseIfPlaying();
    expect(app.screen).toBe('paused');
    app.resume();
    expect(app.screen).toBe('playing');
    app.pauseIfPlaying();
    app.toMenu();
    expect(app.screen).toBe('menu');
  });

  it('«Реванш» после матча — новый матч с нулевым счётом, «В меню» — в меню', () => {
    const app = newApp();
    app.tapMenu(0, 0);
    app.state!.winner = 0;
    app.update(inputs(), TUNING.fixedDt);
    expect(app.screen).toBe('gameover');
    app.rematch();
    expect(app.screen).toBe('playing');
    expect(app.state!.scores).toEqual([0, 0]);
    app.state!.winner = 1;
    app.update(inputs(), TUNING.fixedDt);
    app.toMenu();
    expect(app.screen).toBe('menu');
  });

  it('кнопки оверлеев не действуют не на своём экране', () => {
    const app = newApp();
    app.resume();
    app.rematch();
    app.toMenu();
    expect(app.screen).toBe('menu');
    app.tapMenu(0, 0);
    app.resume();
    app.rematch();
    app.toMenu();
    expect(app.screen).toBe('playing');
  });

  it('подсказка меню: три строки про клавиши, на сенсорном экране — одна про кнопки', () => {
    const t = STRINGS.ru;
    const app = new App(new NullSound(), { language: 'ru', target: 10, magazine: 5 });
    const texts = () => fillTextCalls((ctx) => app.draw(ctx)).map(([text]) => text);
    expect(texts()).toContain(t.helpP1);
    expect(texts()).not.toContain(t.touchHelp);
    app.touch = true;
    expect(texts()).toContain(t.touchHelp);
    expect(texts()).not.toContain(t.helpP1);
  });
});
