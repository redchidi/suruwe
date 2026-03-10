import { notFound } from 'next/navigation';
import type { AbstractIntlMessages } from 'next-intl';

export const locales = ['en', 'fr'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';

export async function getMessages(locale: string): Promise<AbstractIntlMessages> {
  if (!locales.includes(locale as Locale)) notFound();
  const messages = await import(`./messages/${locale}.json`);
  return messages.default as AbstractIntlMessages;
}
