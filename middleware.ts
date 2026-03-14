import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './i18n';

export default createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'as-needed',
});

export const config = {
  // Exclude: api routes, Next.js internals, dotfiles, and PWA files
  matcher: ['/((?!api|_next|_vercel|sw\\.js|manifest\\.json|\\..*).*)'],
};
