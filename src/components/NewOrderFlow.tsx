'use client';

import { useState, useRef } from 'react';
import { Profile, Order, OrderAttachment, getMeasurementFields } from '@/types';
import { supabase } from '@/lib/supabase';
import { uploadImage } from '@/lib/upload';
import { generateOrderMessage, openWhatsApp } from '@/lib/whatsapp';
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
  profile: Profile;
  onClose: () => void;
  onOrderCreated: (order: Order) => void;
  onProfileUpdate: (profile: Profile) => void;
}

interface AttachmentLocal {
  file?: File;
  url: string;
  visible: boolean;
  preview: string;
}

export default function NewOrderFlow({
  profile,
  onClose,
  onOrderCreated,
  onProfileUpdate,
}: NewOrderFlowProps) {
  const [step, setStep] = useState(1);
  const [tailorName, setTailorName] = useState('');
  const [tailorCity, setTailorCity] = useState('');
  const [description, setDescription] = useState('');
  const [fitNotes, setFitNotes] = useState('');
  const [attachments, setAttachments] = useState<AttachmentLocal[]>([]);
  const [saving, setSaving] = useState(false);
  const [measurementsSaving, setMeasurementsSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Local measurements state for step 3
  const [localMeasurements, setLocalMeasurements] = useState(profile.measurements);
  const [localGender, setLocalGender] = useState(profile.gender);
  const [localUnit, setLocalUnit] = useState(profile.measurement_unit);

  const totalSteps = 4;
  const hasMeasurements = Object.keys(profile.measurements).length > 0;

  // Check if measurements are stale (older than 30 days)
  const measurementsStale = profile.measurements_updated_at
    ? (Date.now() - new Date(profile.measurements_updated_at).getTime()) > 30 * 24 * 60 * 60 * 1000
    : false;

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
    const { data } = await supabase
      .from('profiles')
      .update({
        measurements: localMeasurements,
        gender: localGender,
        measurement_unit: localUnit,
        measurements_updated_at: new Date().toISOString(),
      })
      .eq('id', profile.id)
      .select()
      .single();

    if (data) {
      onProfileUpdate(data as Profile);
    }
    setMeasurementsSaving(false);
    setStep(4);
  };

  const handleSendOrder = async () => {
    setSaving(true);

    // Create order
    const { data: order, error } = await supabase
      .from('orders')
      .insert({
        profile_id: profile.id,
        tailor_name: tailorName,
        tailor_city: tailorCity,
        description,
        fit_notes: fitNotes,
        status: 'sent',
      })
      .select()
      .single();

    if (error || !order) {
      setSaving(false);
      return;
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

    // Generate and send WhatsApp message
    const updatedProfile = { ...profile, measurements: localMeasurements };
    const message = generateOrderMessage(updatedProfile, order as Order);
    openWhatsApp(message);

    onOrderCreated(order as Order);
    setSaving(false);
  };

  const canProceedStep1 = tailorName.trim() && description.trim();
  const message = generateOrderMessage(
    { ...profile, measurements: localMeasurements },
    {
      id: '',
      profile_id: profile.id,
      tailor_name: tailorName,
      tailor_city: tailorCity,
      description,
      fit_notes: fitNotes,
      status: 'draft',
      completed_photo_url: null,
      created_at: '',
      updated_at: '',
    }
  );

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-12 mb-24">
        <button className="back-btn" onClick={step === 1 ? onClose : () => setStep(step - 1)}>
          <ArrowLeftIcon size={18} />
          <span>{step === 1 ? 'Cancel' : 'Back'}</span>
        </button>
        <span className="text-muted" style={{ fontSize: 14, marginLeft: 'auto' }}>
          Step {step} of {totalSteps}
        </span>
      </div>

      {/* Progress dots */}
      <div className="order-steps">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            className={`order-step-dot ${i + 1 === step ? 'active' : i + 1 < step ? 'done' : ''}`}
          />
        ))}
      </div>

      {/* Step 1: Tailor details */}
      {step === 1 && (
        <div>
          <h2 className="mb-24">Who is making this?</h2>

          <div className="flex flex-col gap-16">
            <div className="input-group">
              <label>Tailor name</label>
              <input
                className="input"
                placeholder="e.g. Baba Tailor"
                value={tailorName}
                onChange={(e) => setTailorName(e.target.value)}
                autoFocus
              />
            </div>

            <div className="input-group">
              <label>City</label>
              <input
                className="input"
                placeholder="e.g. Lagos"
                value={tailorCity}
                onChange={(e) => setTailorCity(e.target.value)}
              />
            </div>

            <div className="input-group">
              <label>What are you making?</label>
              <input
                className="input"
                placeholder="e.g. Agbada for a wedding"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
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
              {profile.measurements_updated_at && (
                <p className="text-secondary mb-24" style={{ fontSize: 14 }}>
                  Last updated {formatRelativeDate(profile.measurements_updated_at)}.
                </p>
              )}
              <div className="flex flex-col gap-12">
                <button className="btn btn-primary btn-full" onClick={() => setStep(4)}>
                  Looks good, continue
                </button>
                <button
                  className="btn btn-secondary btn-full"
                  onClick={() => {
                    // Show editor inline
                    setStep(3.5 as any);
                  }}
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
                {profile.measurements_updated_at
                  ? formatRelativeDate(profile.measurements_updated_at)
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
          />
        </div>
      )}

      {/* Step 4: Review and send */}
      {step === 4 && (
        <div>
          <h2 className="mb-24">Review and send</h2>

          <div className="card mb-24">
            <div className="review-item">
              <div className="review-label">Tailor</div>
              <div className="review-value">
                {tailorName}
                {tailorCity ? `, ${tailorCity}` : ''}
              </div>
            </div>
            <div className="review-item">
              <div className="review-label">Making</div>
              <div className="review-value">{description}</div>
            </div>
            {fitNotes && (
              <div className="review-item">
                <div className="review-label">Fit notes</div>
                <div className="review-value">{fitNotes}</div>
              </div>
            )}
            {attachments.length > 0 && (
              <div className="review-item">
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

          <div className="wa-preview mb-24">{message}</div>

          <button
            className="btn btn-whatsapp btn-full"
            onClick={handleSendOrder}
            disabled={saving}
          >
            <WhatsAppIcon size={20} />
            {saving ? 'Sending...' : `Send to ${tailorName}`}
          </button>
        </div>
      )}
    </div>
  );
}
