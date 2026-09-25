import { Strings } from '../i18n/strings';
import { Settings } from './settings';

export type MenuItem = 'play' | 'language' | 'target' | 'magazine';

export const MENU_ITEMS: readonly MenuItem[] = ['play', 'language', 'target', 'magazine'];

export function menuRows(t: Strings, s: Settings): string[] {
  const target = s.target === null ? t.unlimited : String(s.target);
  return [t.play, `${t.language}  < ${t.languageName} >`, `${t.target}  < ${target} >`, `${t.magazine}  < ${s.magazine} >`];
}
