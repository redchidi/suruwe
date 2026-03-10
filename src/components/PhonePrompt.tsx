'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';

interface PhonePromptProps { onSubmit: (phone: string) => void; onSkip: () => void; }

export default function PhonePrompt({ onSubmit, onSkip }: PhonePromptProps) {
  const t = useTranslations();
  const [phone, setPhone] = useState('');
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onSkip()}>
      <div className="modal">
        <h3>{t('phonePrompt.title')}</h3>
        <p>{t('phonePrompt.subtitle')}</p>
        <div className="input-group">
          <input type="tel" className="input" placeholder={t('phonePrompt.placeholder')}
            value={phone} onChange={(e) => setPhone(e.target.value)} autoFocus />
        </div>
        <div className="modal-actions">
          <button className="btn btn-primary btn-full"
            onClick={() => phone.trim() && onSubmit(phone.trim())}
            disabled={!phone.trim()}>
            {t('common.save')}
          </button>
          <button className="btn btn-ghost btn-full" onClick={onSkip}>
            {t('common.skip')}
          </button>
        </div>
      </div>
    </div>
  );
}
