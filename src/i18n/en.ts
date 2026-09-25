import { Strings } from './strings';

export const en: Strings = {
  languageName: 'English',
  play: 'Play',
  language: 'Language',
  target: 'Points to win',
  magazine: 'Ammo',
  unlimited: 'No limit',
  helpP1: 'P1: A/D — turn, W/S — fire',
  helpP2: 'P2: ←/→ — turn, ↑/↓ — fire',
  helpMenu: '↑/↓ — select, ←/→ — change, SPACE — OK, P — pause, M — sound',
  firstTo: (n) => `to ${n}`,
  reloading: 'RELOADING…',
  paused: 'PAUSED',
  pauseHint: 'SPACE — resume, Q — menu',
  winner: (p) => `P${p} WINS!`,
  matchOver: 'MATCH OVER',
  gameOverHint: 'SPACE — rematch, ESC — menu',
};
