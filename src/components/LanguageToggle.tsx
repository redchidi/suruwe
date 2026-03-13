'use client';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';

interface LanguageToggleProps {
  variant?: 'pill' | 'legacy';
}

export default function LanguageToggle({ variant = 'legacy' }: LanguageToggleProps) {
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

  if (variant === 'pill') {
    return (
      <button
        className="lang-toggle"
        onClick={toggleLocale}
        disabled={isPending}
        title={locale === 'en' ? 'Passer en fran\u00e7ais' : 'Switch to English'}
      >
        {locale === 'en' ? 'FR' : 'EN'}
      </button>
    );
  }

  // Legacy variant for unrewritten screens
  return (
    <button
      className="theme-toggle"
      onClick={toggleLocale}
      disabled={isPending}
      title={locale === 'en' ? 'Passer en fran\u00e7ais' : 'Switch to English'}
      style={{ fontSize: 13, fontWeight: 600, letterSpacing: '0.02em', minWidth: 36 }}
    >
      {locale === 'en' ? 'FR' : 'EN'}
    </button>
  );
}
