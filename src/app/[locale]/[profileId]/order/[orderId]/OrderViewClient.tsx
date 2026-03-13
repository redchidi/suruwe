'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
  Profile, ProfilePhoto, Order, OrderAttachment,
  getMeasurementSections, getMeasurementFields, getKeyMeasurements,
} from '@/types';
import { supabase } from '@/lib/supabase';
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
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [showGuides, setShowGuides] = useState(false);

  useEffect(() => { loadData(); }, [params.profileId, params.orderId]);

  useEffect(() => {
    if (order?.id) {
      supabase.from('orders').update({ viewed_at: new Date().toISOString() }).eq('id', order.id).then(() => {});
    }
  }, [order?.id]);

  const loadData = async () => {
    const { data: profileData } = await supabase
      .from('profiles').select('*').eq('slug', params.profileId).single();
    if (!profileData) { setNotFound(true); setLoading(false); return; }
    const p = profileData as Profile;
    setProfile(p);

    const { data: orderData } = await supabase
      .from('orders').select('*').eq('id', params.orderId).eq('profile_id', p.id).single();
    if (!orderData) { setNotFound(true); setLoading(false); return; }
    setOrder(orderData as Order);

    const { data: photoData } = await supabase
      .from('profile_photos').select('*').eq('profile_id', p.id).order('sort_order', { ascending: true });
    if (photoData) setPhotos(photoData);

    const { data: attachmentData } = await supabase
      .from('order_attachments').select('*').eq('order_id', params.orderId)
      .eq('visible_to_tailor', true).order('created_at', { ascending: true });
    if (attachmentData) setAttachments(attachmentData);

    setLoading(false);
  };

  if (loading) {
    return <div className="loading"><div className="spinner" /></div>;
  }

  if (notFound || !profile || !order) {
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
    <div style={{ background: 'var(--cream)', minHeight: '100dvh' }}>
      <div className="app-shell" style={{ paddingBottom: 40 }}>

        {/* ── Editorial Header ── */}
        <div style={{ padding: '40px 24px 28px', textAlign: 'center' }}>
          <div style={{
            fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 600,
            letterSpacing: '0.22em', textTransform: 'uppercase' as const,
            color: 'var(--gold)', marginBottom: 10,
          }}>
            {t('tailorView.orderFrom')}
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
            <a href="https://suruwe.vercel.app" style={{ color: 'var(--gold)', textDecoration: 'none', fontWeight: 500 }}>
              Suruwe
            </a>
          </div>
        </div>

        {/* ── Order Details Card ── */}
        <div style={{ padding: '0 20px', marginBottom: 24 }}>
          <div style={{
            borderRadius: 12, border: '0.5px solid rgba(20,16,12,0.08)',
            background: 'white', overflow: 'hidden',
          }}>
            <div style={{ height: 3, background: 'var(--gold)' }} />
            <div style={{ padding: '20px 18px' }}>
              <div style={{ marginBottom: order.fit_notes ? 16 : 0 }}>
                <div style={{
                  fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 600,
                  letterSpacing: '0.18em', textTransform: 'uppercase' as const,
                  color: 'var(--ink-soft)', opacity: 0.5, marginBottom: 6,
                }}>
                  {t('tailorView.making')}
                </div>
                <div style={{
                  fontSize: 20, fontFamily: 'var(--font-display)', fontWeight: 300,
                  color: 'var(--ink)', lineHeight: 1.3,
                }}>
                  {order.description}
                </div>
              </div>

              {order.fit_notes && (
                <div style={{ paddingTop: 16, borderTop: '0.5px solid rgba(20,16,12,0.06)' }}>
                  <div style={{
                    fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 600,
                    letterSpacing: '0.18em', textTransform: 'uppercase' as const,
                    color: 'var(--ink-soft)', opacity: 0.5, marginBottom: 8,
                  }}>
                    {t('tailorView.fitNotes')}
                  </div>
                  <div style={{
                    fontFamily: 'var(--font-body)', fontSize: 15, lineHeight: 1.7,
                    color: 'var(--ink)', whiteSpace: 'pre-wrap', fontWeight: 300,
                  }}>
                    {order.fit_notes}
                  </div>
                </div>
              )}

              {order.deadline && (
                <div style={{ paddingTop: 16, borderTop: '0.5px solid rgba(20,16,12,0.06)' }}>
                  <div style={{
                    fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 600,
                    letterSpacing: '0.18em', textTransform: 'uppercase' as const,
                    color: 'var(--ink-soft)', opacity: 0.5, marginBottom: 6,
                  }}>
                    Need by
                  </div>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: 'var(--ink)', fontWeight: 400 }}>
                    {new Date(order.deadline + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Reference Images ── */}
        {attachments.length > 0 && (
          <SectionBlock title={t('tailorView.referenceImages')}>
            <div className="attachment-grid">
              {attachments.map((att) => (
                <div key={att.id} className="attachment-item" onClick={() => setLightboxUrl(att.url)} style={{ cursor: 'pointer' }}>
                  <img src={att.url} alt="Reference" loading="lazy" />
                </div>
              ))}
            </div>
          </SectionBlock>
        )}

        {/* ── Body Photos ── */}
        {(primaryPhoto || photos.length > 0) && (
          <SectionBlock title={t('tailorView.photos')}>
            {primaryPhoto && (
              <div className="tailor-photo" onClick={() => setLightboxUrl(primaryPhoto.url)} style={{ marginBottom: photos.length > 1 ? 8 : 0, cursor: 'pointer' }}>
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
          </SectionBlock>
        )}

        {/* ── Key Measurements ── */}
        {hasMeasurements && (
          <SectionBlock title={`${t('tailorView.keyMeasurements')} (${unitLabel})`}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {keyMeasurementKeys
                .filter((key) => profile.measurements[key] != null)
                .map((key) => {
                  const field = allFields.find((f) => f.key === key);
                  return (
                    <div key={key} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '10px 0',
                      borderBottom: '0.5px solid rgba(20,16,12,0.06)',
                    }}>
                      <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--ink-soft)', fontWeight: 300 }}>
                        {field ? t(`measurementLabels.${profile.gender}.${key}`) : key}
                      </span>
                      <span style={{ fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 600, color: 'var(--ink)' }}>
                        {profile.measurements[key]}
                        <span style={{ fontSize: 12, color: 'var(--ink-soft)', marginLeft: 2, fontWeight: 300 }}>{unitLabel}</span>
                      </span>
                    </div>
                  );
                })}
            </div>
          </SectionBlock>
        )}

        {/* ── Measurement Guides Toggle ── */}
        {hasMeasurements && (
          <div style={{ padding: '0 20px', marginBottom: 20 }}>
            <button
              onClick={() => setShowGuides(!showGuides)}
              style={{
                width: '100%', padding: '10px 14px', fontSize: 13,
                fontFamily: 'var(--font-body)', fontWeight: 500,
                color: 'var(--gold)', background: 'none',
                border: '0.5px solid var(--gold-bdr)', borderRadius: 8,
                cursor: 'pointer', letterSpacing: '0.04em',
              }}
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

        {/* ── All Measurements ── */}
        {hasMeasurements && (
          <div style={{ padding: '0 20px', marginBottom: 20 }}>
            <div style={{
              fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 600,
              letterSpacing: '0.18em', textTransform: 'uppercase' as const,
              color: 'var(--ink-soft)', opacity: 0.5, marginBottom: 16,
            }}>
              {t('tailorView.allMeasurements')} ({unitLabel})
            </div>

            {Object.entries(sections).map(([sectionKey, fields]) => {
              const filledFields = fields.filter((f) => profile.measurements[f.key] != null);
              if (filledFields.length === 0) return null;
              return (
                <div key={sectionKey} style={{ marginBottom: 20 }}>
                  <h3 style={{
                    fontFamily: 'var(--font-display)', fontStyle: 'italic',
                    fontSize: 16, fontWeight: 300, color: 'var(--ink)',
                    marginBottom: 10,
                  }}>
                    {t(`measurementSections.${sectionKey}`)}
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {filledFields.map((field) => (
                      <div key={field.key} style={{
                        padding: '10px 12px', borderRadius: 8,
                        border: '0.5px solid rgba(20,16,12,0.08)',
                        background: 'white',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      }}>
                        <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--ink-soft)', fontWeight: 300 }}>
                          {t(`measurementLabels.${profile.gender}.${field.key}`)}
                        </span>
                        <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>
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

        {/* ── Measurement Notes ── */}
        {profile.measurement_notes && profile.measurement_notes.trim() && (
          <SectionBlock title={t('tailorView.measurementNotes')}>
            <div style={{
              fontFamily: 'var(--font-body)', fontSize: 15, lineHeight: 1.65,
              color: 'var(--ink)', whiteSpace: 'pre-wrap', fontWeight: 300,
            }}>
              {profile.measurement_notes}
            </div>
          </SectionBlock>
        )}

        {/* ── Footer ── */}
        <div style={{
          textAlign: 'center', padding: '32px 24px 0',
          borderTop: '0.5px solid rgba(20,16,12,0.06)',
          marginTop: 20,
        }}>
          <div style={{
            fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 600,
            letterSpacing: '0.26em', textTransform: 'uppercase' as const,
            color: 'var(--gold)', marginBottom: 6,
          }}>
            <a href="https://suruwe.vercel.app" style={{ color: 'inherit', textDecoration: 'none' }}>Suruwe</a>
          </div>
          <p style={{ fontSize: 12, color: 'var(--ink-soft)', fontWeight: 300 }}>
            {t('tailorView.footerTagline')}{' '}
            <a href="https://suruwe.vercel.app" style={{ color: 'var(--gold)', textDecoration: 'none' }}>suruwe.vercel.app</a>
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

function SectionBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ padding: '0 20px', marginBottom: 24 }}>
      <div style={{
        fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 600,
        letterSpacing: '0.18em', textTransform: 'uppercase' as const,
        color: 'var(--ink-soft)', opacity: 0.5, marginBottom: 12,
      }}>
        {title}
      </div>
      {children}
    </div>
  );
}
