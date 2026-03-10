'use client';
import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Profile, ProfilePhoto, Order, getMeasurementFields } from '@/types';
import { supabase } from '@/lib/supabase';
import { applyTheme, Theme } from '@/lib/theme';
import ThemeToggle from '@/components/ThemeToggle';
import { XIcon } from '@/components/Icons';

export default function CardClient({ params }: { params: { profileId: string } }) {
  const t = useTranslations();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [photos, setPhotos] = useState<ProfilePhoto[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [theme, setTheme] = useState<Theme>('dark');
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => { loadProfile(); }, [params.profileId]);
  useEffect(() => { applyTheme(theme); }, [theme]);

  const loadProfile = async () => {
    const { data: profileData } = await supabase.from('profiles').select('*').eq('slug', params.profileId).single();
    if (!profileData) { setNotFound(true); setLoading(false); return; }

    const p = profileData as Profile;
    setProfile(p);
    setTheme(p.theme as Theme);

    const { data: photoData } = await supabase.from('profile_photos').select('*').eq('profile_id', p.id).order('sort_order', { ascending: true });
    if (photoData) setPhotos(photoData);

    const { data: orderData } = await supabase.from('orders').select('*').eq('profile_id', p.id).eq('status', 'completed').not('completed_photo_url', 'is', null).order('updated_at', { ascending: false }).limit(6);
    if (orderData) setOrders(orderData as Order[]);

    setLoading(false);
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: `${profile?.name} on Suruwe`, text: t('card.whatYouOrdered'), url });
      } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleWhatsApp = () => {
    const url = window.location.href;
    const text = `${t('card.myMeasurements')} ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  if (loading) {
    return (<div className="loading"><div className="spinner" /></div>);
  }

  if (notFound || !profile) {
    return (
      <div className="not-found">
        <h1>{t('tailorView.notFound')}</h1>
        <p>{t('tailorView.notFoundDesc')}</p>
        <a href="/" className="btn btn-primary" style={{ marginTop: 24 }}>
          {t('card.footerCreate')} suruwe.vercel.app
        </a>
      </div>
    );
  }

  const hasMeasurements = profile.measurements && Object.keys(profile.measurements).length > 0;
  const allFields = getMeasurementFields(profile.gender);
  const unitLabel = profile.measurement_unit === 'inches' ? 'in' : 'cm';
  const primaryPhoto = photos.length > 0 ? photos[0] : null;
  const measurementCount = hasMeasurements
    ? Object.keys(profile.measurements).filter((k) => profile.measurements[k] != null).length
    : 0;
  const tailors = Array.from(new Set(orders.map((o) => o.tailor_name).filter(Boolean)));

  return (
    <div className="app-shell" style={{ paddingBottom: 60 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 24 }}>
        <ThemeToggle theme={theme} onToggle={() => setTheme(theme === 'dark' ? 'light' : 'dark')} />
      </div>

      {/* Card identity block */}
      <div style={{ borderRadius: 16, border: '1px solid var(--border)', background: 'var(--card-bg)', padding: '28px 24px', marginBottom: 24, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'var(--accent)' }} />
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
          {primaryPhoto && (
            <div
              style={{ width: 72, height: 72, borderRadius: 10, overflow: 'hidden', flexShrink: 0, cursor: 'pointer' }}
              onClick={() => setLightboxUrl(primaryPhoto.url)}
            >
              <img src={primaryPhoto.url} alt={profile.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          )}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 22, fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--text)', marginBottom: 2, letterSpacing: '-0.02em' }}>
              {profile.name}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
              {t('card.whatYouOrdered')}
            </div>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              {measurementCount > 0 && (
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text)', marginRight: 4 }}>{measurementCount}</span>
                  {t('card.measurements').toLowerCase()}
                </div>
              )}
              {orders.length > 0 && (
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text)', marginRight: 4 }}>{orders.length}</span>
                  {orders.length === 1 ? t('card.piece') : t('card.pieces')} {t('card.completed')}
                </div>
              )}
              {tailors.length > 0 && (
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text)', marginRight: 4 }}>{tailors.length}</span>
                  {tailors.length === 1 ? t('card.tailor') : t('card.tailors')}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* All measurements */}
      {hasMeasurements && (
        <div className="section">
          <div className="section-header">
            <div className="section-title">{t('measurements.sectionTitle')}</div>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{unitLabel}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {allFields
              .filter((f) => profile.measurements[f.key] != null)
              .map((f) => (
                <div
                  key={f.key}
                  style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--card-bg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                    {t(`measurementLabels.${profile.gender}.${f.key}`).replace(/^[A-Za-z]+\.\s/, '')}
                  </span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>
                    {profile.measurements[f.key]}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Completed pieces */}
      {orders.length > 0 && (
        <div className="section">
          <div className="section-title">{t('card.completedPieces')}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
            {orders.map((order) => (
              <div
                key={order.id}
                style={{ borderRadius: 8, overflow: 'hidden', aspectRatio: '3/4', cursor: 'pointer' }}
                onClick={() => setLightboxUrl(order.completed_photo_url!)}
              >
                <img src={order.completed_photo_url!} alt={order.description} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            ))}
          </div>
          {tailors.length > 0 && (
            <p className="text-secondary" style={{ fontSize: 13, marginTop: 10, lineHeight: 1.5 }}>
              {t('card.madeBy')} {tailors.join(', ')}
            </p>
          )}
        </div>
      )}

      {/* Share actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
        <button className="btn btn-whatsapp btn-full" onClick={handleWhatsApp} style={{ fontSize: 15 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
          {t('card.shareWhatsApp')}
        </button>
        <button className="btn btn-secondary btn-full" onClick={handleShare} style={{ fontSize: 15 }}>
          {copied ? t('card.linkCopied') : t('card.copyLink')}
        </button>
      </div>

      {/* Footer */}
      <div className="tailor-footer" style={{ marginTop: 40 }}>
        <div className="logo">
          <a href="https://suruwe.vercel.app" style={{ color: 'inherit', textDecoration: 'none' }}>Suruwe</a>
        </div>
        <p>
          {t('card.footerCreate')}{' '}
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
