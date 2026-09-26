export type Strings = {
  languageName: string; // название языка на нём самом — так он виден в списке
  play: string;
  language: string;
  target: string;
  magazine: string;
  unlimited: string;
  helpP1: string;
  helpP2: string;
  helpMenu: string;
  firstTo: (points: number) => string;
  reloading: string;
  paused: string;
  pauseHint: string;
  winner: (player: number) => string;
  matchOver: string;
  gameOverHint: string;
  // сенсорный экран
  touchHelp: string; // одна строка подсказки в меню вместо трёх про клавиши
  resume: string; // кнопки под заголовком паузы и конца матча
  toMenu: string;
  rematch: string;
  rotate: string; // на весь экран в портрете: играть можно только в альбоме
  turnCcw: string; // подписи кнопок боя для скринридера, к ним спереди добавляется «P1: »
  turnCw: string;
  fire: string;
  pause: string;
};
