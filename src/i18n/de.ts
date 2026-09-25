import { Strings } from './strings';

export const de: Strings = {
  languageName: 'Deutsch',
  play: 'Spielen',
  language: 'Sprache',
  target: 'Punkte zum Sieg',
  magazine: 'Munition',
  unlimited: 'Ohne Limit',
  helpP1: 'P1: A/D — drehen, W/S — feuern',
  helpP2: 'P2: ←/→ — drehen, ↑/↓ — feuern',
  helpMenu: '↑/↓ — wählen, ←/→ — ändern, LEERTASTE — OK, P — Pause, M — Ton',
  firstTo: (n) => `bis ${n}`,
  reloading: 'NACHLADEN…',
  paused: 'PAUSE',
  pauseHint: 'LEERTASTE — weiter, Q — Menü',
  winner: (p) => `P${p} GEWINNT!`,
  matchOver: 'SPIEL VORBEI',
  gameOverHint: 'LEERTASTE — Revanche, ESC — Menü',
};
