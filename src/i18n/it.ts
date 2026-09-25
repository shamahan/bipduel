import { Strings } from './strings';

export const it: Strings = {
  languageName: 'Italiano',
  play: 'Gioca',
  language: 'Lingua',
  target: 'Punti per vincere',
  magazine: 'Munizioni',
  unlimited: 'Senza limite',
  helpP1: 'P1: A/D — virare, W/S — sparare',
  helpP2: 'P2: ←/→ — virare, ↑/↓ — sparare',
  helpMenu: '↑/↓ — scegli, ←/→ — cambia, SPAZIO — OK, P — pausa, M — audio',
  firstTo: (n) => `a ${n}`,
  reloading: 'RICARICA…',
  paused: 'PAUSA',
  pauseHint: 'SPAZIO — riprendi, Q — menu',
  winner: (p) => `VINCE P${p}!`,
  matchOver: 'PARTITA FINITA',
  gameOverHint: 'SPAZIO — rivincita, ESC — menu',
};
