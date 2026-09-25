import { Language } from './languages';

export type ShareStrings = {
  label: string; // видна слева от иконок
  via: (network: string) => string; // подпись кнопки для скринридера и всплывающая подсказка
  copy: string;
  copied: string; // видна на месте label, пока ссылка только что скопирована
  text: string; // приглашение, которое уходит в сеть вместе со ссылкой
};

export const SHARE_STRINGS: Record<Language, ShareStrings> = {
  en: {
    label: 'Share',
    via: (n) => `Share on ${n}`,
    copy: 'Copy link',
    copied: 'Link copied',
    text: 'BipDuel: a biplane dogfight for two on one keyboard',
  },
  de: {
    label: 'Teilen',
    via: (n) => `Auf ${n} teilen`,
    copy: 'Link kopieren',
    copied: 'Link kopiert',
    text: 'BipDuel: Doppeldecker-Luftduell zu zweit an einer Tastatur',
  },
  fr: {
    label: 'Partager',
    via: (n) => `Partager sur ${n}`,
    copy: 'Copier le lien',
    copied: 'Lien copié',
    text: 'BipDuel : un duel de biplans à deux sur un seul clavier',
  },
  es: {
    label: 'Compartir',
    via: (n) => `Compartir en ${n}`,
    copy: 'Copiar enlace',
    copied: 'Enlace copiado',
    text: 'BipDuel: un duelo de biplanos para dos en un solo teclado',
  },
  it: {
    label: 'Condividi',
    via: (n) => `Condividi su ${n}`,
    copy: 'Copia link',
    copied: 'Link copiato',
    text: 'BipDuel: un duello tra biplani in due su una sola tastiera',
  },
  pt: {
    label: 'Compartilhar',
    via: (n) => `Compartilhar no ${n}`,
    copy: 'Copiar link',
    copied: 'Link copiado',
    text: 'BipDuel: um duelo de biplanos para dois em um só teclado',
  },
  pl: {
    label: 'Udostępnij',
    via: (n) => `Udostępnij przez ${n}`,
    copy: 'Kopiuj link',
    copied: 'Link skopiowany',
    text: 'BipDuel: pojedynek dwupłatowców we dwóch na jednej klawiaturze',
  },
  nl: {
    label: 'Delen',
    via: (n) => `Delen via ${n}`,
    copy: 'Link kopiëren',
    copied: 'Link gekopieerd',
    text: 'BipDuel: een tweedekkerduel voor twee op één toetsenbord',
  },
  ru: {
    label: 'Поделиться',
    via: (n) => `Поделиться в ${n}`,
    copy: 'Скопировать ссылку',
    copied: 'Ссылка скопирована',
    text: 'BipDuel — дуэль бипланов вдвоём на одной клавиатуре',
  },
  uk: {
    label: 'Поділитися',
    via: (n) => `Поділитися в ${n}`,
    copy: 'Скопіювати посилання',
    copied: 'Посилання скопійовано',
    text: 'BipDuel — дуель біпланів удвох на одній клавіатурі',
  },
};
