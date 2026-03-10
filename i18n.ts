import { notFound } from 'next/navigation';

export const locales = ['en', 'fr'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';

export function getMessages(locale: string) {
  if (!locales.includes(locale as Locale)) notFound();
  return import(`./messages/${locale}.json`).then(m => m.default);
}
