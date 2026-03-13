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

export default function ReturnScreen({ onSignedIn, onNewUser }: ReturnScreenProps) {
  const t = useTranslations();
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const pinInputRef = useRef<HTMLInputElement>(null);
  const hiddenPinRef = useRef<HTMLInputElement>(null);

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
      {/* Ghost S */}
      <div className="ghost-letter" style={{ top: -30, right: -18, fontSize: 200 }}>S</div>

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 2, padding: '48px 28px 0', flex: 1 }}>
        <span className="wordmark" style={{ marginBottom: 40, display: 'block', letterSpacing: '0.28em' }}>
          Suruwe
        </span>

        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 40,
            fontWeight: 200,
            fontStyle: 'italic',
            color: 'var(--cream)',
            lineHeight: 1.05,
            marginBottom: 8,
          }}
        >
          Welcome back.
        </h1>

        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 14,
            fontWeight: 300,
            color: 'var(--muted-d)',
            lineHeight: 1.6,
            marginBottom: 36,
          }}
        >
          Enter your username and PIN to pick up where you left off.
        </p>

        {/* Username */}
        <label className="field-label">Username</label>
        <input
          className="input-dark"
          type="text"
          placeholder="yourname"
          value={username}
          onChange={(e) => { setUsername(e.target.value); setError(''); }}
          autoFocus
          autoCapitalize="none"
          autoCorrect="off"
          style={{ marginBottom: 14 }}
        />

        {/* PIN */}
        <label className="field-label">PIN</label>
        {/* Hidden input for mobile keyboard */}
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
          onKeyDown={(e) => e.key === 'Enter' && handleSignIn()}
          style={{ position: 'absolute', opacity: 0, width: 1, height: 1, pointerEvents: 'none' }}
        />
        <div className="pin-row" onClick={handlePinCellTap} style={{ cursor: 'pointer' }}>
          {Array.from({ length: PIN_LENGTH }).map((_, i) => (
            <div key={i} className="pin-cell">
              {i < filledCells && <div className="pin-dot" />}
            </div>
          ))}
        </div>

        {error && (
          <p style={{
            color: 'var(--terra)',
            fontSize: 13,
            marginTop: 12,
            textAlign: 'center',
            lineHeight: 1.5,
          }}>
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
          <span>{loading ? 'Signing in...' : 'Sign in'}</span>
          <span>{'\u2192'}</span>
        </button>

        <button
          onClick={handleNewUser}
          className="btn-ghost"
          style={{
            display: 'block',
            width: '100%',
            textAlign: 'center',
            color: 'var(--muted-d)',
          }}
        >
          New to Suruwe? Start here
        </button>
      </div>
    </div>
  );
}
