'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

interface PhonePromptProps {
  onSubmit: (phone: string) => void;
  onSkip: () => void;
}

export default function PhonePrompt({ onSubmit, onSkip }: PhonePromptProps) {
  const t = useTranslations();
  const [phone, setPhone] = useState('');

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onSkip()}>
      <div className="modal">
        <div style={{
          fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600,
          letterSpacing: '0.2em', textTransform: 'uppercase' as const,
          color: 'var(--gold)', marginBottom: 14, opacity: 0.8,
        }}>
          {t('phonePrompt.title')}
        </div>
        <p style={{
          fontSize: 14, fontWeight: 300, color: 'var(--muted-d)',
          lineHeight: 1.6, marginBottom: 24,
        }}>
          {t('phonePrompt.subtitle')}
        </p>
        <div style={{ marginBottom: 20 }}>
          <label className="field-label">{t('phonePrompt.title')}</label>
          <input
            className="input-dark"
            type="tel"
            placeholder={t('phonePrompt.placeholder')}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && phone.trim() && onSubmit(phone.trim())}
            autoFocus
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button
            className="btn-gold"
            onClick={() => phone.trim() && onSubmit(phone.trim())}
            disabled={!phone.trim()}
          >
            <span>{t('common.save')}</span>
            <span>&rarr;</span>
          </button>
          <button
            className="btn-ghost"
            onClick={onSkip}
            style={{ display: 'block', width: '100%', textAlign: 'center', color: 'var(--muted-d)', marginTop: 4 }}
          >
            {t('common.skip')}
          </button>
        </div>
      </div>
    </div>
  );
}
