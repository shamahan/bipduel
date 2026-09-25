export const LANGUAGES = ['en', 'de', 'fr', 'es', 'it', 'pt', 'pl', 'nl', 'ru', 'uk'] as const;

export type Language = (typeof LANGUAGES)[number];
