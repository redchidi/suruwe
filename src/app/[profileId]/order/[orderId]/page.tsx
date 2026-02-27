'use client';

import { useState, useEffect } from 'react';
import { Profile, ProfilePhoto, Order, OrderAttachment, getMeasurementSections, getMeasurementFields, getKeyMeasurements } from '@/types';
import { supabase } from '@/lib/supabase';
import { applyTheme, Theme } from '@/lib/theme';
import ThemeToggle from '@/components/ThemeToggle';
import { XIcon } from '@/components/Icons';

export default function TailorOrderViewPage({
  params,
}: {
  params: { profileId: string; orderId: string };
}) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [photos, setPhotos] = useState<ProfilePhoto[]>([]);
  const [attachments, setAttachments] = useState<OrderAttachment[]>([]);
  const [theme, setTheme] = useState<Theme>('dark');
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [params.profileId, params.orderId]);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const loadData = async () => {
    // Load profile by slug
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

    // Load order
    const { data: orderData } = await supabase
      .from('orders')
      .select('*')
      .eq('id', params.orderId)
      .eq('profile_id', p.id)
      .single();

    if (!orderData) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    setOrder(orderData as Order);

    // Load profile photos
    const { data: photoData } = await supabase
      .from('profile_photos')
      .select('*')
      .eq('profile_id', p.id)
      .order('sort_order', { ascending: true });
    if (photoData) setPhotos(photoData);

    // Load order attachments (only tailor-visible ones)
    const { data: attachmentData } = await supabase
      .from('order_attachments')
      .select('*')
      .eq('order_id', params.orderId)
      .eq('visible_to_tailor', true)
      .order('created_at', { ascending: true });
    if (attachmentData) setAttachments(attachmentData);

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

  if (notFound || !profile || !order) {
    return (
      <div className="not-found">
        <h1>Order not found</h1>
        <p>This order does not exist or may have been removed.</p>
        <a href="/" className="btn btn-primary" style={{ marginTop: 24 }}>
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
          Order details on{' '}
          <a href="/" style={{ color: 'var(--accent)', textDecoration: 'none' }}>
            Suruwe
          </a>
        </div>
      </div>

      {/* Order details */}
      <div className="tailor-layout">
        <div className="tailor-section">
          <div className="card">
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
                Making
              </div>
              <div style={{ fontSize: 18, fontFamily: 'var(--font-display)', fontWeight: 500, color: 'var(--text)' }}>
                {order.description}
              </div>
            </div>
            {order.fit_notes && (
              <div style={{ paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
                  Fit notes
                </div>
                <div style={{ fontSize: 15, lineHeight: 1.6, color: 'var(--text)' }}>
                  {order.fit_notes}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Reference images */}
        {attachments.length > 0 && (
          <div className="tailor-section">
            <div className="tailor-section-title">Reference Images</div>
            <div className="attachment-grid">
              {attachments.map((att) => (
                <div
                  key={att.id}
                  className="attachment-item"
                  onClick={() => setLightboxUrl(att.url)}
                  style={{ cursor: 'pointer' }}
                >
                  <img src={att.url} alt="Reference" loading="lazy" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Photos */}
        {(primaryPhoto || photos.length > 0) && (
          <div className="tailor-section">
            <div className="tailor-section-title">Photos</div>
            {primaryPhoto && (
              <div
                className="tailor-photo"
                onClick={() => setLightboxUrl(primaryPhoto.url)}
                style={{ marginBottom: photos.length > 1 ? 8 : 0 }}
              >
                <img
                  src={primaryPhoto.url}
                  alt={`${profile.name}'s photo`}
                  loading="eager"
                />
              </div>
            )}
            {photos.length > 1 && (
              <div className={`photos-grid ${photos.length === 2 ? 'two' : ''}`}>
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
            )}
          </div>
        )}

        {/* Key Measurements */}
        {hasMeasurements && (
          <div className="tailor-section">
            <div className="label" style={{ marginBottom: 12 }}>
              Key Measurements ({unitLabel})
            </div>
            <div className="tailor-key-measurements">
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
      </div>

      {/* Footer */}
      <div className="tailor-footer">
        <div className="logo">Suruwe</div>
        <p>Create your own measurement profile at suruwe.com</p>
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
