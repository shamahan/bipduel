import { Strings } from './strings';

export const pt: Strings = {
  languageName: 'Português',
  play: 'Jogar',
  language: 'Idioma',
  target: 'Pontos para vencer',
  magazine: 'Munição',
  unlimited: 'Sem limite',
  helpP1: 'P1: A/D — virar, W/S — disparar',
  helpP2: 'P2: ←/→ — virar, ↑/↓ — disparar',
  helpMenu: '↑/↓ — escolher, ←/→ — mudar, ESPAÇO — OK, P — pausa, M — som',
  firstTo: (n) => `até ${n}`,
  reloading: 'RECARREGANDO…',
  paused: 'PAUSA',
  pauseHint: 'ESPAÇO — continuar, Q — menu',
  winner: (p) => `P${p} VENCEU!`,
  matchOver: 'FIM DE JOGO',
  gameOverHint: 'ESPAÇO — revanche, ESC — menu',
};
