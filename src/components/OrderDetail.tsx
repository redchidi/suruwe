'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
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

  useEffect(() => {
    loadAttachments();
  }, [order.id]);

  const loadAttachments = async () => {
    const { data } = await supabase
      .from('order_attachments')
      .select('*')
      .eq('order_id', order.id)
      .order('created_at', { ascending: true });
    if (data) setAttachments(data);
  };

  const handleCompletedPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const url = await uploadImage(file, `orders/${order.id}/completed`);
    if (url) {
      await supabase
        .from('orders')
        .update({ completed_photo_url: url, status: t('status.completed') })
        .eq('id', order.id);
      setCompletedPhoto(url);
      onOrderUpdate({ ...order, completed_photo_url: url, status: 'completed' });
    }
    setUploading(false);
  };

  const handleSaveNote = async () => {
    if (savingNote) return;
    setSavingNote(true);
    await supabase
      .from('orders')
      .update({ completed_note: completedNote })
      .eq('id', order.id);
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
      description: editDescription,
      fit_notes: editFitNotes,
      tailor_name: editTailorName,
      tailor_city: editTailorCity,
      tailor_phone: editTailorPhone || null,
    };

    const { data, error } = await supabase
      .from('orders')
      .update(updates)
      .eq('id', order.id)
      .select()
      .single();

    if (data && !error) {
      onOrderUpdate(data as Order);
      setEditing(false);
    }
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
        const { data } = await supabase
          .from('order_attachments')
          .insert({
            order_id: order.id,
            url,
            type: 'inspiration',
            visible_to_tailor: true,
          })
          .select()
          .single();
        if (data) {
          setAttachments((prev) => [...prev, data as OrderAttachment]);
        }
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

  return (
    <div>
      <button className="back-btn mb-16" onClick={onBack}>
        <ArrowLeftIcon size={18} />
        <span>{t('common.back')}</span>
      </button>

      {/* Edit mode */}
      {editing ? (
        <div>
          <h2 className="mb-24">{t('orderDetail.editTitle')}</h2>
          <div className="flex flex-col gap-16">
            <div className="input-group">
              <label>{t('orderDetail.tailorNameLabel')}</label>
              <input
                className="input"
                value={editTailorName}
                onChange={(e) => setEditTailorName(e.target.value)}
              />
            </div>
            <div className="input-group">
              <label>{t('orderDetail.whatsappLabel')}</label>
              <input
                className="input"
                type="tel"
                value={editTailorPhone}
                onChange={(e) => setEditTailorPhone(e.target.value)}
              />
            </div>
            <div className="input-group">
              <label>{t('orderDetail.cityLabel')}</label>
              <input
                className="input"
                value={editTailorCity}
                onChange={(e) => setEditTailorCity(e.target.value)}
              />
            </div>
            <div className="input-group">
              <label>{t('orderDetail.makingLabel')}</label>
              <input
                className="input"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
              />
            </div>
            <div className="input-group">
              <label>{t('orderDetail.fitNotesLabel')}</label>
              <textarea
                className="textarea"
                value={editFitNotes}
                onChange={(e) => setEditFitNotes(e.target.value)}
              />
            </div>

            {/* Reference images in edit mode */}
            <div className="input-group">
              <label>{t('orderDetail.referenceImagesLabel')}</label>
              {attachments.length > 0 && (
                <div className="attachment-grid" style={{ marginBottom: 12 }}>
                  {attachments.map((att) => (
                    <div key={att.id} className="attachment-item" style={{ position: 'relative' }}>
                      <img src={att.url} alt="Reference" loading="lazy" />
                      <button
                        onClick={() => handleDeleteAttachment(att.id)}
                        style={{
                          position: 'absolute',
                          top: 4,
                          right: 4,
                          width: 24,
                          height: 24,
                          borderRadius: '50%',
                          background: 'rgba(0,0,0,0.7)',
                          color: '#fff',
                          border: 'none',
                          fontSize: 14,
                          lineHeight: 1,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <input
                ref={editAttachmentRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleAddAttachment}
                style={{ display: 'none' }}
              />
              <button
                className="btn btn-ghost btn-full btn-sm"
                onClick={() => editAttachmentRef.current?.click()}
                disabled={uploadingAttachment}
                style={{ fontSize: 13 }}
              >
                {uploadingAttachment ? t('common.uploading') : t('orderDetail.addReferenceImages')}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-8 mt-24">
            <button
              className="btn btn-primary btn-full"
              onClick={handleSaveEdit}
              disabled={saving || !editDescription.trim() || !editTailorName.trim()}
            >
              {saving ? t('common.saving') : t('orderDetail.saveChanges')}
            </button>
            <button className="btn btn-ghost btn-full" onClick={handleCancelEdit}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div>
          {/* View mode */}
          <div className="flex items-center justify-between mb-8">
            <h2>{order.description}</h2>
            <span
              className={`order-status ${order.status}`}
              style={{ display: 'inline-block', fontSize: 12, padding: '3px 10px', borderRadius: 20 }}
            >
              {order.status === t('status.sent') ? 'Sent' : order.status === 'completed' ? 'Completed' : order.status}
            </span>
          </div>

          <p className="text-secondary mb-24" style={{ fontSize: 14 }}>
            {order.tailor_name}
            {order.tailor_city ? `, ${order.tailor_city}` : ''} ÃÂ· {formatDate(order.created_at)}
          </p>

          {order.fit_notes && (
            <div className="section">
              <div className="section-title">{t('orderDetail.fitNotesSectionTitle')}</div>
              <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>
                {order.fit_notes}
              </p>
            </div>
          )}

          {attachments.length > 0 && (
            <div className="section">
              <div className="section-title">{t('orderDetail.referenceImagesSectionTitle')}</div>
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

          {/* Action buttons */}
          {!isCompleted && (
            <div className="flex flex-col gap-8 mb-24">
              <button className="btn btn-secondary btn-full btn-sm" onClick={() => setEditing(true)}>
                <EditIcon size={16} />{t('orderDetail.editButton')}</button>
              <button className="btn btn-whatsapp btn-full btn-sm" onClick={handleResend}>
                <WhatsAppIcon size={16} />{t('orderDetail.resendButton', { name: order.tailor_name })}</button>
            </div>
          )}

          {/* Delete order */}
          {!showDeleteConfirm ? (
            <button
              className="btn btn-ghost btn-full btn-sm"
              onClick={() => setShowDeleteConfirm(true)}
              style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24 }}
            >
              Delete order
            </button>
          ) : (
            <div
              style={{
                padding: '16px 18px',
                borderRadius: 'var(--radius)',
                border: '1px solid #e74c3c',
                marginBottom: 24,
                textAlign: 'center',
              }}
            >
              <p style={{ fontSize: 14, marginBottom: 12, color: 'var(--text-secondary)' }}>
                Delete this order? This cannot be undone.
              </p>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                <button
                  className="btn btn-sm"
                  onClick={() => setShowDeleteConfirm(false)}
                  style={{ padding: '8px 20px', fontSize: 13 }}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-sm"
                  onClick={async () => {
                    setDeleting(true);
                    await onDelete();
                  }}
                  disabled={deleting}
                  style={{
                    padding: '8px 20px',
                    fontSize: 13,
                    background: '#e74c3c',
                    color: '#fff',
                    border: 'none',
                  }}
                >
                  {deleting ? t('common.deleting') : t('orderDetail.deleteConfirm')}
                </button>
              </div>
            </div>
          )}

          {/* Completed photo section */}
          <div className="section">
            <div className="section-title">{t('orderDetail.completedTitle')}</div>
            <p className="text-secondary" style={{ fontSize: 13, lineHeight: 1.5, marginBottom: 12 }}>
              Add a photo of the finished garment and a note on how the fit turned out. This builds your fit history over time.
            </p>
            {completedPhoto ? (
              <div>
                <div style={{ borderRadius: 'var(--radius)', overflow: 'hidden', marginBottom: 12 }}>
                  <img
                    src={completedPhoto}
                    alt="Completed piece"
                    style={{ width: '100%', display: 'block', cursor: 'pointer' }}
                    onClick={() => setLightboxUrl(completedPhoto)}
                  />
                </div>
                <textarea
                  className="textarea"
                  placeholder="How did the fit turn out? What worked, what needed adjusting..."
                  value={completedNote}
                  onChange={(e) => setCompletedNote(e.target.value)}
                  onBlur={handleSaveNote}
                  style={{ marginBottom: 12, fontSize: 14 }}
                  rows={3}
                />
                {completedNote && (
                  <button
                    className="btn btn-ghost btn-full btn-sm"
                    onClick={handleSaveNote}
                    disabled={savingNote}
                    style={{ marginBottom: 12, fontSize: 13 }}
                  >
                    {savingNote ? t('common.saving') : t('orderDetail.saveFitNote')}
                  </button>
                )}
                <button
                  className="btn btn-whatsapp btn-full btn-sm"
                  onClick={() => {
                    const message = generateCompletedOrderMessage(
                      order,
                      order.tailor_phone || null
                    );
                    openWhatsApp(message);
                  }}
                >
                  <WhatsAppIcon size={16} />
                  Share this on WhatsApp
                </button>
              </div>
            ) : (
              <>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  onChange={handleCompletedPhoto}
                  style={{ display: 'none' }}
                />
                <div className="photo-add" onClick={() => fileRef.current?.click()}>
                  <CameraIcon size={28} />
                  <span>
                    {uploading
                      ? t('common.uploading')
                      : 'Got your piece? Add a photo of the finished work.'}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      )}

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
            alt="Full size"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
