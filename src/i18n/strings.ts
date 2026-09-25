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
};
