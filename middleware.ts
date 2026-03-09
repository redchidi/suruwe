import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './i18n';

export default createMiddleware({
    locales,
    defaultLocale,
    // Don't prefix the default locale (English stays at /, French goes to /fr/...)
    localePrefix: 'as-needed',
});

export const config = {
    // Match all pathnames except API routes, static files, and Next.js internals
    matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
