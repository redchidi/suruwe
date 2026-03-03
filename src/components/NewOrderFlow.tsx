'use client';

import { useState, useRef, useEffect } from 'react';
import { Profile, Order, OrderAttachment, getMeasurementFields } from '@/types';
import { supabase } from '@/lib/supabase';
import { uploadImage } from '@/lib/upload';
import { generateOrderMessage, generateOrderShareMessage, openWhatsApp } from '@/lib/whatsapp';
import { formatRelativeDate } from '@/lib/utils';
import MeasurementsEditor from './MeasurementsEditor';
import {
  ArrowLeftIcon,
  WhatsAppIcon,
  EyeIcon,
  EyeOffIcon,
  XIcon,
  PlusIcon,
  ImageIcon,
} from './Icons';

interface NewOrderFlowProps {
  profile: Profile | null;
  hasPhotos: boolean;
  onClose: () => void;
  onOrderCreated: (order: Order) => void;
  onProfileUpdate: (profile: Profile) => void;
  ensureProfile: (callback: (p: Profile) => void) => void;
}

interface AttachmentLocal {
  file?: File;
  url: string;
  visible: boolean;
  preview: string;
}

interface TailorHistory {
  name: string;
  phone: string | null;
  city: string;
}

export default function NewOrderFlow({
  profile,
  hasPhotos,
  onClose,
  onOrderCreated,
  onProfileUpdate,
  ensureProfile,
}: NewOrderFlowProps) {
  const [step, setStep] = useState(1);
  const [tailorName, setTailorName] = useState('');
  const [tailorPhone, setTailorPhone] = useState('');
  const [tailorCity, setTailorCity] = useState('');
  const [description, setDescription] = useState('');
  const [fitNotes, setFitNotes] = useState('');
  const [attachments, setAttachments] = useState<AttachmentLocal[]>([]);
  const [saving, setSaving] = useState(false);
  const [measurementsSaving, setMeasurementsSaving] = useState(false);
  const [sent, setSent] = useState(false);
  const [sentOrder, setSentOrder] = useState<Order | null>(null);
  const [showSharePreview, setShowSharePreview] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Tailor history
  const [tailorHistory, setTailorHistory] = useState<TailorHistory[]>([]);
  const [showTailorSuggestions, setShowTailorSuggestions] = useState(false);

  // Local measurements state for step 3
  const [localMeasurements, setLocalMeasurements] = useState(profile?.measurements || {});
  const [localGender, setLocalGender] = useState(profile?.gender || 'male');
  const [localUnit, setLocalUnit] = useState(profile?.measurement_unit || 'inches');

  const totalSteps = 4;
  const hasMeasurements = profile ? Object.keys(profile.measurements).length > 0 : false;

  // Check if measurements are stale (older than 30 days)
  const measurementsStale = profile?.measurements_updated_at
    ? (Date.now() - new Date(profile?.measurements_updated_at).getTime()) > 30 * 24 * 60 * 60 * 1000
    : false;

  // Load tailor history on mount
  useEffect(() => {
    if (profile) loadTailorHistory();
  }, [profile]);

  const loadTailorHistory = async () => {
    const { data } = await supabase
      .from('orders')
      .select('tailor_name, tailor_phone, tailor_city')
      .eq('profile_id', profile!.id)
      .order('created_at', { ascending: false });

    if (data) {
      const seen = new Set<string>();
      const unique: TailorHistory[] = [];
      for (const row of data) {
        const key = row.tailor_name.toLowerCase().trim();
        if (!seen.has(key)) {
          seen.add(key);
          unique.push({
            name: row.tailor_name,
            phone: row.tailor_phone || null,
            city: row.tailor_city || '',
          });
        }
      }
      setTailorHistory(unique);
    }
  };

  const selectTailor = (tailor: TailorHistory) => {
    setTailorName(tailor.name);
    setTailorPhone(tailor.phone || '');
    setTailorCity(tailor.city);
    setShowTailorSuggestions(false);
  };

  const filteredTailors = tailorHistory.filter((t) =>
    t.name.toLowerCase().includes(tailorName.toLowerCase().trim())
  );

  const handleAttachmentAdd = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    for (const file of Array.from(files)) {
      const preview = URL.createObjectURL(file);
      setAttachments((prev) => [...prev, { file, url: '', visible: true, preview }]);
    }
    if (fileRef.current) fileRef.current.value = '';
  };

  const toggleVisibility = (index: number) => {
    setAttachments((prev) =>
      prev.map((a, i) => (i === index ? { ...a, visible: !a.visible } : a))
    );
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const saveMeasurements = async () => {
    setMeasurementsSaving(true);
    ensureProfile(async (p) => {
      try {
        const { data } = await supabase
          .from('profiles')
          .update({
            measurements: localMeasurements,
            gender: localGender,
            measurement_unit: localUnit,
            measurements_updated_at: new Date().toISOString(),
          })
          .eq('id', p.id)
          .select()
          .single();

        if (data) {
          onProfileUpdate(data as Profile);
        }
      } finally {
        setMeasurementsSaving(false);
        setStep(4);
      }
    });
  };

  const createOrder = async (p: Profile) => {
    setSaving(true);

    // Create order
    const { data: order, error } = await supabase
      .from('orders')
      .insert({
        profile_id: p.id,
        tailor_name: tailorName || 'My Tailor',
        tailor_phone: tailorPhone || null,
        tailor_city: tailorCity,
        description,
        fit_notes: fitNotes,
        status: 'sent',
      })
      .select()
      .single();

    if (error || !order) {
      setSaving(false);
      return null;
    }

    // Upload attachments
    for (const att of attachments) {
      if (att.file) {
        const url = await uploadImage(att.file, `orders/${order.id}`);
        if (url) {
          await supabase.from('order_attachments').insert({
            order_id: order.id,
            url,
            type: 'inspiration',
            visible_to_tailor: att.visible,
          });
        }
      }
    }

    return order as Order;
  };

  const handleSendOrder = async () => {
    ensureProfile(async (p) => {
      const order = await createOrder(p);
      if (!order) return;

      const updatedProfile = { ...p, measurements: localMeasurements };
      const message = generateOrderMessage(updatedProfile, order);
      const phone = tailorPhone ? tailorPhone.replace(/[\s\-\(\)]/g, '') : undefined;
      openWhatsApp(message, phone);

      setSentOrder(order);
      setSent(true);
      setSaving(false);
    });
  };

  const handleShareOrder = async () => {
    ensureProfile(async (p) => {
      const order = await createOrder(p);
      if (!order) return;

      const updatedProfile = { ...p, measurements: localMeasurements };
      const message = generateOrderShareMessage(updatedProfile, order);
      openWhatsApp(message);

      setSentOrder(order);
      setSent(true);
      setSaving(false);
    });
  };

  const handleShareSuruwe = () => {
    setShowSharePreview(true);
  };

  const confirmShareSuruwe = () => {
    const text = `You know that feeling when you send your tailor a photo and what comes back looks nothing like it? I started using Suruwe to send my measurements, photos, and fit notes in one link. No more wahala. Try it:`;
    if (navigator.share) {
      navigator.share({
        title: 'Suruwe',
        text,
        url: 'https://suruwe.vercel.app',
      }).catch(() => {});
    } else {
      openWhatsApp(`${text}\n\nhttps://suruwe.vercel.app`);
    }
    setShowSharePreview(false);
  };

  const canProceedStep1 = description.trim();
  const previewMessage = (() => {
    let msg = '';
    if (tailorName.trim()) {
      msg = `Hi ${tailorName}, I'd like to get something made. ${description}.`;
    } else {
      msg = `I'd like to get something made. ${description}.`;
    }
    if (fitNotes) {
      msg += `\n\nFit notes: ${fitNotes}`;
    }
    msg += `\n\nHere are my measurements, photos, and order details: [link will be generated]`;
    return msg;
  })();

  return (
    <div>
      {/* Header */}
      {!sent && (
        <div className="flex items-center gap-12 mb-24">
          <button className="back-btn" onClick={step === 1 ? onClose : () => setStep(step - 1)}>
            <ArrowLeftIcon size={18} />
            <span>{step === 1 ? 'Cancel' : 'Back'}</span>
          </button>
          <span className="text-muted" style={{ fontSize: 14, marginLeft: 'auto' }}>
            Step {step} of {totalSteps}
          </span>
        </div>
      )}

      {/* Progress dots */}
      {!sent && (
        <div className="order-steps">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`order-step-dot ${i + 1 === step ? 'active' : i + 1 < step ? 'done' : ''}`}
            />
          ))}
        </div>
      )}

      {/* Step 1: Tailor details */}
      {step === 1 && (
        <div>
          <h2 className="mb-24">What are you making?</h2>

          <div className="flex flex-col gap-16">
            <div className="input-group">
              <label>What are you making?</label>
              <input
                className="input"
                placeholder="e.g. Agbada for a wedding"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                autoFocus
              />
            </div>

            <div className="input-group" style={{ position: 'relative' }}>
              <label>Tailor name (optional)</label>
              <input
                className="input"
                placeholder="e.g. Baba Tailor"
                value={tailorName}
                onChange={(e) => {
                  setTailorName(e.target.value);
                  setShowTailorSuggestions(e.target.value.length > 0 && tailorHistory.length > 0);
                }}
                onFocus={() => {
                  if (tailorHistory.length > 0) setShowTailorSuggestions(true);
                }}
                onBlur={() => {
                  setTimeout(() => setShowTailorSuggestions(false), 200);
                }}
              />
              {showTailorSuggestions && filteredTailors.length > 0 && (
                <div className="tailor-suggestions">
                  {filteredTailors.map((tailor, i) => (
                    <div
                      key={i}
                      className="tailor-suggestion-item"
                      onClick={() => selectTailor(tailor)}
                    >
                      <div style={{ fontWeight: 500, color: 'var(--text)' }}>{tailor.name}</div>
                      <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                        {[tailor.city, tailor.phone].filter(Boolean).join(' · ') || 'No details'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="input-group">
              <label>Tailor's WhatsApp number (optional)</label>
              <input
                className="input"
                type="tel"
                placeholder="e.g. +234 801 234 5678"
                value={tailorPhone}
                onChange={(e) => setTailorPhone(e.target.value)}
              />
            </div>

            <div className="input-group">
              <label>City (optional)</label>
              <input
                className="input"
                placeholder="e.g. Lagos"
                value={tailorCity}
                onChange={(e) => setTailorCity(e.target.value)}
              />
            </div>
          </div>

          <button
            className="btn btn-primary btn-full mt-32"
            disabled={!canProceedStep1}
            onClick={() => setStep(2)}
          >
            Continue
          </button>
        </div>
      )}

      {/* Step 2: Fit notes and attachments */}
      {step === 2 && (
        <div>
          <h2 className="mb-24">Fit notes and reference images</h2>

          <div className="flex flex-col gap-16">
            <div className="input-group">
              <label>Fit notes (optional)</label>
              <textarea
                className="textarea"
                placeholder="e.g. I like a slim fit. Not too tight around the arms. Leave extra room in the chest."
                value={fitNotes}
                onChange={(e) => setFitNotes(e.target.value)}
              />
            </div>

            <div>
              <label className="label mb-8" style={{ display: 'block' }}>
                Inspiration images or chat screenshots
              </label>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleAttachmentAdd}
                style={{ display: 'none' }}
              />

              {attachments.length > 0 && (
                <div className="attachment-grid mb-16">
                  {attachments.map((att, i) => (
                    <div key={i} className="attachment-item">
                      <img src={att.preview} alt="Attachment" />
                      <button
                        className={`attachment-visibility ${!att.visible ? 'hidden' : ''}`}
                        onClick={() => toggleVisibility(i)}
                        title={att.visible ? 'Tailor can see this' : 'Private to you'}
                      >
                        {att.visible ? <EyeIcon /> : <EyeOffIcon />}
                      </button>
                      <button
                        className="photo-delete"
                        style={{ opacity: 1, top: 'auto', bottom: 4, right: 4 }}
                        onClick={() => removeAttachment(i)}
                      >
                        <XIcon size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <button
                className="btn btn-secondary btn-sm"
                onClick={() => fileRef.current?.click()}
              >
                <PlusIcon size={16} />
                Add images
              </button>
            </div>
          </div>

          <button className="btn btn-primary btn-full mt-32" onClick={() => setStep(3)}>
            Continue
          </button>
        </div>
      )}

      {/* Step 3: Measurements */}
      {step === 3 && (
        <div>
          {hasMeasurements && !measurementsStale ? (
            <div>
              <h2 className="mb-16">Your measurements</h2>
              {profile?.measurements_updated_at && (
                <p className="text-secondary mb-24" style={{ fontSize: 14 }}>
                  Last updated {formatRelativeDate(profile?.measurements_updated_at)}.
                </p>
              )}
              <div className="flex flex-col gap-12">
                <button className="btn btn-primary btn-full" onClick={() => setStep(4)}>
                  Looks good, continue
                </button>
                <button
                  className="btn btn-secondary btn-full"
                  onClick={() => setStep(3.5 as any)}
                >
                  Update measurements
                </button>
              </div>
            </div>
          ) : hasMeasurements && measurementsStale ? (
            <div>
              <h2 className="mb-16">Check your measurements</h2>
              <div className="stale-banner mb-24">
                Your measurements were last updated{' '}
                {profile?.measurements_updated_at
                  ? formatRelativeDate(profile?.measurements_updated_at)
                  : 'a while ago'}
                . Want to update before sending?
              </div>
              <div className="flex flex-col gap-12">
                <button className="btn btn-secondary btn-full" onClick={() => setStep(3.5 as any)}>
                  Update measurements
                </button>
                <button className="btn btn-ghost btn-full" onClick={() => setStep(4)}>
                  Skip, they are still correct
                </button>
              </div>
            </div>
          ) : (
            <div>
              <h2 className="mb-8">Add your measurements</h2>
              <p className="text-secondary mb-24" style={{ fontSize: 14, lineHeight: 1.5 }}>
                Your tailor needs these to get the fit right. You only have to do this once.
              </p>
              <MeasurementsEditor
                gender={localGender}
                unit={localUnit}
                measurements={localMeasurements}
                onGenderChange={setLocalGender}
                onUnitChange={setLocalUnit}
                onMeasurementsChange={setLocalMeasurements}
                onSave={saveMeasurements}
                saving={measurementsSaving}
                saveLabel="Save and Continue"
              />
              <button className="btn btn-ghost btn-full mt-8" onClick={() => setStep(4)}>
                Skip for now
              </button>
            </div>
          )}
        </div>
      )}

      {/* Step 3.5: Edit measurements inline */}
      {step === (3.5 as any) && (
        <div>
          <h2 className="mb-24">Update measurements</h2>
          <MeasurementsEditor
            gender={localGender}
            unit={localUnit}
            measurements={localMeasurements}
            onGenderChange={setLocalGender}
            onUnitChange={setLocalUnit}
            onMeasurementsChange={setLocalMeasurements}
            onSave={saveMeasurements}
            saving={measurementsSaving}
            saveLabel="Save and Continue"
          />
        </div>
      )}

      {/* Step 4: Review and send */}
      {step === 4 && !sent && (
        <div>
          <h2 className="mb-24">Review and send</h2>

          {!hasPhotos && (
            <div className="card mb-16" style={{ padding: '14px 16px', border: '1px dashed var(--border)' }}>
              <p style={{ fontSize: 14, lineHeight: 1.5, color: 'var(--text-secondary)', margin: 0 }}>
                You have not added a photo of yourself yet. A photo helps your tailor see your frame and get the fit right.
              </p>
            </div>
          )}

          <p className="text-muted mb-16" style={{ fontSize: 13 }}>
            Tap any section to edit
          </p>

          <div className="card mb-24">
            <div className="review-item review-item-tappable" onClick={() => setStep(1)}>
              <div className="review-label">Making</div>
              <div className="review-value">{description}</div>
            </div>
            {tailorName.trim() && (
              <div className="review-item review-item-tappable" onClick={() => setStep(1)}>
                <div className="review-label">Tailor</div>
                <div className="review-value">
                  {tailorName}
                  {tailorCity ? `, ${tailorCity}` : ''}
                </div>
              </div>
            )}
            <div className="review-item review-item-tappable" onClick={() => setStep(2)}>
              <div className="review-label">Fit notes</div>
              <div className="review-value">{fitNotes || 'None'}</div>
            </div>
            {attachments.length > 0 && (
              <div className="review-item review-item-tappable" onClick={() => setStep(2)}>
                <div className="review-label">
                  Attachments ({attachments.filter((a) => a.visible).length} visible to tailor)
                </div>
                <div className="attachment-grid mt-8">
                  {attachments.map((att, i) => (
                    <div key={i} className="attachment-item" style={{ opacity: att.visible ? 1 : 0.4 }}>
                      <img src={att.preview} alt="Attachment" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="wa-preview mb-24">{previewMessage}</div>

          <div className="flex flex-col gap-12">
            {tailorName.trim() && tailorPhone.trim() ? (
              <button
                className="btn btn-whatsapp btn-full"
                onClick={handleSendOrder}
                disabled={saving}
              >
                <WhatsAppIcon size={20} />
                {saving ? 'Sending...' : `Send to ${tailorName}`}
              </button>
            ) : null}
            <button
              className="btn btn-whatsapp btn-full"
              onClick={tailorName.trim() && !tailorPhone.trim() ? handleSendOrder : handleShareOrder}
              disabled={saving}
              style={tailorName.trim() && tailorPhone.trim() ? { opacity: 0.85, background: 'var(--bg-secondary)' } : {}}
            >
              <WhatsAppIcon size={20} />
              {saving ? 'Sending...' : 'Share on WhatsApp'}
            </button>
          </div>
        </div>
      )}
      {/* Post-send confirmation */}
      {sent && sentOrder && (
        <div style={{ textAlign: 'center', paddingTop: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>&#x2714;&#xFE0F;</div>
          <h2 style={{ marginBottom: 8 }}>Order sent!</h2>
          <p className="text-secondary" style={{ fontSize: 14, lineHeight: 1.5, marginBottom: 32 }}>
            Your order for {sentOrder.description} has been sent
            {tailorName.trim() ? ` to ${tailorName}` : ''} via WhatsApp.
          </p>

          {!showSharePreview ? (
            <div
              style={{
                padding: '20px',
                borderRadius: 'var(--radius)',
                border: '1px solid var(--border)',
                background: 'var(--bg-raised)',
                marginBottom: 32,
              }}
            >
              <p style={{ fontSize: 15, color: 'var(--text)', lineHeight: 1.5, marginBottom: 16 }}>
                Know someone who struggles with getting clothes made the way they want?
              </p>
              <button
                className="btn btn-secondary btn-sm"
                onClick={handleShareSuruwe}
                style={{
                  padding: '10px 24px',
                  gap: 8,
                  borderRadius: 24,
                }}
              >
                <span style={{ fontSize: 16 }}>&#x2764;&#xFE0F;</span>
                Share Suruwe
              </button>
            </div>
          ) : (
            <div style={{ textAlign: 'left', marginBottom: 32 }}>
              <h3 style={{ marginBottom: 6, fontSize: 18 }}>
                What you ordered vs what you got.
              </h3>
              <p style={{ fontSize: 18, fontFamily: 'var(--font-display)', fontWeight: 500, color: 'var(--accent)', marginBottom: 20 }}>
                Never again.
              </p>

              <div className="wa-preview" style={{ marginBottom: 20 }}>
                You know that feeling when you send your tailor a photo and what comes back looks nothing like it? I started using Suruwe to send my measurements, photos, and fit notes in one link. No more wahala. Try it:{'\n\n'}https://suruwe.vercel.app
              </div>

              <button
                className="btn btn-primary btn-full"
                onClick={confirmShareSuruwe}
              >
                Share Suruwe
              </button>
            </div>
          )}

          <button
            className="btn btn-primary btn-full"
            onClick={() => onOrderCreated(sentOrder)}
            style={showSharePreview ? { background: 'transparent', color: 'var(--text-secondary)', border: 'none' } : {}}
          >
            Done
          </button>
        </div>
      )}
    </div>
  );
}
