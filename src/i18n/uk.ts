import { Strings } from './strings';

export const uk: Strings = {
  languageName: 'Українська',
  play: 'Грати',
  language: 'Мова',
  target: 'Очки до перемоги',
  magazine: 'Набої',
  unlimited: 'Без ліміту',
  helpP1: 'P1: A/D — поворот, W/S — вогонь',
  helpP2: 'P2: ←/→ — поворот, ↑/↓ — вогонь',
  helpMenu: '↑/↓ — вибір, ←/→ — змінити, ПРОБІЛ — OK, P — пауза, M — звук',
  firstTo: (n) => `до ${n}`,
  reloading: 'ПЕРЕЗАРЯДЖАННЯ…',
  paused: 'ПАУЗА',
  pauseHint: 'ПРОБІЛ — продовжити, Q — у меню',
  winner: (p) => `ПЕРЕМІГ P${p}!`,
  matchOver: 'МАТЧ ЗАВЕРШЕНО',
  gameOverHint: 'ПРОБІЛ — реванш, ESC — у меню',
};
