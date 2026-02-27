'use client';

import { useState, useRef, useEffect } from 'react';
import { Order, OrderAttachment } from '@/types';
import { supabase } from '@/lib/supabase';
import { uploadImage } from '@/lib/upload';
import { formatDate } from '@/lib/utils';
import { generateCompletedOrderMessage, openWhatsApp } from '@/lib/whatsapp';
import { ArrowLeftIcon, CameraIcon, WhatsAppIcon } from './Icons';

interface OrderDetailProps {
  order: Order;
  onBack: () => void;
  onOrderUpdate: (order: Order) => void;
}

export default function OrderDetail({ order, onBack, onOrderUpdate }: OrderDetailProps) {
  const [attachments, setAttachments] = useState<OrderAttachment[]>([]);
  const [completedPhoto, setCompletedPhoto] = useState(order.completed_photo_url);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

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

  return (
    <div>
      <button className="back-btn mb-16" onClick={onBack}>
        <ArrowLeftIcon size={18} />
        <span>Back</span>
      </button>

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
  );
}
