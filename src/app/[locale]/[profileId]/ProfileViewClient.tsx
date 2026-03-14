'use client';
import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';
import { Profile, ProfilePhoto, getMeasurementSections, getMeasurementFields, getKeyMeasurements } from '@/types';
import { supabase } from '@/lib/supabase';
import { applyTheme, Theme } from '@/lib/theme';
import ThemeToggle from '@/components/ThemeToggle';
import { XIcon } from '@/components/Icons';
import { MeasurementGuides } from '@/components/MeasurementGuides';

export default function ProfileViewClient({ params }: { params: { profileId: string } }) {
  const t = useTranslations();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [photos, setPhotos] = useState<ProfilePhoto[]>([]);
  const [theme, setTheme] = useState<Theme>('dark');
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [showGuides, setShowGuides] = useState(false);
  const [showPinEntry, setShowPinEntry] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => { loadProfile(); }, [params.profileId]);
  useEffect(() => { applyTheme(theme); }, [theme]);

  const loadProfile = async () => {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('slug', params.profileId)
      .single();

    if (!profileData) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    const p = profileData as Profile;
    setProfile(p);
    setTheme(p.theme as Theme);

    const { data: photoData } = await supabase
      .from('profile_photos')
      .select('*')
      .eq('profile_id', p.id)
      .order('sort_order', { ascending: true });

    if (photoData) setPhotos(photoData);
    setLoading(false);

    const storedId = localStorage.getItem('suruwe_profile_id');
    if (storedId === p.id) {
      setIsOwner(true);
    }
  };

  const toggleTheme = () => {
    const newTheme: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
  };

  const handlePinVerify = async () => {
    if (!profile || pinInput.length < 4) return;
    setVerifying(true);
    setPinError('');

    const { data } = await supabase
      .from('profiles')
      .select('id')
      .eq('slug', params.profileId)
      .eq('pin', pinInput)
      .single();

    if (data) {
      localStorage.setItem('suruwe_profile_id', data.id);
      setIsOwner(true);
      setShowPinEntry(false);
      setPinInput('');
    } else {
      setPinError(t('tailorView.pinError'));
    }
    setVerifying(false);
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner" />
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="not-found">
        <h1>{t('tailorView.notFound')}</h1>
        <p>{t('tailorView.notFoundDesc')}</p>
        <a href="/" className="btn btn-primary" style={{ marginTop: 24 }}>
          {t('tailorView.footerCreate')} suruwe.com
        </a>
      </div>
    );
  }

  const hasMeasurements = profile.measurements && Object.keys(profile.measurements).length > 0;
  const keyMeasurementKeys = getKeyMeasurements(profile.gender);
  const allFields = getMeasurementFields(profile.gender);
  const sections = getMeasurementSections(profile.gender);
  const unitLabel = profile.measurement_unit === 'inches' ? 'in' : 'cm';
  const primaryPhoto = photos.length > 0 ? photos[0] : null;

  return (
    <div className="app-shell" style={{ paddingBottom: 40 }}>
      {/* Header */}
      <div className="tailor-header">
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
          <ThemeToggle theme={theme} onToggle={toggleTheme} />
        </div>
        <div className="name">{profile.name}</div>
        <div className="branding">
          Measurement profile on{' '}
          <a href="/" style={{ color: 'var(--accent)', textDecoration: 'none' }}>
            Suruwe
          </a>
        </div>
      </div>

      {/* "This is me" bar */}
      {!isOwner && !showPinEntry && (
        <div
          onClick={() => setShowPinEntry(true)}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '14px 20px', marginBottom: 24, borderRadius: 10,
            background: 'var(--accent)', color: '#fff', cursor: 'pointer',
            fontSize: 15, fontWeight: 500,
            fontFamily: 'var(--font-display, inherit)', letterSpacing: '-0.01em',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          {t('tailorView.thisIsMe')}
        </div>
      )}

      {/* PIN entry */}
      {showPinEntry && !isOwner && (
        <div style={{ padding: '20px', marginBottom: 24, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--card-bg)' }}>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 16 }}>
            {t('tailorView.pinPrompt')}
          </p>
          <input
            type="number"
            inputMode="numeric"
            placeholder={t('tailorView.pinLabel')}
            value={pinInput}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, '').slice(0, 6);
              setPinInput(val);
              setPinError('');
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && pinInput.length >= 4) { handlePinVerify(); }
            }}
            autoFocus
            style={{ width: '100%', fontSize: 16, padding: '12px 14px', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontFamily: 'inherit', marginBottom: pinError ? 8 : 16 }}
          />
          {pinError && (<p style={{ color: '#e74c3c', fontSize: 13, marginBottom: 12 }}>{pinError}</p>)}
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => { setShowPinEntry(false); setPinInput(''); setPinError(''); }}
              style={{ flex: 1, padding: '12px', fontSize: 14, background: 'none', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={handlePinVerify}
              disabled={pinInput.length < 4 || verifying}
              style={{ flex: 1, padding: '12px', fontSize: 14, background: 'var(--accent)', border: 'none', borderRadius: 8, color: '#fff', cursor: 'pointer', fontFamily: 'inherit', opacity: pinInput.length < 4 ? 0.5 : 1 }}
            >
              {verifying ? t('common.checking') : t('tailorView.verify')}
            </button>
          </div>
        </div>
      )}

      {/* Owner banner */}
      {isOwner && (
        <a
          href="/"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '14px 20px', marginBottom: 24, borderRadius: 10, border: '1px solid var(--accent)', color: 'var(--accent)', textDecoration: 'none', fontSize: 15, fontWeight: 500, fontFamily: 'var(--font-display, inherit)' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          {t('tailorView.goToProfile')}
        </a>
      )}

      {/* Top section: Photo + Key Measurements */}
      <div className="tailor-layout">
        {(primaryPhoto || hasMeasurements) && (
          <div className="tailor-top">
            {primaryPhoto && (
              <div className="tailor-photo" onClick={() => setLightboxUrl(primaryPhoto.url)}>
                <img src={primaryPhoto.url} alt={`${profile.name}'s photo`} loading="eager" />
              </div>
            )}
            {hasMeasurements && (
              <div className="tailor-key-measurements">
                <div className="label" style={{ marginBottom: 8 }}>
                  {t('tailorView.keyMeasurements')} ({unitLabel})
                </div>
                {keyMeasurementKeys
                  .filter((key) => profile.measurements[key] != null)
                  .map((key) => {
                    const field = allFields.find((f) => f.key === key);
                    return (
                      <div key={key} className="tailor-measurement-row">
                        <span className="name">
                          {field ? t(`measurementLabels.${profile.gender}.${key}`) : key}
                        </span>
                        <span className="value">
                          {profile.measurements[key]}
                          <span style={{ fontSize: 13, color: 'var(--text-muted)', marginLeft: 2 }}>{unitLabel}</span>
                        </span>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}

        {photos.length > 1 && (
          <div className="tailor-section">
            <div className="tailor-section-title">{t('tailorView.photos')}</div>
            <div className={`photos-grid ${photos.length === 2 ? 'two' : ''}`}>
              {photos.slice(1).map((photo) => (
                <div key={photo.id} className="photo-item" onClick={() => setLightboxUrl(photo.url)}>
                  <img src={photo.url} alt={`${profile.name}'s photo`} loading="lazy" />
                </div>
              ))}
            </div>
          </div>
        )}

        {hasMeasurements && (
          <div className="tailor-section">
            <button
              onClick={() => setShowGuides(!showGuides)}
              style={{ width: '100%', padding: '10px 14px', fontSize: 14, color: 'var(--accent)', background: 'none', border: '1px solid var(--accent)', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', opacity: 0.85 }}
            >
              {showGuides ? t('tailorView.hideGuides') : t('tailorView.showGuides')}
            </button>
            {showGuides && (
              <div style={{ marginTop: 16 }}>
                <MeasurementGuides gender={profile.gender} />
              </div>
            )}
          </div>
        )}

        {hasMeasurements && (
          <div>
            <div className="label" style={{ marginBottom: 16 }}>
              {t('tailorView.allMeasurements')} ({unitLabel})
            </div>
            {Object.entries(sections).map(([sectionKey, fields]) => {
              const filledFields = fields.filter((f) => profile.measurements[f.key] != null);
              if (filledFields.length === 0) return null;
              return (
                <div key={sectionKey} className="tailor-section">
                  <div className="tailor-section-title">{t(`measurementSections.${sectionKey}`)}</div>
                  <div className="tailor-measurements-grid">
                    {filledFields.map((field) => (
                      <div key={field.key} className="tailor-measurement-cell">
                        <span className="name">{t(`measurementLabels.${profile.gender}.${field.key}`)}</span>
                        <span className="value">{profile.measurements[field.key]}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {profile.measurement_notes && profile.measurement_notes.trim() && (
          <div className="tailor-section">
            <div className="tailor-section-title">{t('tailorView.measurementNotes')}</div>
            <div style={{ fontSize: 15, lineHeight: 1.6, color: 'var(--text)', whiteSpace: 'pre-wrap' }}>
              {profile.measurement_notes}
            </div>
          </div>
        )}

        {profile.style_notes && (
          <div className="tailor-section">
            <div className="tailor-section-title">{t('tailorView.styleNotes')}</div>
            <div className="style-notes-card">
              <p>{profile.style_notes}</p>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="tailor-footer">
        <div className="logo">
          <a href="https://suruwe.com" style={{ color: 'inherit', textDecoration: 'none' }}>Suruwe</a>
        </div>
        <p>
          {t('tailorView.footerCreate')}{' '}
          <a href="https://suruwe.com" style={{ color: 'var(--accent)', textDecoration: 'none' }}>suruwe.com</a>
        </p>
      </div>

      {lightboxUrl && (
        <div className="photo-lightbox" onClick={() => setLightboxUrl(null)}>
          <button className="photo-lightbox-close" onClick={() => setLightboxUrl(null)}>
            <XIcon size={20} />
          </button>
          <img src={lightboxUrl} alt={t('tailorView.fullSizePhoto')} onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}
