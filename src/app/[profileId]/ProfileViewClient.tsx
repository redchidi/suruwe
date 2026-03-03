'use client';

import { useState, useEffect } from 'react';
import { Profile, ProfilePhoto, getMeasurementSections, getMeasurementFields, getKeyMeasurements } from '@/types';
import { supabase } from '@/lib/supabase';
import { applyTheme, Theme } from '@/lib/theme';
import ThemeToggle from '@/components/ThemeToggle';
import { XIcon } from '@/components/Icons';
import { MeasurementGuides } from '@/components/MeasurementGuides';

export default function ProfileViewClient({ params }: { params: { profileId: string } }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [photos, setPhotos] = useState<ProfilePhoto[]>([]);
  const [theme, setTheme] = useState<Theme>('dark');
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [showGuides, setShowGuides] = useState(false);

  useEffect(() => {
    loadProfile();
  }, [params.profileId]);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

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

    // Load photos
    const { data: photoData } = await supabase
      .from('profile_photos')
      .select('*')
      .eq('profile_id', p.id)
      .order('sort_order', { ascending: true });
    if (photoData) setPhotos(photoData);

    setLoading(false);
  };

  const toggleTheme = () => {
    const newTheme: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
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
        <h1>Profile not found</h1>
        <p>This measurement profile does not exist or may have moved.</p>
        <a
          href="/"
          className="btn btn-primary"
          style={{ marginTop: 24 }}
        >
          Create your own profile
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

      {/* Top section: Photo + Key Measurements */}
      <div className="tailor-layout">
        {(primaryPhoto || hasMeasurements) && (
          <div className="tailor-top">
            {/* Photo */}
            {primaryPhoto && (
              <div className="tailor-photo" onClick={() => setLightboxUrl(primaryPhoto.url)}>
                <img
                  src={primaryPhoto.url}
                  alt={`${profile.name}'s photo`}
                  loading="eager"
                />
              </div>
            )}

            {/* Key measurements */}
            {hasMeasurements && (
              <div className="tailor-key-measurements">
                <div className="label" style={{ marginBottom: 8 }}>
                  Key Measurements ({unitLabel})
                </div>
                {keyMeasurementKeys
                  .filter((key) => profile.measurements[key] != null)
                  .map((key) => {
                    const field = allFields.find((f) => f.key === key);
                    return (
                      <div key={key} className="tailor-measurement-row">
                        <span className="name">{field?.label || key}</span>
                        <span className="value">
                          {profile.measurements[key]}
                          <span style={{ fontSize: 13, color: 'var(--text-muted)', marginLeft: 2 }}>
                            {unitLabel}
                          </span>
                        </span>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}

        {/* Additional photos */}
        {photos.length > 1 && (
          <div className="tailor-section">
            <div className="tailor-section-title">Photos</div>
            <div
              className={`photos-grid ${photos.length === 2 ? 'two' : ''}`}
            >
              {photos.slice(1).map((photo) => (
                <div
                  key={photo.id}
                  className="photo-item"
                  onClick={() => setLightboxUrl(photo.url)}
                >
                  <img
                    src={photo.url}
                    alt={`${profile.name}'s photo`}
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Measurement Guides toggle */}
        {hasMeasurements && (
          <div className="tailor-section">
            <button
              onClick={() => setShowGuides(!showGuides)}
              style={{
                width: '100%',
                padding: '10px 14px',
                fontSize: 14,
                color: 'var(--accent)',
                background: 'none',
                border: '1px solid var(--accent)',
                borderRadius: 8,
                cursor: 'pointer',
                fontFamily: 'inherit',
                opacity: 0.85,
              }}
            >
              {showGuides ? 'Hide measurement guides' : 'Show measurement guides'}
            </button>
            {showGuides && (
              <div style={{ marginTop: 16 }}>
                <MeasurementGuides gender={profile.gender} />
              </div>
            )}
          </div>
        )}

        {/* Full Measurements */}
        {hasMeasurements && (
          <div>
            <div className="label" style={{ marginBottom: 16 }}>
              All Measurements ({unitLabel})
            </div>
            {Object.entries(sections).map(([sectionName, fields]) => {
              const filledFields = fields.filter(
                (f) => profile.measurements[f.key] != null
              );
              if (filledFields.length === 0) return null;
              return (
                <div key={sectionName} className="tailor-section">
                  <div className="tailor-section-title">{sectionName}</div>
                  <div className="tailor-measurements-grid">
                    {filledFields.map((field) => (
                      <div key={field.key} className="tailor-measurement-cell">
                        <span className="name">{field.label}</span>
                        <span className="value">
                          {profile.measurements[field.key]}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Measurement Notes */}
        {profile.measurement_notes && profile.measurement_notes.trim() && (
          <div className="tailor-section">
            <div className="tailor-section-title">Measurement Notes</div>
            <div style={{ fontSize: 15, lineHeight: 1.6, color: 'var(--text)', whiteSpace: 'pre-wrap' }}>
              {profile.measurement_notes}
            </div>
          </div>
        )}

        {/* Style Notes */}
        {profile.style_notes && (
          <div className="tailor-section">
            <div className="tailor-section-title">Style Notes</div>
            <div className="style-notes-card">
              <p>{profile.style_notes}</p>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="tailor-footer">
        <div className="logo">
          <a href="https://suruwe.vercel.app" style={{ color: 'inherit', textDecoration: 'none' }}>Suruwe</a>
        </div>
        <p>
          Create your own measurement profile at{' '}
          <a href="https://suruwe.vercel.app" style={{ color: 'var(--accent)', textDecoration: 'none' }}>suruwe.vercel.app</a>
        </p>
      </div>

      {/* Lightbox */}
      {lightboxUrl && (
        <div className="photo-lightbox" onClick={() => setLightboxUrl(null)}>
          <button
            className="photo-lightbox-close"
            onClick={() => setLightboxUrl(null)}
          >
            <XIcon size={20} />
          </button>
          <img
            src={lightboxUrl}
            alt="Full size photo"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
