'use client';

import { useState, useRef, useEffect } from 'react';
import { Order, OrderAttachment, Profile } from '@/types';
import { supabase } from '@/lib/supabase';
import { uploadImage } from '@/lib/upload';
import { formatDate } from '@/lib/utils';
import { generateCompletedOrderMessage, generateOrderMessage, openWhatsApp } from '@/lib/whatsapp';
import { ArrowLeftIcon, CameraIcon, WhatsAppIcon, EditIcon } from './Icons';

interface OrderDetailProps {
  order: Order;
  profile: Profile;
  onBack: () => void;
  onOrderUpdate: (order: Order) => void;
}

export default function OrderDetail({ order, profile, onBack, onOrderUpdate }: OrderDetailProps) {
  const [attachments, setAttachments] = useState<OrderAttachment[]>([]);
  const [completedPhoto, setCompletedPhoto] = useState(order.completed_photo_url);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Edit mode
  const [editing, setEditing] = useState(false);
  const [editDescription, setEditDescription] = useState(order.description);
  const [editFitNotes, setEditFitNotes] = useState(order.fit_notes);
  const [editTailorName, setEditTailorName] = useState(order.tailor_name);
  const [editTailorCity, setEditTailorCity] = useState(order.tailor_city);
  const [editTailorPhone, setEditTailorPhone] = useState(order.tailor_phone || '');
  const [saving, setSaving] = useState(false);

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
        .update({ completed_photo_url: url, status: 'completed' })
        .eq('id', order.id);
      setCompletedPhoto(url);
      onOrderUpdate({ ...order, completed_photo_url: url, status: 'completed' });
    }
    setUploading(false);
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

  const isCompleted = order.status === 'completed';

  return (
    <div>
      <button className="back-btn mb-16" onClick={onBack}>
        <ArrowLeftIcon size={18} />
        <span>Back</span>
      </button>

      {/* Edit mode */}
      {editing ? (
        <div>
          <h2 className="mb-24">Edit order</h2>
          <div className="flex flex-col gap-16">
            <div className="input-group">
              <label>Tailor name</label>
              <input
                className="input"
                value={editTailorName}
                onChange={(e) => setEditTailorName(e.target.value)}
              />
            </div>
            <div className="input-group">
              <label>WhatsApp number</label>
              <input
                className="input"
                type="tel"
                value={editTailorPhone}
                onChange={(e) => setEditTailorPhone(e.target.value)}
              />
            </div>
            <div className="input-group">
              <label>City</label>
              <input
                className="input"
                value={editTailorCity}
                onChange={(e) => setEditTailorCity(e.target.value)}
              />
            </div>
            <div className="input-group">
              <label>What are you making?</label>
              <input
                className="input"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
              />
            </div>
            <div className="input-group">
              <label>Fit notes</label>
              <textarea
                className="textarea"
                value={editFitNotes}
                onChange={(e) => setEditFitNotes(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-8 mt-24">
            <button
              className="btn btn-primary btn-full"
              onClick={handleSaveEdit}
              disabled={saving || !editDescription.trim() || !editTailorName.trim()}
            >
              {saving ? 'Saving...' : 'Save changes'}
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
              {order.status === 'sent' ? 'Sent' : order.status === 'completed' ? 'Completed' : order.status}
            </span>
          </div>

          <p className="text-secondary mb-24" style={{ fontSize: 14 }}>
            {order.tailor_name}
            {order.tailor_city ? `, ${order.tailor_city}` : ''} · {formatDate(order.created_at)}
          </p>

          {order.fit_notes && (
            <div className="section">
              <div className="section-title">Fit Notes</div>
              <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--text-secondary)' }}>
                {order.fit_notes}
              </p>
            </div>
          )}

          {attachments.length > 0 && (
            <div className="section">
              <div className="section-title">Reference Images</div>
              <div className="attachment-grid">
                {attachments.map((att) => (
                  <div key={att.id} className="attachment-item">
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
                <EditIcon size={16} />
                Edit order
              </button>
              <button className="btn btn-whatsapp btn-full btn-sm" onClick={handleResend}>
                <WhatsAppIcon size={16} />
                Resend to {order.tailor_name}
              </button>
            </div>
          )}

          {/* Completed photo section */}
          <div className="section">
            <div className="section-title">Completed Piece</div>
            {completedPhoto ? (
              <div>
                <div style={{ borderRadius: 'var(--radius)', overflow: 'hidden', marginBottom: 12 }}>
                  <img
                    src={completedPhoto}
                    alt="Completed piece"
                    style={{ width: '100%', display: 'block' }}
                  />
                </div>
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
                      ? 'Uploading...'
                      : 'Got your piece? Add a photo of the finished work.'}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
