import { Strings } from './strings';

export const es: Strings = {
  languageName: 'Español',
  play: 'Jugar',
  language: 'Idioma',
  target: 'Puntos para ganar',
  magazine: 'Munición',
  unlimited: 'Sin límite',
  helpP1: 'P1: A/D — girar, W/S — disparar',
  helpP2: 'P2: ←/→ — girar, ↑/↓ — disparar',
  helpMenu: '↑/↓ — elegir, ←/→ — cambiar, ESPACIO — OK, P — pausa, M — sonido',
  firstTo: (n) => `a ${n}`,
  reloading: 'RECARGANDO…',
  paused: 'PAUSA',
  pauseHint: 'ESPACIO — seguir, Q — menú',
  winner: (p) => `¡GANA P${p}!`,
  matchOver: 'FIN DE LA PARTIDA',
  gameOverHint: 'ESPACIO — revancha, ESC — menú',
};
