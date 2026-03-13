'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { supabase } from '@/lib/supabase';
import { Profile, ProfilePhoto, Order } from '@/types';

interface ReturnScreenProps {
  onSignedIn: (profile: Profile, photos: ProfilePhoto[], orders: Order[]) => void;
  onNewUser: () => void;
}

const PROFILE_KEY = 'suruwe_profile_id';
const PIN_LENGTH = 4;

/* ═══════════════════════════════
   SVG TEXTILE PATTERNS
   Adire (Yoruba) + Shweshwe (South Africa)
   Layered geometric repeat
═══════════════════════════════ */
function TextilePattern() {
  return (
    <svg
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
        opacity: 1,
      }}
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="none"
    >
      <defs>
        <pattern id="shweshwe" x="0" y="0" width="48" height="48" patternUnits="userSpaceOnUse">
          <circle cx="24" cy="24" r="18" fill="none" stroke="rgba(184,146,74,0.04)" strokeWidth="0.5" />
          <circle cx="24" cy="24" r="12" fill="none" stroke="rgba(184,146,74,0.035)" strokeWidth="0.5" />
          <circle cx="24" cy="24" r="6" fill="none" stroke="rgba(184,146,74,0.03)" strokeWidth="0.5" />
          <circle cx="0" cy="0" r="6" fill="none" stroke="rgba(184,146,74,0.025)" strokeWidth="0.5" />
          <circle cx="48" cy="0" r="6" fill="none" stroke="rgba(184,146,74,0.025)" strokeWidth="0.5" />
          <circle cx="0" cy="48" r="6" fill="none" stroke="rgba(184,146,74,0.025)" strokeWidth="0.5" />
          <circle cx="48" cy="48" r="6" fill="none" stroke="rgba(184,146,74,0.025)" strokeWidth="0.5" />
        </pattern>
        <pattern id="adire" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
          <path d="M16 0 L32 16 L16 32 L0 16 Z" fill="none" stroke="rgba(184,146,74,0.03)" strokeWidth="0.5" />
          <line x1="0" y1="0" x2="32" y2="32" stroke="rgba(184,146,74,0.02)" strokeWidth="0.3" />
          <line x1="32" y1="0" x2="0" y2="32" stroke="rgba(184,146,74,0.02)" strokeWidth="0.3" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#shweshwe)" />
      <rect width="100%" height="100%" fill="url(#adire)" />
    </svg>
  );
}

export default function ReturnScreen({ onSignedIn, onNewUser }: ReturnScreenProps) {
  const t = useTranslations();
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<'username' | 'pin' | null>(null);
  const hiddenPinRef = useRef<HTMLInputElement>(null);
  const usernameRef = useRef<HTMLInputElement>(null);

  const handleSignIn = async () => {
    if (!username.trim() || pin.length < PIN_LENGTH || loading) return;
    setLoading(true);
    setError('');

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('slug', username.trim().toLowerCase())
      .eq('pin', pin)
      .single();

    if (data) {
      const p = data as Profile;
      localStorage.setItem(PROFILE_KEY, p.id);

      const { data: photoData } = await supabase
        .from('profile_photos')
        .select('*')
        .eq('profile_id', p.id)
        .order('sort_order', { ascending: true });

      const { data: orderData } = await supabase
        .from('orders')
        .select('*')
        .eq('profile_id', p.id)
        .order('created_at', { ascending: false });

      onSignedIn(p, photoData || [], orderData || []);
    } else {
      setError(t('recovery.error'));
    }
    setLoading(false);
  };

  const handlePinCellTap = () => {
    hiddenPinRef.current?.focus();
  };

  const handleNewUser = () => {
    localStorage.removeItem('ONBOARDING_SEEN');
    onNewUser();
  };

  const filledCells = pin.length;

  return (
    <div
      className="onboarding-shell"
      style={{
        background: 'var(--charcoal)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <TextilePattern />
      <div className="ghost-letter" style={{ top: -30, right: -18, fontSize: 200 }}>S</div>

      <div style={{ position: 'relative', zIndex: 2, padding: '48px 28px 0', flex: 1 }}>
        <span className="wordmark" style={{ marginBottom: 48, display: 'block', letterSpacing: '0.28em' }}>
          Suruwe
        </span>

        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 40,
          fontWeight: 200,
          color: 'var(--cream)',
          lineHeight: 1.05,
          marginBottom: 10,
        }}>
          {t('returnScreen.headline')}
        </h1>
        <p style={{
          fontFamily: 'var(--font-body)',
          fontSize: 16,
          fontWeight: 300,
          color: 'var(--gold-pale)',
          lineHeight: 1.5,
          marginBottom: 40,
        }}>
          {t('returnScreen.subtitle')}
        </p>

        {/* Username field */}
        <div style={{ marginBottom: 28 }}>
          <label style={{
            fontFamily: 'var(--font-body)',
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '0.2em',
            textTransform: 'uppercase' as const,
            color: 'var(--gold)',
            opacity: focusedField === 'username' ? 1 : 0.5,
            display: 'block',
            marginBottom: 0,
            transition: 'opacity 300ms',
          }}>
            {t('returnScreen.usernameLabel')}
          </label>
          <input
            ref={usernameRef}
            type="text"
            placeholder="yourname"
            value={username}
            onChange={(e) => { setUsername(e.target.value); setError(''); }}
            onFocus={() => setFocusedField('username')}
            onBlur={() => setFocusedField(null)}
            autoFocus
            autoCapitalize="none"
            autoCorrect="off"
            style={{
              width: '100%',
              padding: '14px 0 12px',
              background: 'transparent',
              border: 'none',
              borderBottom: `1px solid ${focusedField === 'username' ? 'var(--gold)' : 'rgba(184,146,74,0.2)'}`,
              fontFamily: 'var(--font-body)',
              fontSize: 18,
              fontWeight: 300,
              color: 'var(--cream)',
              outline: 'none',
              letterSpacing: '0.02em',
              transition: 'border-color 300ms',
            }}
          />
        </div>

        {/* PIN field */}
        <div style={{ marginBottom: 20 }}>
          <label style={{
            fontFamily: 'var(--font-body)',
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '0.2em',
            textTransform: 'uppercase' as const,
            color: 'var(--gold)',
            opacity: focusedField === 'pin' ? 1 : 0.5,
            display: 'block',
            marginBottom: 10,
            transition: 'opacity 300ms',
          }}>
            {t('returnScreen.pinLabel')}
          </label>
          <input
            ref={hiddenPinRef}
            type="number"
            inputMode="numeric"
            value={pin}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, '').slice(0, 6);
              setPin(val);
              setError('');
            }}
            onFocus={() => setFocusedField('pin')}
            onBlur={() => setFocusedField(null)}
            onKeyDown={(e) => e.key === 'Enter' && handleSignIn()}
            style={{ position: 'absolute', opacity: 0, width: 1, height: 1, pointerEvents: 'none' }}
          />
          <div onClick={handlePinCellTap} style={{ display: 'flex', gap: 12, cursor: 'pointer' }}>
            {Array.from({ length: PIN_LENGTH }).map((_, i) => {
              const isFilled = i < filledCells;
              const isNext = i === filledCells;
              return (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    height: 52,
                    background: isFilled ? 'rgba(184,146,74,0.08)' : 'transparent',
                    border: 'none',
                    borderBottom: `1px solid ${
                      isFilled
                        ? 'var(--gold)'
                        : isNext && focusedField === 'pin'
                        ? 'rgba(184,146,74,0.5)'
                        : 'rgba(184,146,74,0.15)'
                    }`,
                    borderRadius: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 300ms',
                  }}
                >
                  {isFilled && (
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--gold)' }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {error && (
          <p style={{ color: 'var(--terra)', fontSize: 13, marginTop: 12, textAlign: 'center', lineHeight: 1.5 }}>
            {error}
          </p>
        )}
      </div>

      {/* Bottom buttons */}
      <div style={{ position: 'relative', zIndex: 2, padding: '24px 28px 44px' }}>
        <button
          className="btn-gold"
          onClick={handleSignIn}
          disabled={!username.trim() || pin.length < PIN_LENGTH || loading}
          style={{ marginBottom: 14 }}
        >
          <span>{loading ? t('common.signingIn') : t('returnScreen.signIn')}</span>
          <span>{'\u2192'}</span>
        </button>
        <button
          onClick={handleNewUser}
          className="btn-ghost"
          style={{ display: 'block', width: '100%', textAlign: 'center', color: 'var(--muted-d)' }}
        >
          {t('returnScreen.newUser')}
        </button>
      </div>
    </div>
  );
}
