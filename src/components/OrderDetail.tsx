'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Order, OrderAttachment, Profile } from '@/types';
import { supabase } from '@/lib/supabase';
import { uploadImage } from '@/lib/upload';
import { formatDate } from '@/lib/utils';
import { generateCompletedOrderMessage, generateOrderMessage, openWhatsApp } from '@/lib/whatsapp';
import { ArrowLeftIcon, CameraIcon, WhatsAppIcon, EditIcon, XIcon } from './Icons';

interface OrderDetailProps {
  order: Order;
  profile: Profile;
  onBack: () => void;
  onOrderUpdate: (order: Order) => void;
  onDelete: () => void;
}

export default function OrderDetail({ order, profile, onBack, onOrderUpdate, onDelete }: OrderDetailProps) {
  const t = useTranslations();
  const locale = useLocale();

  const [attachments, setAttachments] = useState<OrderAttachment[]>([]);
  const [completedPhoto, setCompletedPhoto] = useState(order.completed_photo_url);
  const [completedNote, setCompletedNote] = useState(order.completed_note || '');
  const [savingNote, setSavingNote] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Edit mode
  const [editing, setEditing] = useState(false);
  const [editDescription, setEditDescription] = useState(order.description);
  const [editFitNotes, setEditFitNotes] = useState(order.fit_notes);
  const [editTailorName, setEditTailorName] = useState(order.tailor_name);
  const [editTailorCity, setEditTailorCity] = useState(order.tailor_city);
  const [editTailorPhone, setEditTailorPhone] = useState(order.tailor_phone || '');
  const [saving, setSaving] = useState(false);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const editAttachmentRef = useRef<HTMLInputElement>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { loadAttachments(); }, [order.id]);

  const loadAttachments = async () => {
    const { data } = await supabase
      .from('order_attachments').select('*').eq('order_id', order.id)
      .order('created_at', { ascending: true });
    if (data) setAttachments(data);
  };

  const handleCompletedPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const url = await uploadImage(file, `orders/${order.id}/completed`);
    if (url) {
      await supabase.from('orders').update({ completed_photo_url: url, status: t('status.completed') }).eq('id', order.id);
      setCompletedPhoto(url);
      onOrderUpdate({ ...order, completed_photo_url: url, status: 'completed' });
    }
    setUploading(false);
  };

  const handleSaveNote = async () => {
    if (savingNote) return;
    setSavingNote(true);
    await supabase.from('orders').update({ completed_note: completedNote }).eq('id', order.id);
    onOrderUpdate({ ...order, completed_note: completedNote });
    setSavingNote(false);
  };

  const handleResend = () => {
    const message = generateOrderMessage(profile, order);
    const phone = order.tailor_phone ? order.tailor_phone.replace(/[\s\-\(\)]/g, '') : undefined;
    openWhatsApp(message, phone);
  };

  const handleSaveEdit = async () => {
    setSaving(true);
    const updates = {
      description: editDescription, fit_notes: editFitNotes,
      tailor_name: editTailorName, tailor_city: editTailorCity,
      tailor_phone: editTailorPhone || null,
    };
    const { data, error } = await supabase.from('orders').update(updates).eq('id', order.id).select().single();
    if (data && !error) { onOrderUpdate(data as Order); setEditing(false); }
    setSaving(false);
  };

  const handleCancelEdit = () => {
    setEditDescription(order.description);
    setEditFitNotes(order.fit_notes);
    setEditTailorName(order.tailor_name);
    setEditTailorCity(order.tailor_city);
    setEditTailorPhone(order.tailor_phone || '');
    setEditing(false);
  };

  const handleAddAttachment = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadingAttachment(true);
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const url = await uploadImage(file, `orders/${order.id}/attachments`);
      if (url) {
        const { data } = await supabase.from('order_attachments').insert({
          order_id: order.id, url, type: 'inspiration', visible_to_tailor: true,
        }).select().single();
        if (data) setAttachments((prev) => [...prev, data as OrderAttachment]);
      }
    }
    setUploadingAttachment(false);
    if (editAttachmentRef.current) editAttachmentRef.current.value = '';
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    await supabase.from('order_attachments').delete().eq('id', attachmentId);
    setAttachments((prev) => prev.filter((a) => a.id !== attachmentId));
  };

  const isCompleted = order.status === 'completed';

  const statusColor = order.status === 'sent' ? 'var(--gold)' : order.status === 'completed' ? 'var(--forest)' : 'var(--ink-soft)';
  const statusBg = order.status === 'sent' ? 'var(--gold-dim)' : order.status === 'completed' ? 'var(--forest-bg)' : 'var(--cream-2)';
  const statusLabel = order.status === 'sent' ? 'Sent' : order.status === 'completed' ? 'Completed' : order.status;

  // ── EDIT MODE ──
  if (editing) {
    return (
      <div style={{ background: 'var(--cream)', minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ background: 'var(--charcoal)', padding: '44px 24px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <button
              onClick={handleCancelEdit}
              style={{
                width: 32, height: 32, borderRadius: '50%',
                background: 'rgba(255,255,255,0.06)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: 'none', cursor: 'pointer', color: 'var(--muted-d)', fontSize: 14,
              }}
            >&larr;</button>
            <span style={{
              fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 600,
              letterSpacing: '0.22em', textTransform: 'uppercase' as const, color: 'var(--gold)',
            }}>
              {t('orderDetail.editTitle')}
            </span>
          </div>
          <h2 style={{
            fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 300,
            color: 'var(--cream)', lineHeight: 1.1,
          }}>
            Edit <span style={{ color: 'var(--gold-pale)' }}>order.</span>
          </h2>
        </div>

        <div style={{ padding: '20px 22px', flex: 1 }}>
          <div style={{ marginBottom: 18 }}>
            <label className="field-label-cream">{t('orderDetail.makingLabel')}</label>
            <input className="input-cream" value={editDescription} onChange={(e) => setEditDescription(e.target.value)} />
          </div>
          <div style={{ marginBottom: 18 }}>
            <label className="field-label-cream">{t('orderDetail.tailorNameLabel')}</label>
            <input className="input-cream" value={editTailorName} onChange={(e) => setEditTailorName(e.target.value)} />
          </div>
          <div style={{ marginBottom: 18 }}>
            <label className="field-label-cream">{t('orderDetail.whatsappLabel')}</label>
            <input className="input-cream" type="tel" value={editTailorPhone} onChange={(e) => setEditTailorPhone(e.target.value)} />
          </div>
          <div style={{ marginBottom: 18 }}>
            <label className="field-label-cream">{t('orderDetail.cityLabel')}</label>
            <input className="input-cream" value={editTailorCity} onChange={(e) => setEditTailorCity(e.target.value)} />
          </div>
          <div style={{ marginBottom: 18 }}>
            <label className="field-label-cream">{t('orderDetail.fitNotesLabel')}</label>
            <textarea
              className="textarea-cream"
              value={editFitNotes}
              onChange={(e) => setEditFitNotes(e.target.value)}
              rows={4}
              style={{ whiteSpace: 'pre-wrap', minHeight: 100 }}
            />
          </div>

          {/* Reference images in edit mode */}
          <div style={{ marginBottom: 18 }}>
            <label className="field-label-cream">{t('orderDetail.referenceImagesLabel')}</label>
            {attachments.length > 0 && (
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 8, marginBottom: 12,
              }}>
                {attachments.map((att) => (
                  <div key={att.id} style={{ position: 'relative', borderRadius: 8, overflow: 'hidden' }}>
                    <img src={att.url} alt="Reference" loading="lazy" style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block' }} />
                    <button
                      onClick={() => handleDeleteAttachment(att.id)}
                      style={{
                        position: 'absolute', top: 4, right: 4,
                        width: 22, height: 22, borderRadius: '50%',
                        background: 'var(--charcoal)', color: 'var(--cream)',
                        border: 'none', fontSize: 12, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >&times;</button>
                  </div>
                ))}
              </div>
            )}
            <input ref={editAttachmentRef} type="file" accept="image/*" multiple onChange={handleAddAttachment} style={{ display: 'none' }} />
            <button
              onClick={() => editAttachmentRef.current?.click()}
              disabled={uploadingAttachment}
              style={{
                width: '100%', padding: '12px 16px',
                background: 'transparent', border: '0.5px dashed rgba(20,16,12,0.2)',
                borderRadius: 8, fontFamily: 'var(--font-body)', fontSize: 13,
                color: 'var(--ink-soft)', cursor: 'pointer', textAlign: 'center',
              }}
            >
              {uploadingAttachment ? t('common.uploading') : t('orderDetail.addReferenceImages')}
            </button>
          </div>
        </div>

        <div style={{ padding: '16px 22px 36px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            className="btn-charcoal"
            onClick={handleSaveEdit}
            disabled={saving || !editDescription.trim() || !editTailorName.trim()}
          >
            <span>{saving ? t('common.saving') : t('orderDetail.saveChanges')}</span>
            <span>&rarr;</span>
          </button>
          <button
            onClick={handleCancelEdit}
            style={{
              fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 500,
              color: 'var(--ink-soft)', background: 'none', border: 'none',
              cursor: 'pointer', textAlign: 'center', padding: '8px 0',
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // ── VIEW MODE ──
  return (
    <div style={{ background: 'var(--cream)', minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      {/* Charcoal header */}
      <div style={{ background: 'var(--charcoal)', padding: '44px 24px 20px', position: 'relative', overflow: 'hidden' }}>
        <div className="ghost-letter" style={{ top: -24, right: -12, fontSize: 110 }}>S</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, position: 'relative', zIndex: 2 }}>
          <button
            onClick={onBack}
            style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'rgba(255,255,255,0.06)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: 'none', cursor: 'pointer', color: 'var(--muted-d)', fontSize: 14,
            }}
          >&larr;</button>
          <span style={{
            fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 600,
            letterSpacing: '0.22em', textTransform: 'uppercase' as const, color: 'var(--gold)',
          }}>
            {t('dashboard.ordersSection')}
          </span>
        </div>
        <div style={{ position: 'relative', zIndex: 2 }}>
          <h2 style={{
            fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 300,
            color: 'var(--cream)', lineHeight: 1.1, marginBottom: 6,
          }}>
            {order.description}
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
            <span style={{
              fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 300,
              color: 'var(--muted-d)',
            }}>
              {order.tailor_name}{order.tailor_city ? ` \u00B7 ${order.tailor_city}` : ''}
            </span>
            <span style={{
              display: 'inline-block', padding: '3px 10px', borderRadius: 20,
              fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 600,
              letterSpacing: '0.04em',
              background: statusBg, color: statusColor,
            }}>
              {statusLabel}
            </span>
          </div>
        </div>
      </div>

      {/* Cream body */}
      <div style={{ padding: '20px 22px', flex: 1 }}>
        {/* Order details card */}
        <div style={{
          background: 'white', border: '0.5px solid rgba(20,16,12,0.08)',
          borderRadius: 12, padding: '14px 16px', marginBottom: 20,
        }}>
          <DetailRow label={t('orderDetail.tailorNameLabel')} value={`${order.tailor_name}${order.tailor_city ? `, ${order.tailor_city}` : ''}`} />
          {order.deadline && <DetailRow label={locale === 'fr' ? 'Date limite' : 'Need by'} value={formatDate(order.deadline)} />}
          <DetailRow label={locale === 'fr' ? 'Envoy\u00e9' : 'Sent'} value={formatDate(order.created_at)} last />
        </div>

        {/* Fit notes */}
        {order.fit_notes && (
          <div style={{ marginBottom: 20 }}>
            <span className="field-label-cream" style={{ marginBottom: 8, display: 'block' }}>
              {t('orderDetail.fitNotesSectionTitle')}
            </span>
            <div style={{
              background: 'white', border: '0.5px solid rgba(20,16,12,0.08)',
              borderRadius: 12, padding: '14px 16px',
            }}>
              <p style={{
                fontFamily: 'var(--font-body)', fontSize: 14, lineHeight: 1.6,
                color: 'var(--ink-soft)', whiteSpace: 'pre-wrap', margin: 0,
              }}>
                {order.fit_notes}
              </p>
            </div>
          </div>
        )}

        {/* Reference images */}
        {attachments.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <span className="field-label-cream" style={{ marginBottom: 8, display: 'block' }}>
              {t('orderDetail.referenceImagesSectionTitle')}
            </span>
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 8,
            }}>
              {attachments.map((att) => (
                <div
                  key={att.id}
                  onClick={() => setLightboxUrl(att.url)}
                  style={{
                    borderRadius: 8, overflow: 'hidden', cursor: 'pointer',
                    border: '0.5px solid rgba(20,16,12,0.06)',
                  }}
                >
                  <img src={att.url} alt="Reference" loading="lazy" style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block' }} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action buttons */}
        {!isCompleted && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
            <button
              className="btn-charcoal"
              onClick={() => setEditing(true)}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <EditIcon size={14} /> {t('orderDetail.editButton')}
              </span>
              <span>&rarr;</span>
            </button>
            <button
              onClick={handleResend}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                width: '100%', padding: '16px 22px',
                background: '#25d366', color: 'white',
                border: 'none', borderRadius: 8,
                fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <WhatsAppIcon size={16} /> {t('orderDetail.resendButton', { name: order.tailor_name })}
            </button>
          </div>
        )}

        {/* Delete order */}
        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            style={{
              width: '100%', textAlign: 'center', padding: '10px 0',
              fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 400,
              color: 'var(--ink-soft)', opacity: 0.5,
              background: 'none', border: 'none', cursor: 'pointer',
              marginBottom: 24,
            }}
          >
            Delete order
          </button>
        ) : (
          <div style={{
            background: 'white', border: '0.5px solid rgba(196,81,42,0.2)',
            borderRadius: 12, padding: 16, marginBottom: 24, textAlign: 'center',
          }}>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, marginBottom: 12, color: 'var(--ink-soft)' }}>
              Delete this order? This cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                style={{
                  padding: '8px 20px', fontSize: 13, fontFamily: 'var(--font-body)',
                  background: 'var(--cream-2)', border: 'none', borderRadius: 6,
                  color: 'var(--ink)', cursor: 'pointer',
                }}
              >Cancel</button>
              <button
                onClick={async () => { setDeleting(true); await onDelete(); }}
                disabled={deleting}
                style={{
                  padding: '8px 20px', fontSize: 13, fontFamily: 'var(--font-body)',
                  background: 'var(--terra)', border: 'none', borderRadius: 6,
                  color: 'white', cursor: 'pointer',
                }}
              >{deleting ? t('common.deleting') : t('orderDetail.deleteConfirm')}</button>
            </div>
          </div>
        )}

        {/* Completed photo section */}
        <div style={{ marginBottom: 24 }}>
          <span className="field-label-cream" style={{ marginBottom: 8, display: 'block' }}>
            {t('orderDetail.completedTitle')}
          </span>
          <p style={{
            fontFamily: 'var(--font-body)', fontSize: 13, lineHeight: 1.55,
            color: 'var(--ink-soft)', marginBottom: 12,
          }}>
            Add a photo of the finished garment and a note on how the fit turned out. This builds your fit history over time.
          </p>

          {completedPhoto ? (
            <div>
              <div style={{ borderRadius: 12, overflow: 'hidden', marginBottom: 12, border: '0.5px solid rgba(20,16,12,0.06)' }}>
                <img
                  src={completedPhoto} alt="Completed piece"
                  style={{ width: '100%', display: 'block', cursor: 'pointer' }}
                  onClick={() => setLightboxUrl(completedPhoto)}
                />
              </div>
              <textarea
                className="textarea-cream"
                placeholder="How did the fit turn out? What worked, what needed adjusting..."
                value={completedNote}
                onChange={(e) => setCompletedNote(e.target.value)}
                onBlur={handleSaveNote}
                style={{ marginBottom: 12, minHeight: 80 }}
                rows={3}
              />
              {completedNote && (
                <button
                  onClick={handleSaveNote}
                  disabled={savingNote}
                  style={{
                    width: '100%', textAlign: 'center', padding: '10px 0', marginBottom: 12,
                    fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 500,
                    color: 'var(--gold)', background: 'none', border: 'none', cursor: 'pointer',
                  }}
                >
                  {savingNote ? t('common.saving') : t('orderDetail.saveFitNote')}
                </button>
              )}
              <button
                onClick={() => {
                  const message = generateCompletedOrderMessage(order, order.tailor_phone || null, locale);
                  openWhatsApp(message);
                }}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  width: '100%', padding: '14px 22px',
                  background: '#25d366', color: 'white',
                  border: 'none', borderRadius: 8,
                  fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <WhatsAppIcon size={16} /> Share this on WhatsApp
              </button>
            </div>
          ) : (
            <>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleCompletedPhoto} style={{ display: 'none' }} />
              <div
                onClick={() => fileRef.current?.click()}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '20px 16px',
                  background: 'white', border: '0.5px dashed rgba(20,16,12,0.15)',
                  borderRadius: 12, cursor: 'pointer',
                }}
              >
                <CameraIcon size={24} />
                <span style={{
                  fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 300,
                  color: 'var(--ink-soft)', lineHeight: 1.5,
                }}>
                  {uploading ? t('common.uploading') : 'Got your piece? Add a photo of the finished work.'}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {lightboxUrl && (
        <div
          onClick={() => setLightboxUrl(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 100,
            background: 'rgba(0,0,0,0.9)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 20,
          }}
        >
          <button
            onClick={() => setLightboxUrl(null)}
            style={{
              position: 'absolute', top: 20, right: 20,
              width: 40, height: 40, borderRadius: '50%',
              background: 'rgba(255,255,255,0.1)', border: 'none',
              color: 'white', fontSize: 20, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <XIcon size={20} />
          </button>
          <img
            src={lightboxUrl} alt="Full size"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '100%', maxHeight: '90vh', borderRadius: 8 }}
          />
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, value, valueColor, last }: { label: string; value: string; valueColor?: string; last?: boolean }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
      padding: '8px 0',
      borderBottom: last ? 'none' : '0.5px solid rgba(20,16,12,0.06)',
    }}>
      <span style={{
        fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 400,
        color: 'var(--ink-soft)',
      }}>{label}</span>
      <span style={{
        fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 500,
        color: valueColor || 'var(--ink)', textAlign: 'right', maxWidth: '55%', lineHeight: 1.4,
      }}>{value}</span>
    </div>
  );
}
