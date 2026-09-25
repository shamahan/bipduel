import { Strings } from './strings';

export const fr: Strings = {
  languageName: 'Français',
  play: 'Jouer',
  language: 'Langue',
  target: 'Points pour gagner',
  magazine: 'Munitions',
  unlimited: 'Sans limite',
  helpP1: 'P1 : A/D — tourner, W/S — tirer',
  helpP2: 'P2 : ←/→ — tourner, ↑/↓ — tirer',
  helpMenu: '↑/↓ — choisir, ←/→ — modifier, ESPACE — OK, P — pause, M — son',
  firstTo: (n) => `en ${n} pts`,
  reloading: 'RECHARGEMENT…',
  paused: 'PAUSE',
  pauseHint: 'ESPACE — reprendre, Q — menu',
  winner: (p) => `P${p} GAGNE !`,
  matchOver: 'FIN DU MATCH',
  gameOverHint: 'ESPACE — revanche, ÉCHAP — menu',
};
