'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Profile, ProfilePhoto, Order, getMeasurementFields } from '@/types';
import { supabase } from '@/lib/supabase';
import { XIcon } from '@/components/Icons';

export default function CardClient({ params }: { params: { profileId: string } }) {
  const t = useTranslations();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [photos, setPhotos] = useState<ProfilePhoto[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => { loadProfile(); }, [params.profileId]);

  const loadProfile = async () => {
    const { data: profileData } = await supabase
      .from('profiles').select('*').eq('slug', params.profileId).single();
    if (!profileData) { setNotFound(true); setLoading(false); return; }
    const p = profileData as Profile;
    setProfile(p);

    const { data: photoData } = await supabase
      .from('profile_photos').select('*').eq('profile_id', p.id).order('sort_order', { ascending: true });
    if (photoData) setPhotos(photoData);

    const { data: orderData } = await supabase
      .from('orders').select('*').eq('profile_id', p.id)
      .eq('status', 'completed').not('completed_photo_url', 'is', null)
      .order('updated_at', { ascending: false }).limit(6);
    if (orderData) setOrders(orderData as Order[]);

    setLoading(false);
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: `${profile?.name} on Suruwe`, text: t('card.whatYouOrdered'), url }); } catch {}
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
    return <div className="loading"><div className="spinner" /></div>;
  }

  if (notFound || !profile) {
    return (
      <div style={{
        minHeight: '100dvh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', padding: '40px 24px',
        background: 'var(--cream)', textAlign: 'center',
      }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 300, color: 'var(--ink)', marginBottom: 8 }}>
          {t('tailorView.notFound')}
        </h1>
        <p style={{ fontSize: 14, color: 'var(--ink-soft)', marginBottom: 24 }}>
          {t('tailorView.notFoundDesc')}
        </p>
        <a href="/" style={{
          fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600,
          color: 'var(--charcoal)', background: 'var(--gold)',
          padding: '14px 24px', borderRadius: 6, textDecoration: 'none',
        }}>
          {t('card.footerCreate')} suruwe.com
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
    <div style={{ background: 'var(--cream)', minHeight: '100dvh' }}>
      <div className="app-shell" style={{ paddingBottom: 60 }}>

        {/* ── Editorial Header ── */}
        <div style={{ padding: '40px 24px 20px', textAlign: 'center' }}>
          <div style={{
            fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 600,
            letterSpacing: '0.22em', textTransform: 'uppercase' as const,
            color: 'var(--gold)', marginBottom: 10,
          }}>
            Profile card
          </div>
          <h1 style={{
            fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 300,
            color: 'var(--ink)', lineHeight: 1.1, marginBottom: 6,
          }}>
            {profile.name}
          </h1>
          <div style={{
            fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 300,
            color: 'var(--ink-soft)',
          }}>
            via{' '}
            <a href="https://suruwe.com" style={{ color: 'var(--gold)', textDecoration: 'none', fontWeight: 500 }}>
              Suruwe
            </a>
          </div>
        </div>

        {/* ── Identity Card ── */}
        <div style={{ padding: '0 20px', marginBottom: 24 }}>
          <div style={{
            borderRadius: 12, border: '0.5px solid rgba(20,16,12,0.08)',
            background: 'white', padding: '20px 18px',
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'var(--gold)' }} />

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
                <div style={{
                  fontSize: 20, fontFamily: 'var(--font-display)', fontWeight: 300,
                  color: 'var(--ink)', marginBottom: 4,
                }}>
                  {profile.name}
                </div>
                <div style={{ fontSize: 13, color: 'var(--ink-soft)', fontWeight: 300, marginBottom: 12, fontFamily: 'var(--font-body)' }}>
                  {t('card.whatYouOrdered')}
                </div>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  {measurementCount > 0 && (
                    <div style={{ fontSize: 13, color: 'var(--ink-soft)', fontFamily: 'var(--font-body)', fontWeight: 300 }}>
                      <span style={{ fontWeight: 600, color: 'var(--ink)', marginRight: 4 }}>{measurementCount}</span>
                      {t('card.measurements').toLowerCase()}
                    </div>
                  )}
                  {orders.length > 0 && (
                    <div style={{ fontSize: 13, color: 'var(--ink-soft)', fontFamily: 'var(--font-body)', fontWeight: 300 }}>
                      <span style={{ fontWeight: 600, color: 'var(--ink)', marginRight: 4 }}>{orders.length}</span>
                      {orders.length === 1 ? t('card.piece') : t('card.pieces')} {t('card.completed')}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── All Measurements ── */}
        {hasMeasurements && (
          <div style={{ padding: '0 20px', marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{
                fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 600,
                letterSpacing: '0.18em', textTransform: 'uppercase' as const,
                color: 'var(--ink-soft)', opacity: 0.5,
              }}>
                {t('measurements.sectionTitle')}
              </div>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--ink-soft)', fontWeight: 300 }}>{unitLabel}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {allFields
                .filter((f) => profile.measurements[f.key] != null)
                .map((f) => (
                  <div key={f.key} style={{
                    padding: '10px 12px', borderRadius: 8,
                    border: '0.5px solid rgba(20,16,12,0.08)',
                    background: 'white',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--ink-soft)', fontWeight: 300 }}>
                      {t(`measurementLabels.${profile.gender}.${f.key}`).replace(/^[A-Za-z]+\.\s/, '')}
                    </span>
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>
                      {profile.measurements[f.key]}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* ── Completed Pieces ── */}
        {orders.length > 0 && (
          <div style={{ padding: '0 20px', marginBottom: 24 }}>
            <div style={{
              fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 600,
              letterSpacing: '0.18em', textTransform: 'uppercase' as const,
              color: 'var(--ink-soft)', opacity: 0.5, marginBottom: 12,
            }}>
              {t('card.completedPieces')}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
              {orders.map((order) => (
                <div key={order.id} style={{
                  borderRadius: 8, overflow: 'hidden', aspectRatio: '3/4', cursor: 'pointer',
                }} onClick={() => setLightboxUrl(order.completed_photo_url!)}>
                  <img src={order.completed_photo_url!} alt={order.description} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ))}
            </div>
            {tailors.length > 0 && (
              <p style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 10, lineHeight: 1.5, fontWeight: 300 }}>
                {t('card.madeBy')} {tailors.join(', ')}
              </p>
            )}
          </div>
        )}

        {/* ── Share Actions ── */}
        <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
          <button onClick={handleWhatsApp} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            width: '100%', padding: '14px 20px',
            background: '#25D366', color: 'white',
            border: 'none', borderRadius: 8,
            fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600,
            cursor: 'pointer',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.125.553 4.12 1.522 5.857L0 24l6.335-1.652A11.95 11.95 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75c-1.875 0-3.63-.5-5.14-1.377l-.368-.22-3.813.999 1.016-3.713-.24-.382A9.71 9.71 0 012.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75z"/>
            </svg>
            {t('card.shareWhatsApp')}
          </button>
          <button onClick={handleShare} style={{
            width: '100%', padding: '14px 20px',
            background: 'white', color: 'var(--ink)',
            border: '0.5px solid rgba(20,16,12,0.1)', borderRadius: 8,
            fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 500,
            cursor: 'pointer',
          }}>
            {copied ? t('card.linkCopied') : t('card.copyLink')}
          </button>
        </div>

        {/* ── Footer ── */}
        <div style={{
          textAlign: 'center', padding: '32px 24px 0',
          borderTop: '0.5px solid rgba(20,16,12,0.06)',
          marginTop: 32,
        }}>
          <div style={{
            fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 600,
            letterSpacing: '0.26em', textTransform: 'uppercase' as const,
            color: 'var(--gold)', marginBottom: 6,
          }}>
            <a href="https://suruwe.com" style={{ color: 'inherit', textDecoration: 'none' }}>Suruwe</a>
          </div>
          <p style={{ fontSize: 12, color: 'var(--ink-soft)', fontWeight: 300 }}>
            {t('card.footerCreate')}{' '}
            <a href="https://suruwe.com" style={{ color: 'var(--gold)', textDecoration: 'none' }}>suruwe.com</a>
          </p>
        </div>
      </div>

      {/* Lightbox */}
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
