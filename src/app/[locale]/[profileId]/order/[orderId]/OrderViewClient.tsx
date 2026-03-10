'use client';
import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Profile, ProfilePhoto, Order, OrderAttachment, getMeasurementSections, getMeasurementFields, getKeyMeasurements } from '@/types';
import { supabase } from '@/lib/supabase';
import { applyTheme, Theme } from '@/lib/theme';
import ThemeToggle from '@/components/ThemeToggle';
import { XIcon } from '@/components/Icons';
import { MeasurementGuides } from '@/components/MeasurementGuides';

export default function OrderViewClient({
  params,
}: {
  params: { profileId: string; orderId: string };
}) {
  const t = useTranslations();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [photos, setPhotos] = useState<ProfilePhoto[]>([]);
  const [attachments, setAttachments] = useState<OrderAttachment[]>([]);
  const [theme, setTheme] = useState<Theme>('dark');
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [showGuides, setShowGuides] = useState(false);

  useEffect(() => { loadData(); }, [params.profileId, params.orderId]);
  useEffect(() => { applyTheme(theme); }, [theme]);

  useEffect(() => {
    if (order?.id) {
      supabase.from('orders').update({ viewed_at: new Date().toISOString() }).eq('id', order.id).then(() => {});
    }
  }, [order?.id]);

  const loadData = async () => {
    const { data: profileData } = await supabase.from('profiles').select('*').eq('slug', params.profileId).single();
    if (!profileData) { setNotFound(true); setLoading(false); return; }

    const p = profileData as Profile;
    setProfile(p);
    setTheme(p.theme as Theme);

    const { data: orderData } = await supabase.from('orders').select('*').eq('id', params.orderId).eq('profile_id', p.id).single();
    if (!orderData) { setNotFound(true); setLoading(false); return; }
    setOrder(orderData as Order);

    const { data: photoData } = await supabase.from('profile_photos').select('*').eq('profile_id', p.id).order('sort_order', { ascending: true });
    if (photoData) setPhotos(photoData);

    const { data: attachmentData } = await supabase.from('order_attachments').select('*').eq('order_id', params.orderId).eq('visible_to_tailor', true).order('created_at', { ascending: true });
    if (attachmentData) setAttachments(attachmentData);

    setLoading(false);
  };

  const toggleTheme = () => {
    const newTheme: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
  };

  if (loading) {
    return (<div className="loading"><div className="spinner" /></div>);
  }

  if (notFound || !profile || !order) {
    return (
      <div className="not-found">
        <h1>{t('tailorView.notFound')}</h1>
        <p>{t('tailorView.notFoundDesc')}</p>
        <a href="/" className="btn btn-primary" style={{ marginTop: 24 }}>
          {t('tailorView.footerCreate')} suruwe.vercel.app
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
        <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--accent)', marginBottom: 6, fontWeight: 600 }}>
          {t('tailorView.orderFrom')}
        </div>
        <div className="name">{profile.name}</div>
        <div className="branding">
          via{' '}
          <a href="/" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}>
            Suruwe
          </a>
        </div>
      </div>

      {/* Order details */}
      <div className="tailor-layout">
        <div className="tailor-section">
          <div style={{ borderRadius: 12, border: '1px solid var(--border)', background: 'var(--card-bg)', overflow: 'hidden' }}>
            <div style={{ height: 3, background: 'var(--accent)' }} />
            <div style={{ padding: '20px 18px' }}>
              <div style={{ marginBottom: order.fit_notes ? 16 : 0 }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6, fontWeight: 600 }}>
                  {t('tailorView.making')}
                </div>
                <div style={{ fontSize: 20, fontFamily: 'var(--font-display)', fontWeight: 500, color: 'var(--text)', lineHeight: 1.3, letterSpacing: '-0.01em' }}>
                  {order.description}
                </div>
              </div>
              {order.fit_notes && (
                <div style={{ paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, fontWeight: 600 }}>
                    {t('tailorView.fitNotes')}
                  </div>
                  <div style={{ fontSize: 15, lineHeight: 1.7, color: 'var(--text)', whiteSpace: 'pre-wrap' }}>
                    {order.fit_notes}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {attachments.length > 0 && (
          <div className="tailor-section">
            <div className="tailor-section-title">{t('tailorView.referenceImages')}</div>
            <div className="attachment-grid">
              {attachments.map((att) => (
                <div key={att.id} className="attachment-item" onClick={() => setLightboxUrl(att.url)} style={{ cursor: 'pointer' }}>
                  <img src={att.url} alt="Reference" loading="lazy" />
                </div>
              ))}
            </div>
          </div>
        )}

        {(primaryPhoto || photos.length > 0) && (
          <div className="tailor-section">
            <div className="tailor-section-title">{t('tailorView.photos')}</div>
            {primaryPhoto && (
              <div className="tailor-photo" onClick={() => setLightboxUrl(primaryPhoto.url)} style={{ marginBottom: photos.length > 1 ? 8 : 0 }}>
                <img src={primaryPhoto.url} alt={`${profile.name}'s photo`} loading="eager" />
              </div>
            )}
            {photos.length > 1 && (
              <div className={`photos-grid ${photos.length === 2 ? 'two' : ''}`}>
                {photos.slice(1).map((photo) => (
                  <div key={photo.id} className="photo-item" onClick={() => setLightboxUrl(photo.url)}>
                    <img src={photo.url} alt={`${profile.name}'s photo`} loading="lazy" />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {hasMeasurements && (
          <div className="tailor-section">
            <div className="label" style={{ marginBottom: 12 }}>
              {t('tailorView.keyMeasurements')} ({unitLabel})
            </div>
            <div className="tailor-key-measurements">
              {keyMeasurementKeys
                .filter((key) => profile.measurements[key] != null)
                .map((key) => {
                  const field = allFields.find((f) => f.key === key);
                  return (
                    <div key={key} className="tailor-measurement-row">
                      <span className="name">{field ? t(`measurementLabels.${profile.gender}.${key}`) : key}</span>
                      <span className="value">
                        {profile.measurements[key]}
                        <span style={{ fontSize: 13, color: 'var(--text-muted)', marginLeft: 2 }}>{unitLabel}</span>
                      </span>
                    </div>
                  );
                })}
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
      </div>

      {/* Footer */}
      <div className="tailor-footer">
        <div className="logo">
          <a href="https://suruwe.vercel.app" style={{ color: 'inherit', textDecoration: 'none' }}>Suruwe</a>
        </div>
        <p>
          {t('tailorView.footerTagline')}{' '}
          <a href="https://suruwe.vercel.app" style={{ color: 'var(--accent)', textDecoration: 'none' }}>suruwe.vercel.app</a>
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
