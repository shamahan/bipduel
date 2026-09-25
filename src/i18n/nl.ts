import { Strings } from './strings';

export const nl: Strings = {
  languageName: 'Nederlands',
  play: 'Spelen',
  language: 'Taal',
  target: 'Punten voor winst',
  magazine: 'Munitie',
  unlimited: 'Geen limiet',
  helpP1: 'P1: A/D — draaien, W/S — vuren',
  helpP2: 'P2: ←/→ — draaien, ↑/↓ — vuren',
  helpMenu: '↑/↓ — kiezen, ←/→ — wijzigen, SPATIE — OK, P — pauze, M — geluid',
  firstTo: (n) => `tot ${n}`,
  reloading: 'HERLADEN…',
  paused: 'PAUZE',
  pauseHint: 'SPATIE — verder, Q — menu',
  winner: (p) => `P${p} WINT!`,
  matchOver: 'WEDSTRIJD VOORBIJ',
  gameOverHint: 'SPATIE — revanche, ESC — menu',
};
