'use client';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';

export default function LanguageToggle() {
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const toggleLocale = () => {
    const next = locale === 'en' ? 'fr' : 'en';
    if (typeof window !== 'undefined') {
      localStorage.setItem('suruwe_locale', next);
    }
    startTransition(() => {
      router.replace(`/${next}`);
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
