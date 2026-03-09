'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { useTransition } from 'react';

export default function LanguageToggle() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const toggleLocale = () => {
    const next = locale === 'en' ? 'fr' : 'en';
    const pathWithoutLocale = pathname.startsWith('/fr')
      ? pathname.slice(3) || '/'
      : pathname;
    const newPath = next === 'fr' ? `/fr${pathWithoutLocale}` : pathWithoutLocale;
    if (typeof window !== 'undefined') {
      localStorage.setItem('suruwe_locale', next);
    }
    startTransition(() => {
      router.replace(newPath);
    });
  };

  return (
    <button
      className="theme-toggle"
      onClick={toggleLocale}
      disabled={isPending}
      title={locale === 'en' ? 'Passer en français' : 'Switch to English'}
      style={{ fontSize: 13, fontWeight: 600, letterSpacing: '0.02em', minWidth: 36 }}
    >
      {locale === 'en' ? 'FR' : 'EN'}
    </button>
  );
}
