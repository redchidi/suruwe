'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Profile, Order, OrderAttachment, getMeasurementFields } from '@/types';
import { supabase } from '@/lib/supabase';
import { uploadImage } from '@/lib/upload';
import { generateOrderMessage, generateOrderShareMessage, openWhatsApp } from '@/lib/whatsapp';
import { formatRelativeDate } from '@/lib/utils';
import MeasurementsEditor from './MeasurementsEditor';
import {
  ArrowLeftIcon, WhatsAppIcon, EyeIcon, EyeOffIcon, XIcon, PlusIcon, ImageIcon,
} from './Icons';

interface NewOrderFlowProps {
  profile: Profile | null;
  hasPhotos: boolean;
  onClose: () => void;
  onOrderCreated: (order: Order) => void;
  onDraftSaved: (order: Order) => void;
  onProfileUpdate: (profile: Profile) => void;
  requestProfile: (action?: 'save-measurements' | 'send-order') => void;
  pendingAction: 'save-measurements' | 'send-order' | null;
  onActionConsumed: () => void;
  draftOrder?: Order | null;
}

interface AttachmentLocal { file?: File; url: string; visible: boolean; preview: string; }
interface TailorHistory { name: string; phone: string | null; city: string; }

export default function NewOrderFlow({
  profile, hasPhotos, onClose, onOrderCreated, onDraftSaved, onProfileUpdate,
  requestProfile, pendingAction, onActionConsumed, draftOrder,
}: NewOrderFlowProps) {
  const t = useTranslations();
  const locale = useLocale();

  const [step, setStep] = useState(1);
  const [tailorName, setTailorName] = useState(draftOrder?.tailor_name || '');
  const [tailorPhone, setTailorPhone] = useState(draftOrder?.tailor_phone || '');
  const [tailorCity, setTailorCity] = useState(draftOrder?.tailor_city || '');
  const [description, setDescription] = useState(draftOrder?.description || '');
  const [deadline, setDeadline] = useState(draftOrder?.deadline || '');
  const [fitNotes, setFitNotes] = useState(draftOrder?.fit_notes || '');
  const [fabricNotes, setFabricNotes] = useState('');
  const [attachments, setAttachments] = useState<AttachmentLocal[]>([]);
  const [saving, setSaving] = useState(false);
  const [measurementsSaving, setMeasurementsSaving] = useState(false);
  const [sent, setSent] = useState(false);
  const [sentOrder, setSentOrder] = useState<Order | null>(null);
  const [showSharePreview, setShowSharePreview] = useState(false);
  const [sendMode, setSendMode] = useState<'direct' | 'share' | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackSent, setFeedbackSent] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const fabricFileRef = useRef<HTMLInputElement>(null);

  const [tailorHistory, setTailorHistory] = useState<TailorHistory[]>([]);
  const [showTailorSuggestions, setShowTailorSuggestions] = useState(false);

  const [localMeasurements, setLocalMeasurements] = useState(profile?.measurements || {});
  const [localGender, setLocalGender] = useState(profile?.gender || 'male');
  const [localUnit, setLocalUnit] = useState(profile?.measurement_unit || 'inches');

  const totalSteps = 4;
  const hasMeasurements = profile ? Object.keys(profile.measurements).length > 0 : false;
  const measurementsStale = profile?.measurements_updated_at
    ? (Date.now() - new Date(profile?.measurements_updated_at).getTime()) > 30 * 24 * 60 * 60 * 1000 : false;

  useEffect(() => { if (profile) loadTailorHistory(); }, [profile]);

  const loadTailorHistory = async () => {
    const { data } = await supabase.from('orders').select('tailor_name, tailor_phone, tailor_city')
      .eq('profile_id', profile!.id).order('created_at', { ascending: false });
    if (data) {
      const seen = new Set<string>();
      const unique: TailorHistory[] = [];
      for (const row of data) {
        const key = row.tailor_name.toLowerCase().trim();
        if (!seen.has(key)) { seen.add(key); unique.push({ name: row.tailor_name, phone: row.tailor_phone || null, city: row.tailor_city || '' }); }
      }
      setTailorHistory(unique);
    }
  };

  const selectTailor = (tailor: TailorHistory) => {
    setTailorName(tailor.name); setTailorPhone(tailor.phone || ''); setTailorCity(tailor.city); setShowTailorSuggestions(false);
  };

  const filteredTailors = tailorHistory.filter((th) => th.name.toLowerCase().includes(tailorName.toLowerCase().trim()));

  const handleAttachmentAdd = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    for (const file of Array.from(files)) {
      const preview = URL.createObjectURL(file);
      setAttachments((prev) => [...prev, { file, url: '', visible: true, preview }]);
    }
    if (fileRef.current) fileRef.current.value = '';
    if (fabricFileRef.current) fabricFileRef.current.value = '';
  };

  const toggleVisibility = (index: number) => { setAttachments((prev) => prev.map((a, i) => (i === index ? { ...a, visible: !a.visible } : a))); };
  const removeAttachment = (index: number) => { setAttachments((prev) => prev.filter((_, i) => i !== index)); };

  const saveMeasurements = async () => {
    if (!profile) { requestProfile('save-measurements'); return; }
    doSaveMeasurements();
  };

  const doSaveMeasurements = async () => {
    if (!profile) return;
    setMeasurementsSaving(true);
    try {
      const { data } = await supabase.from('profiles').update({
        measurements: localMeasurements, gender: localGender, measurement_unit: localUnit,
        measurements_updated_at: new Date().toISOString(),
      }).eq('id', profile!.id).select().single();
      if (data) onProfileUpdate(data as Profile);
    } finally { setMeasurementsSaving(false); setStep(4); }
  };

  const createOrder = async (p: Profile): Promise<Order | null> => {
    setSaving(true);
    let order: Order | null = null;
    const combinedFitNotes = [fitNotes, fabricNotes].filter(Boolean).join('\n\n');

    if (draftOrder) {
      const { data, error } = await supabase.from('orders').update({
        tailor_name: tailorName || 'My Tailor', tailor_phone: tailorPhone || null, tailor_city: tailorCity,
        description, fit_notes: combinedFitNotes, deadline: deadline || null, status: 'sent',
      }).eq('id', draftOrder.id).select().single();
      if (error || !data) { setSaving(false); return null; }
      order = data as Order;
    } else {
      const { data, error } = await supabase.from('orders').insert({
        profile_id: p.id, tailor_name: tailorName || 'My Tailor', tailor_phone: tailorPhone || null,
        tailor_city: tailorCity, description, fit_notes: combinedFitNotes, deadline: deadline || null, status: 'sent',
      }).select().single();
      if (error || !data) { setSaving(false); return null; }
      order = data as Order;
    }

    for (const att of attachments) {
      if (att.file) {
        const url = await uploadImage(att.file, `orders/${order.id}`);
        if (url) { await supabase.from('order_attachments').insert({ order_id: order.id, url, type: 'inspiration', visible_to_tailor: att.visible }); }
      }
    }
    return order as Order;
  };

  const handleSendOrder = async () => {
    if (!profile) { setSendMode('direct'); requestProfile('send-order'); return; }
    doSendOrder(profile);
  };

  const doSendOrder = async (p: Profile) => {
    const order = await createOrder(p);
    if (!order) return;
    const updatedProfile = { ...p, measurements: localMeasurements };
    const message = generateOrderMessage(updatedProfile, order, locale);
    const phone = tailorPhone ? tailorPhone.replace(/[\s\-\(\)]/g, '') : undefined;
    openWhatsApp(message, phone);
    setSentOrder(order); setSent(true); setSaving(false);
  };

  const handleShareOrder = async () => {
    if (!profile) { setSendMode('share'); requestProfile('send-order'); return; }
    doShareOrder(profile);
  };

  const doShareOrder = async (p: Profile) => {
    const order = await createOrder(p);
    if (!order) return;
    const updatedProfile = { ...p, measurements: localMeasurements };
    const message = generateOrderShareMessage(updatedProfile, order, locale);
    openWhatsApp(message);
    setSentOrder(order); setSent(true); setSaving(false);
  };

  useEffect(() => {
    if (!profile || !pendingAction) return;
    if (pendingAction === 'save-measurements') {
      onActionConsumed();
      setMeasurementsSaving(true);
      supabase.from('profiles').update({
        measurements: localMeasurements,
        gender: localGender,
        measurement_unit: localUnit,
        measurements_updated_at: new Date().toISOString(),
      }).eq('id', profile.id).select().single().then(({ data }) => {
        if (data) onProfileUpdate(data as Profile);
        setMeasurementsSaving(false);
        setStep(4);
      });
    }
    else if (pendingAction === 'send-order') { onActionConsumed(); if (sendMode === 'share') { doShareOrder(profile); } else { doSendOrder(profile); } }
  }, [profile, pendingAction]);

  const handleShareSuruwe = () => { setShowSharePreview(true); };
  const confirmShareSuruwe = () => {
    const text = t('shareSuruwe.message');
    if (navigator.share) { navigator.share({ title: 'Suruwe', text, url: 'https://suruwe.com' }).catch(() => {}); }
    else { openWhatsApp(`${text}\n\nhttps://suruwe.com`); }
    setShowSharePreview(false);
  };

  const handleClose = async () => {
    if (!description.trim()) { onClose(); return; }
    if (!profile) { onClose(); return; }
    const combinedFitNotes = [fitNotes, fabricNotes].filter(Boolean).join('\n\n');
    if (draftOrder) {
      const { data } = await supabase.from('orders').update({
        tailor_name: tailorName || 'My Tailor', tailor_phone: tailorPhone || null, tailor_city: tailorCity,
        description, fit_notes: combinedFitNotes, deadline: deadline || null,
      }).eq('id', draftOrder.id).select().single();
      if (data) onDraftSaved(data as Order);
    } else {
      const { data } = await supabase.from('orders').insert({
        profile_id: profile.id, tailor_name: tailorName || 'My Tailor', tailor_phone: tailorPhone || null,
        tailor_city: tailorCity, description, fit_notes: combinedFitNotes, deadline: deadline || null, status: 'draft',
      }).select().single();
      if (data) onDraftSaved(data as Order);
    }
    onClose();
  };

  const canProceedStep1 = description.trim();
  const measurementCount = profile?.measurements ? Object.keys(profile.measurements).length : 0;

  if (sent && sentOrder) {
    return <PostSendScreen order={sentOrder} tailorName={tailorName} profile={profile} feedbackText={feedbackText} setFeedbackText={setFeedbackText} feedbackSent={feedbackSent} setFeedbackSent={setFeedbackSent} showSharePreview={showSharePreview} setShowSharePreview={setShowSharePreview} handleShareSuruwe={handleShareSuruwe} confirmShareSuruwe={confirmShareSuruwe} onDone={() => onOrderCreated(sentOrder)} />;
  }

  // ── STEP 4: REVIEW ──
  if (step === 4) {
    return (
      <div style={{ background: 'var(--charcoal)', minHeight: '100dvh', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
        <div className="ghost-letter" style={{ top: -20, right: -14, fontSize: 130 }}>R</div>
        <div style={{ position: 'relative', zIndex: 2, padding: '44px 24px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <button onClick={() => setStep(3)} style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', color: 'var(--muted-d)', fontSize: 14 }}>&larr;</button>
            <span className="wordmark" style={{ fontSize: 10, letterSpacing: '0.22em' }}>{t('orderFlow.newOrder')}</span>
          </div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600, letterSpacing: '0.22em', textTransform: 'uppercase' as const, color: 'var(--gold)', marginBottom: 14, opacity: 0.8 }}>{t('orderFlow.review.eyebrow')}</div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 300, color: 'var(--cream)', lineHeight: 1.1 }}>{t('orderFlow.review.headline')}</h2>
          <div className="step-chips" style={{ marginTop: 14 }}>
            <div className="step-chip step-chip-done" style={{ cursor: 'pointer' }} onClick={() => setStep(1)}>{t('orderFlow.review.stepDetails')} &#10003;</div>
            <div className="step-chip step-chip-done" style={{ cursor: 'pointer' }} onClick={() => setStep(2)}>{t('orderFlow.review.stepNotes')} &#10003;</div>
            <div className="step-chip step-chip-active">{t('orderFlow.review.stepReview')}</div>
          </div>
        </div>
        <div style={{ position: 'relative', zIndex: 2, padding: '20px 24px', flex: 1 }}>
          <div style={{ background: 'var(--charcoal-2)', border: '0.5px solid rgba(184,146,74,0.14)', borderRadius: 12, padding: 16, marginBottom: 12 }}>
            <ReviewRow label={t('orderFlow.review.labelOrder')} value={description} accent />
            <ReviewRow label={t('orderFlow.review.labelTailor')} value={tailorName || t('orderFlow.review.valueNotSpecified')} />
            {deadline && <ReviewRow label={t('orderFlow.review.labelNeedBy')} value={new Date(deadline + 'T00:00:00').toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', { month: 'long', day: 'numeric', year: 'numeric' })} />}
            <ReviewRow label={t('orderFlow.review.labelReferenceImages')} value={attachments.length > 0 ? `${attachments.filter(a => a.visible).length} ${locale === 'fr' ? 'jointes' : 'attached'}` : t('orderFlow.review.valueNone')} />
            <ReviewRow label={t('orderFlow.review.labelMeasurements')} value={measurementCount > 0 ? `${measurementCount} ${locale === 'fr' ? 'de ton profil' : 'from your profile'}` : t('orderFlow.review.valueNotSet')} />
            <ReviewRow label={t('orderFlow.review.labelBodyPhoto')} value={hasPhotos ? t('orderFlow.review.valueIncluded') : t('orderFlow.review.valueNotAdded')} last />
          </div>
          {fitNotes.trim() && (
            <div style={{ background: 'var(--charcoal-2)', border: '0.5px solid rgba(184,146,74,0.14)', borderRadius: 12, padding: '12px 16px', marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--muted-d)', letterSpacing: '0.04em', marginBottom: 8 }}>{t('orderFlow.review.fitNotesPreview')}</div>
              <div style={{ fontSize: 13, fontWeight: 300, color: 'var(--muted-d)', lineHeight: 1.55 }}>{fitNotes.length > 120 ? fitNotes.slice(0, 120) + '...' : fitNotes}</div>
            </div>
          )}
          {!hasPhotos && (
            <div style={{ background: 'var(--charcoal-2)', border: '1px dashed rgba(184,146,74,0.2)', borderRadius: 12, padding: '12px 16px', marginBottom: 12 }}>
              <p style={{ fontSize: 13, lineHeight: 1.55, color: 'var(--muted-d)', margin: 0, fontFamily: 'var(--font-body)' }}>{t('orderFlow.review.photoNudge')}</p>
            </div>
          )}
        </div>
        <div style={{ position: 'relative', zIndex: 2, padding: '16px 24px 40px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {tailorName.trim() ? (
              <button className="btn-gold" onClick={handleSendOrder} disabled={saving}>
                <span>{saving ? t('common.sending') : t('orderFlow.review.sendToTailor', { name: tailorName })}</span>
                <span>&rarr;</span>
              </button>
            ) : (
              <button className="btn-gold" onClick={handleShareOrder} disabled={saving}>
                <span>{saving ? t('common.sending') : t('orderFlow.step4.shareOnWhatsApp')}</span>
                <span>&rarr;</span>
              </button>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 14 }}>
            <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#25d366', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg viewBox="0 0 12 12" fill="white" width="12" height="12"><path d="M6 1a5 5 0 100 10A5 5 0 006 1zM4.5 8.5L3 11l2.5-1.5L8 11l-1.5-2.5L9 6H3l2.5 2.5z" fill="white"/></svg>
            </div>
            <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--muted-d)', fontFamily: 'var(--font-body)' }}>{t('orderFlow.review.whatsappAttribution')}</span>
          </div>
        </div>
      </div>
    );
  }

  // ── STEPS 1, 2, 3 ──
  const stepConfig: Record<number, { headline: JSX.Element; chips: JSX.Element }> = {
    1: {
      headline: <>{locale === 'fr' ? 'Dis-nous ce que tu fais ' : 'Tell us what you\u2019re '}<span style={{ color: 'var(--gold-pale)' }}>{locale === 'fr' ? 'confectionner.' : 'making.'}</span></>,
      chips: <div className="step-chips" style={{ marginTop: 14 }}><div className="step-chip step-chip-active">{t('orderFlow.review.stepDetails')}</div><div className="step-chip step-chip-todo" style={{ cursor: 'pointer' }} onClick={() => setStep(2)}>{t('orderFlow.review.stepNotes')}</div><div className="step-chip step-chip-todo" style={{ cursor: 'pointer' }} onClick={() => setStep(3)}>{t('orderFlow.review.stepReview')}</div></div>,
    },
    2: {
      headline: <>{locale === 'fr' ? 'Comment doit-il ' : 'How should it '}<span style={{ color: 'var(--gold-pale)' }}>{locale === 'fr' ? 'tomber ?' : 'fit?'}</span></>,
      chips: <div className="step-chips" style={{ marginTop: 14 }}><div className="step-chip step-chip-done" style={{ cursor: 'pointer' }} onClick={() => setStep(1)}>{t('orderFlow.review.stepDetails')} &#10003;</div><div className="step-chip step-chip-active">{t('orderFlow.review.stepNotes')}</div><div className="step-chip step-chip-todo" style={{ cursor: 'pointer' }} onClick={() => setStep(3)}>{t('orderFlow.review.stepReview')}</div></div>,
    },
    3: {
      headline: <>{locale === 'fr' ? 'Tes ' : 'Your '}<span style={{ color: 'var(--gold-pale)' }}>{locale === 'fr' ? 'mensurations.' : 'measurements.'}</span></>,
      chips: <div className="step-chips" style={{ marginTop: 14 }}><div className="step-chip step-chip-done" style={{ cursor: 'pointer' }} onClick={() => setStep(1)}>{t('orderFlow.review.stepDetails')} &#10003;</div><div className="step-chip step-chip-done" style={{ cursor: 'pointer' }} onClick={() => setStep(2)}>{t('orderFlow.review.stepNotes')} &#10003;</div><div className="step-chip step-chip-todo" style={{ cursor: 'pointer' }} onClick={() => setStep(4)}>{t('orderFlow.review.stepReview')}</div></div>,
    },
  };

  const displayStep = step === 3.5 ? 3 : step;
  const cfg = stepConfig[displayStep] || stepConfig[1];

  return (
    <div style={{ background: 'var(--cream)', minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: 'var(--charcoal)', padding: '44px 24px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <button onClick={step === 1 ? handleClose : () => setStep(step === 3.5 ? 3 : step - 1)} style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', color: 'var(--muted-d)', fontSize: 14 }}>&larr;</button>
          <span className="wordmark" style={{ fontSize: 10, letterSpacing: '0.22em' }}>{t('orderFlow.newOrder')}</span>
        </div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 300, color: 'var(--cream)', lineHeight: 1.1 }}>{cfg.headline}</h2>
        {cfg.chips}
      </div>

      <div style={{ padding: '20px 22px', flex: 1 }}>
        {step === 1 && (
          <>
            <FormField label={t('orderFlow.step1.descriptionLabel')}>
              <input className="input-cream" placeholder={t('orderFlow.step1.descriptionPlaceholder')} value={description} onChange={(e) => setDescription(e.target.value)} autoFocus />
            </FormField>
            <FormField label={t('orderFlow.step1.tailorNameLabel')}>
              <div style={{ position: 'relative' }}>
                <input className="input-cream" placeholder={t('orderFlow.step1.tailorNamePlaceholder')} value={tailorName}
                  onChange={(e) => { setTailorName(e.target.value); setShowTailorSuggestions(e.target.value.length > 0 && tailorHistory.length > 0); }}
                  onFocus={() => { if (tailorHistory.length > 0) setShowTailorSuggestions(true); }}
                  onBlur={() => { setTimeout(() => setShowTailorSuggestions(false), 200); }}
                />
                {showTailorSuggestions && filteredTailors.length > 0 && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '0.5px solid rgba(20,16,12,0.1)', borderRadius: 8, marginTop: 4, zIndex: 10, overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
                    {filteredTailors.map((tailor, i) => (
                      <div key={i} onClick={() => selectTailor(tailor)} style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: i < filteredTailors.length - 1 ? '0.5px solid rgba(20,16,12,0.06)' : 'none' }}>
                        <div style={{ fontWeight: 500, color: 'var(--ink)', fontSize: 14 }}>{tailor.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{[tailor.city, tailor.phone].filter(Boolean).join(' \u00B7 ') || t('orderFlow.step1.noDetails')}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </FormField>
            <FormField label={t('orderFlow.step1.tailorPhoneLabel')}>
              <input className="input-cream" type="tel" placeholder={t('orderFlow.step1.tailorPhonePlaceholder')} value={tailorPhone} onChange={(e) => setTailorPhone(e.target.value)} />
            </FormField>
            <FormField label={t('orderFlow.step1.deadlineLabel')}>
              <input className="input-cream" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} min={new Date().toISOString().split('T')[0]} />
            </FormField>
            <FormField label={t('orderFlow.step1.referenceImages')}>
              <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleAttachmentAdd} style={{ display: 'none' }} />
              <div style={{ display: 'flex', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                {attachments.map((att, i) => (
                  <div key={i} style={{ position: 'relative' }}>
                    <div style={{ width: 56, height: 56, borderRadius: 8, background: 'var(--cream-2)', border: '0.5px solid rgba(20,16,12,0.1)', overflow: 'hidden' }}>
                      <img src={att.preview} alt="" style={{ width: 56, height: 56, objectFit: 'cover' }} />
                    </div>
                    <button onClick={() => removeAttachment(i)} style={{ position: 'absolute', top: -6, right: -6, width: 18, height: 18, borderRadius: '50%', background: 'var(--charcoal)', color: 'var(--cream)', border: 'none', cursor: 'pointer', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>&times;</button>
                  </div>
                ))}
                <button onClick={() => fileRef.current?.click()} style={{ width: 56, height: 56, borderRadius: 8, background: 'transparent', border: '0.5px dashed rgba(20,16,12,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: 'var(--ink-soft)', opacity: 0.4, cursor: 'pointer' }}>+</button>
              </div>
            </FormField>
          </>
        )}

        {step === 2 && (
          <>
            <FormField label={t('orderFlow.step2.fitNotesLabel')}>
              <textarea className="textarea-cream" rows={6} placeholder={t('orderFlow.step2.fitNotesPlaceholder')} value={fitNotes} onChange={(e) => setFitNotes(e.target.value)} style={{ whiteSpace: 'pre-wrap', minHeight: 140 }} />
            </FormField>
            <FormField label={t('orderFlow.step2.fabricNotesLabel')}>
              <input className="input-cream" placeholder={t('orderFlow.step2.fabricNotesPlaceholder')} value={fabricNotes} onChange={(e) => setFabricNotes(e.target.value)} />
            </FormField>
            <FormField label={t('orderFlow.step2.fabricImagesLabel')}>
              <input ref={fabricFileRef} type="file" accept="image/*" multiple onChange={handleAttachmentAdd} style={{ display: 'none' }} />
              <div style={{ display: 'flex', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                <button onClick={() => fabricFileRef.current?.click()} style={{ width: 56, height: 56, borderRadius: 8, background: 'transparent', border: '0.5px dashed rgba(20,16,12,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: 'var(--ink-soft)', opacity: 0.4, cursor: 'pointer' }}>+</button>
              </div>
            </FormField>
          </>
        )}

        {step === 3 && (
          <>
            {hasMeasurements && !measurementsStale ? (
              <div style={{ paddingTop: 8 }}>
                <p style={{ fontSize: 14, fontWeight: 300, color: 'var(--ink-soft)', lineHeight: 1.6, marginBottom: 8 }}>{t('orderFlow.step3.upToDate')}</p>
                {profile?.measurements_updated_at && <p style={{ fontSize: 13, color: 'var(--ink-soft)', marginBottom: 24, opacity: 0.6 }}>{t('orderFlow.step3.hasRecentLastUpdated', { date: formatRelativeDate(profile?.measurements_updated_at) })}</p>}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <button className="btn-charcoal" onClick={() => setStep(4)}><span>{t('orderFlow.step3.hasRecentContinue')}</span><span className="arrow">&rarr;</span></button>
                  <button onClick={() => setStep(3.5 as any)} style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 500, color: 'var(--gold)', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'center', padding: '8px 0' }}>{t('orderFlow.step3.hasRecentUpdate')}</button>
                </div>
              </div>
            ) : hasMeasurements && measurementsStale ? (
              <div style={{ paddingTop: 8 }}>
                <div style={{ background: 'var(--gold-dim)', border: '0.5px solid var(--gold-bdr)', borderRadius: 8, padding: '12px 14px', marginBottom: 20, fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.5 }}>{t('orderFlow.step3.staleBanner', { date: profile?.measurements_updated_at ? formatRelativeDate(profile?.measurements_updated_at) : '' })}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <button className="btn-charcoal" onClick={() => setStep(3.5 as any)}><span>{t('orderFlow.step3.staleUpdate')}</span><span className="arrow">&rarr;</span></button>
                  <button onClick={() => setStep(4)} style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 500, color: 'var(--ink-soft)', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'center', padding: '8px 0' }}>{t('orderFlow.step3.staleSkip')}</button>
                </div>
              </div>
            ) : (
              <div style={{ paddingTop: 8 }}>
                <p style={{ fontSize: 14, fontWeight: 300, color: 'var(--ink-soft)', lineHeight: 1.6, marginBottom: 20 }}>{t('orderFlow.step3.emptySubtitle')}</p>
                <MeasurementsEditor gender={localGender} unit={localUnit} measurements={localMeasurements} onGenderChange={setLocalGender} onUnitChange={setLocalUnit} onMeasurementsChange={setLocalMeasurements} onSave={saveMeasurements} saving={measurementsSaving} saveLabel={t('orderFlow.step3.saveLabel')} />
                <button onClick={() => setStep(4)} style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 500, color: 'var(--ink-soft)', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'center', padding: '12px 0', width: '100%' }}>{t('orderFlow.step3.skip')}</button>
              </div>
            )}
          </>
        )}

        {step === (3.5 as any) && (
          <div style={{ paddingTop: 8 }}>
            <MeasurementsEditor gender={localGender} unit={localUnit} measurements={localMeasurements} onGenderChange={setLocalGender} onUnitChange={setLocalUnit} onMeasurementsChange={setLocalMeasurements} onSave={saveMeasurements} saving={measurementsSaving} saveLabel={t('orderFlow.step35.saveLabel')} />
          </div>
        )}
      </div>

      {(step === 1 || step === 2) && (
        <div style={{ padding: '16px 22px 36px' }}>
          <button className="btn-charcoal" disabled={step === 1 && !canProceedStep1} onClick={() => setStep(step + 1)}>
            <span>{step === 1 ? t('orderFlow.step1.continueButton') : t('orderFlow.step2.continueButton')}</span>
            <span className="arrow">&rarr;</span>
          </button>
        </div>
      )}
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return <div style={{ marginBottom: 18 }}><label className="field-label-cream">{label}</label>{children}</div>;
}

function ReviewRow({ label, value, accent, last }: { label: string; value: string; accent?: boolean; last?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '6px 0', borderBottom: last ? 'none' : '0.5px solid rgba(255,255,255,0.04)' }}>
      <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--muted-d)', letterSpacing: '0.04em' }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 400, color: accent ? 'var(--gold-pale)' : 'var(--cream)', textAlign: 'right', maxWidth: '55%', lineHeight: 1.4 }}>{value}</span>
    </div>
  );
}

function PostSendScreen({ order, tailorName, profile, feedbackText, setFeedbackText, feedbackSent, setFeedbackSent, showSharePreview, setShowSharePreview, handleShareSuruwe, confirmShareSuruwe, onDone }: { order: Order; tailorName: string; profile: Profile | null; feedbackText: string; setFeedbackText: (v: string) => void; feedbackSent: boolean; setFeedbackSent: (v: boolean) => void; showSharePreview: boolean; setShowSharePreview: (v: boolean) => void; handleShareSuruwe: () => void; confirmShareSuruwe: () => void; onDone: () => void; }) {
  const t = useTranslations();
  const locale = useLocale();
  return (
    <div style={{ background: 'var(--charcoal)', minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 28px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontFamily: 'var(--font-display)', fontSize: 280, fontWeight: 200, fontStyle: 'italic', color: 'rgba(184,146,74,0.04)', lineHeight: 1, pointerEvents: 'none', userSelect: 'none', whiteSpace: 'nowrap' }}>&#10003;</div>
      <div style={{ position: 'relative', zIndex: 2, width: '100%', maxWidth: 360 }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(184,146,74,0.12)', border: '1px solid var(--gold-bdr)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
          <svg viewBox="0 0 24 24" fill="none" width="24" height="24"><path d="M5 12l5 5L19 7" stroke="#b8924a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600, letterSpacing: '0.22em', textTransform: 'uppercase' as const, color: 'var(--gold)', marginBottom: 14, opacity: 0.8 }}>{t('orderFlow.postSend.eyebrow')}</div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 34, fontWeight: 200, fontStyle: 'italic', color: 'var(--cream)', lineHeight: 1.15, marginBottom: 12 }}>{t('orderFlow.postSend.headline')}</h2>
        <p style={{ fontSize: 14, fontWeight: 300, color: 'var(--muted-d)', lineHeight: 1.65, marginBottom: 36, maxWidth: 260, marginLeft: 'auto', marginRight: 'auto' }}>{tailorName.trim() ? t('orderFlow.postSend.bodyWithTailor', { name: tailorName }) : t('orderFlow.postSend.bodyGeneric')}</p>
        <div style={{ background: 'var(--charcoal-2)', border: '0.5px solid var(--gold-bdr)', borderRadius: 10, padding: '14px 18px', textAlign: 'left', marginBottom: 28, width: '100%' }}>
          <PostDetailRow label={t('orderFlow.postSend.labelOrder')} value={order.description} />
          <PostDetailRow label={t('orderFlow.postSend.labelSentTo')} value={tailorName || t('orderFlow.postSend.yourTailor')} />
          {order.deadline && <PostDetailRow label={t('orderFlow.postSend.labelDeadline')} value={new Date(order.deadline + 'T00:00:00').toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', { month: 'long', day: 'numeric', year: 'numeric' })} />}
          <PostDetailRow label={t('orderFlow.postSend.labelLinkOpened')} value={t('orderFlow.postSend.linkWaiting')} valueColor="var(--gold-pale)" last />
        </div>
        {!feedbackSent ? (
          <div style={{ background: 'var(--charcoal-2)', border: '0.5px solid var(--gold-bdr)', borderRadius: 10, padding: '14px 18px', textAlign: 'left', marginBottom: 24, width: '100%' }}>
            <p style={{ fontSize: 13, color: 'var(--muted-d)', lineHeight: 1.55, marginBottom: 12 }}>{t('orderFlow.postSend.feedbackPrompt')}</p>
            <textarea rows={2} placeholder={t('orderFlow.postSend.feedbackPlaceholder')} value={feedbackText} onChange={(e) => setFeedbackText(e.target.value)} className="input-dark" style={{ resize: 'none', minHeight: 'auto', marginBottom: 12 }} />
            <button className="btn-ghost-outline" onClick={async () => { if (!feedbackText.trim()) return; await supabase.from('feedback').insert({ profile_id: profile?.id || null, context: 'post_order', message: feedbackText.trim() }); setFeedbackSent(true); }} disabled={!feedbackText.trim()} style={{ fontSize: 11, padding: '10px 16px' }}>{t('orderFlow.postSend.feedbackSend')}</button>
          </div>
        ) : (
          <p style={{ fontSize: 13, color: 'var(--muted-d)', marginBottom: 24, textAlign: 'center', opacity: 0.7 }}>{t('orderFlow.postSend.feedbackThanks')}</p>
        )}
        <button className="btn-ghost-outline" onClick={onDone} style={{ width: '100%' }}>{t('orderFlow.postSend.backToOrders')}</button>
      </div>
    </div>
  );
}

function PostDetailRow({ label, value, valueColor, last }: { label: string; value: string; valueColor?: string; last?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: last ? 'none' : '0.5px solid rgba(255,255,255,0.04)' }}>
      <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--muted-d)', fontFamily: 'var(--font-body)' }}>{label}</span>
      <span style={{ fontSize: 12, fontWeight: 500, color: valueColor || 'var(--cream)', fontFamily: 'var(--font-body)' }}>{value}</span>
    </div>
  );
}
