'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Profile, Order, ProfilePhoto } from '@/types';
import { supabase } from '@/lib/supabase';
import { generateSlug, formatDate } from '@/lib/utils';
import { generateProfileShareMessage, openWhatsApp } from '@/lib/whatsapp';
import LanguageToggle from '@/components/LanguageToggle';
import PhotoGrid from '@/components/PhotoGrid';
import MeasurementsPreview from '@/components/MeasurementsPreview';
import MeasurementsEditor from '@/components/MeasurementsEditor';
import NewOrderFlow from '@/components/NewOrderFlow';
import OrderDetail from '@/components/OrderDetail';
import PhonePrompt from '@/components/PhonePrompt';
import OnboardingFlow from '@/components/OnboardingFlow';
import ReturnScreen from '@/components/ReturnScreen';
import { getStatusLabel } from '@/lib/status';
import {
  WhatsAppIcon, PlusIcon, EditIcon, RulerIcon, ArrowLeftIcon, CameraIcon,
} from '@/components/Icons';

type View = 'home' | 'new-order' | 'order-detail' | 'edit-measurements';
type AppState = 'loading' | 'onboarding' | 'return' | 'app';

const PROFILE_KEY = 'suruwe_profile_id';

export default function OwnerPage() {
  const t = useTranslations();
  const locale = useLocale();

  const [appState, setAppState] = useState<AppState>('loading');

  // Keep sessionStorage in sync so locale switches don't reset guest users to the return screen
  useEffect(() => {
    if (appState === 'app') {
      sessionStorage.setItem('SURUWE_IN_APP', 'true');
    } else if (appState === 'return' || appState === 'onboarding') {
      sessionStorage.removeItem('SURUWE_IN_APP');
    }
  }, [appState]);

  const [view, setView] = useState<View>('home');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [photos, setPhotos] = useState<ProfilePhoto[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [draftOrder, setDraftOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPhonePrompt, setShowPhonePrompt] = useState(false);
  const [showShareSheet, setShowShareSheet] = useState(false);

  // Onboarding state
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [creating, setCreating] = useState(false);
  const [pendingAction, setPendingAction] = useState<'save-measurements' | 'send-order' | null>(null);

  // PIN setup for returning users
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [pinSetupInput, setPinSetupInput] = useState('');
  const [savingPin, setSavingPin] = useState(false);

  // Username setup for existing users with auto-generated slugs
  const [showUsernameSetup, setShowUsernameSetup] = useState(false);
  const [usernameSetupInput, setUsernameSetupInput] = useState('');
  const [usernameSetupError, setUsernameSetupError] = useState('');
  const [savingUsername, setSavingUsername] = useState(false);

  // Onboarding step: 'name' | 'username' | 'pin'
  const [onboardingStep, setOnboardingStep] = useState<'name' | 'username' | 'pin'>('name');
  const [onboardingUsername, setOnboardingUsername] = useState('');
  const [onboardingUsernameError, setOnboardingUsernameError] = useState('');
  const [checkingUsername, setCheckingUsername] = useState(false);

  // Photo upload for guests
  const guestFileRef = useRef<HTMLInputElement>(null);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);

  // ── ROUTING LOGIC (on load) ──
  useEffect(() => {
    const profileId = localStorage.getItem(PROFILE_KEY);
    if (profileId) {
      loadProfile(profileId);
    } else {
      // Check if we were already in the app (e.g. guest browsing, locale switch re-mounted us)
      const inApp = sessionStorage.getItem('SURUWE_IN_APP');
      if (inApp) {
        setAppState('app');
        setLoading(false);
        return;
      }
      const onboardingSeen = localStorage.getItem('ONBOARDING_SEEN');
      if (onboardingSeen) {
        setAppState('return');
        setLoading(false);
      } else {
        setAppState('onboarding');
        setLoading(false);
      }
    }
  }, []);

  const loadProfile = async (profileId?: string) => {
    const id = profileId || localStorage.getItem(PROFILE_KEY);
    if (!id) { setLoading(false); return; }

    const { data: profileData } = await supabase
      .from('profiles').select('*').eq('id', id).single();

    if (!profileData) {
      localStorage.removeItem(PROFILE_KEY);
      setAppState('return');
      setLoading(false);
      return;
    }

    const p = profileData as Profile;
    setProfile(p);

    const { data: photoData } = await supabase
      .from('profile_photos').select('*').eq('profile_id', p.id).order('sort_order', { ascending: true });
    if (photoData) setPhotos(photoData);

    const { data: orderData } = await supabase
      .from('orders').select('*').eq('profile_id', p.id).order('created_at', { ascending: false });
    if (orderData) setOrders(orderData);

    setAppState('app');
    setLoading(false);

    if (!p.pin) { setShowPinSetup(true); }
    if (/^.+-[a-z0-9]{4}$/.test(p.slug)) { setShowUsernameSetup(true); }
  };

  const requestProfile = (action?: 'save-measurements' | 'send-order') => {
    if (action) setPendingAction(action);
    setShowNamePrompt(true);
  };

  const handleOnboardingName = () => {
    if (!nameInput.trim()) return;
    setOnboardingStep('username');
  };

  const handleOnboardingUsername = async () => {
    if (!onboardingUsername.trim() || checkingUsername) return;
    setCheckingUsername(true);
    setOnboardingUsernameError('');

    const username = onboardingUsername.trim().toLowerCase();
    const { data } = await supabase.from('profiles').select('id').eq('slug', username).maybeSingle();

    if (data) {
      setOnboardingUsernameError(t('onboarding.usernameStep.takenError'));
      setCheckingUsername(false);
      return;
    }

    setCheckingUsername(false);
    setOnboardingStep('pin');
  };

  const createProfileFromName = async () => {
    if (!nameInput.trim() || !onboardingUsername.trim() || !pinSetupInput || creating) return;
    if (pinSetupInput.length < 4) return;

    setCreating(true);
    const slug = onboardingUsername.trim().toLowerCase();

    const { data, error } = await supabase.from('profiles').insert({
      slug,
      name: nameInput.trim(),
      pin: pinSetupInput,
      gender: 'male',
      theme: 'dark',
      measurements: {},
      measurement_unit: 'inches',
      style_notes: '',
    }).select().single();

    if (data && !error) {
      const p = data as Profile;
      localStorage.setItem(PROFILE_KEY, p.id);
      setProfile(p);
      setShowNamePrompt(false);
      setNameInput('');
      setOnboardingUsername('');
      setPinSetupInput('');
      setOnboardingStep('name');
      setAppState('app');
    }
    setCreating(false);
  };

  const handleSaveUsername = async () => {
    if (!profile || !usernameSetupInput.trim() || savingUsername) return;
    setSavingUsername(true);
    setUsernameSetupError('');

    const username = usernameSetupInput.trim().toLowerCase();
    const { data: existing } = await supabase.from('profiles').select('id').eq('slug', username).maybeSingle();

    if (existing) {
      setUsernameSetupError(t('usernameSetup.takenError'));
      setSavingUsername(false);
      return;
    }

    await supabase.from('profiles').update({ slug: username }).eq('id', profile.id);
    setProfile({ ...profile, slug: username });
    setShowUsernameSetup(false);
    setSavingUsername(false);
  };

  const handleGuestFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setPendingFiles(Array.from(files));
    if (guestFileRef.current) guestFileRef.current.value = '';
    requestProfile();
  };

  useEffect(() => {
    if (!profile || pendingFiles.length === 0) return;
    const doUpload = async () => {
      const { uploadImage } = await import('@/lib/upload');
      const newPhotos: ProfilePhoto[] = [];
      for (const file of pendingFiles) {
        const url = await uploadImage(file, `profiles/${profile.id}`);
        if (url) {
          const { data } = await supabase.from('profile_photos').insert({
            profile_id: profile.id,
            url,
            sort_order: photos.length + newPhotos.length,
          }).select().single();
          if (data) newPhotos.push(data);
        }
      }
      if (newPhotos.length > 0) {
        setPhotos((prev) => [...prev, ...newPhotos]);
      }
      setPendingFiles([]);
    };
    doUpload();
  }, [profile, pendingFiles]);

  const handleSavePin = async () => {
    if (!profile || !pinSetupInput.trim() || savingPin) return;
    if (pinSetupInput.length < 4 || pinSetupInput.length > 6) return;
    setSavingPin(true);
    await supabase.from('profiles').update({ pin: pinSetupInput }).eq('id', profile!.id);
    setProfile({ ...profile, pin: pinSetupInput });
    setShowPinSetup(false);
    setSavingPin(false);
  };

  const handleSignOut = () => {
    localStorage.removeItem(PROFILE_KEY);
    setProfile(null);
    setPhotos([]);
    setOrders([]);
    setSelectedOrder(null);
    setDraftOrder(null);
    setAppState('return');
  };

  const handleShareProfile = () => {
    if (!profile) return;
    if (!profile!.phone) { setShowPhonePrompt(true); return; }
    doShare();
  };

  const doShare = () => {
    if (!profile) return;
    const message = generateProfileShareMessage(profile, locale);
    openWhatsApp(message);
  };

  const handlePhoneSubmit = async (phone: string) => {
    if (!profile) return;
    await supabase.from('profiles').update({ phone }).eq('id', profile!.id);
    setProfile({ ...profile, phone });
    setShowPhonePrompt(false);
    doShare();
  };

  const handlePhoneSkip = () => {
    setShowPhonePrompt(false);
    doShare();
  };

  const shareSuruwe = () => { setShowShareSheet(true); };

  const confirmShareSuruwe = () => {
    const text = t('shareSuruwe.message');
    if (navigator.share) {
      navigator.share({ title: t('nav.logo'), text, url: 'https://suruwe.vercel.app' }).catch(() => {});
    } else {
      openWhatsApp(`${text}\n\nhttps://suruwe.vercel.app`);
    }
    setShowShareSheet(false);
  };

  const handleOrderCreated = (order: Order) => {
    if (draftOrder) {
      setOrders([order, ...orders.filter((o) => o.id !== draftOrder.id)]);
      setDraftOrder(null);
    } else {
      setOrders([order, ...orders]);
    }
    setView('home');
  };

  const handleDraftSaved = (draft: Order) => {
    const exists = orders.find((o) => o.id === draft.id);
    if (exists) {
      setOrders(orders.map((o) => (o.id === draft.id ? draft : o)));
    } else {
      setOrders([draft, ...orders]);
    }
    setDraftOrder(null);
  };

  const handleDeleteOrder = async (orderId: string) => {
    await supabase.from('order_attachments').delete().eq('order_id', orderId);
    await supabase.from('orders').delete().eq('id', orderId);
    setOrders(orders.filter((o) => o.id !== orderId));
    if (selectedOrder?.id === orderId) {
      setSelectedOrder(null);
      setView('home');
    }
  };

  const handleProfileUpdate = (updated: Profile) => { setProfile(updated); };

  const handleSaveMeasurements = async (
    measurements: Record<string, number>,
    gender: 'male' | 'female',
    unit: 'inches' | 'cm',
    notes: string = ''
  ) => {
    if (!profile) return;
    const { data } = await supabase.from('profiles').update({
      measurements, gender, measurement_unit: unit, measurement_notes: notes,
      measurements_updated_at: new Date().toISOString(),
    }).eq('id', profile!.id).select().single();
    if (data) { setProfile(data as Profile); }
    setView('home');
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('dashboard.greeting.morning');
    if (hour < 17) return t('dashboard.greeting.afternoon');
    return t('dashboard.greeting.evening');
  };

  // ── Modals (rendered from every view via renderModals) ──
  const renderModals = () => (
    <>
      {showPinSetup && profile && (
        <div className="modal-overlay">
          <div className="modal">
            <div style={{
              fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600,
              letterSpacing: '0.2em', textTransform: 'uppercase' as const,
              color: 'var(--gold)', marginBottom: 14, opacity: 0.8,
            }}>
              {t('profileCreation.security')}
            </div>
            <h3 style={{ marginBottom: 8, fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 300, color: 'var(--cream)' }}>
              {t('pinSetup.title')}
            </h3>
            <p style={{ fontSize: 14, fontWeight: 300, color: 'var(--muted-d)', lineHeight: 1.6, marginBottom: 24 }}>
              {t('pinSetup.subtitle')}
            </p>
            <label className="field-label">{t('profileCreation.pinLabel')}</label>
            <input
              className="input-dark" type="number" inputMode="numeric"
              placeholder={t('pinSetup.placeholder')} value={pinSetupInput}
              onChange={(e) => { const val = e.target.value.replace(/\D/g, '').slice(0, 6); setPinSetupInput(val); }}
              onKeyDown={(e) => e.key === 'Enter' && handleSavePin()} autoFocus
            />
            <button className="btn-gold" onClick={handleSavePin} disabled={pinSetupInput.length < 4 || savingPin} style={{ marginTop: 20 }}>
              <span>{savingPin ? t('common.saving') : t('pinSetup.saveButton')}</span>
              <span>&rarr;</span>
            </button>
          </div>
        </div>
      )}

      {showUsernameSetup && profile && (
        <div className="modal-overlay">
          <div className="modal">
            <div style={{
              fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600,
              letterSpacing: '0.2em', textTransform: 'uppercase' as const,
              color: 'var(--gold)', marginBottom: 14, opacity: 0.8,
            }}>
              {t('profileCreation.yourIdentity')}
            </div>
            <h3 style={{ marginBottom: 8, fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 300, color: 'var(--cream)' }}>
              {t('usernameSetup.title')}
            </h3>
            <p style={{ fontSize: 14, fontWeight: 300, color: 'var(--muted-d)', lineHeight: 1.6, marginBottom: 24 }}>
              {t('usernameSetup.subtitle')}
            </p>
            <label className="field-label">{t('profileCreation.usernameLabel')}</label>
            <input
              className="input-dark" type="text"
              placeholder={t('usernameSetup.placeholder')} value={usernameSetupInput}
              onChange={(e) => { setUsernameSetupInput(e.target.value); setUsernameSetupError(''); }}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveUsername()} autoFocus
            />
            {usernameSetupError && (
              <p style={{ color: 'var(--terra)', fontSize: 13, marginTop: 8 }}>{usernameSetupError}</p>
            )}
            <button className="btn-gold" onClick={handleSaveUsername} disabled={!usernameSetupInput.trim() || savingUsername} style={{ marginTop: 20 }}>
              <span>{savingUsername ? t('common.saving') : t('usernameSetup.saveButton')}</span>
              <span>&rarr;</span>
            </button>
          </div>
        </div>
      )}

      {showNamePrompt && (
        <div className="modal-overlay" onClick={() => { setShowNamePrompt(false); setPendingAction(null); setOnboardingStep('name'); }}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            {onboardingStep === 'name' && (
              <>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase' as const, color: 'var(--gold)', marginBottom: 14, opacity: 0.8 }}>
                  {t('profileCreation.stepOf', { step: 1, total: 3 })}
                </div>
                <h3 style={{ marginBottom: 8, fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 300, color: 'var(--cream)' }}>
                  {t('onboarding.nameStep.title')}
                </h3>
                <p style={{ fontSize: 14, fontWeight: 300, color: 'var(--muted-d)', lineHeight: 1.6, marginBottom: 24 }}>
                  {t('onboarding.nameStep.subtitle')}
                </p>
                <label className="field-label">{t('profileCreation.nameLabel')}</label>
                <input className="input-dark" type="text" placeholder={t('onboarding.nameStep.placeholder')} value={nameInput} onChange={(e) => setNameInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleOnboardingName()} autoFocus />
                <button className="btn-gold" onClick={handleOnboardingName} disabled={!nameInput.trim()} style={{ marginTop: 20 }}>
                  <span>{t('onboarding.nameStep.continue')}</span><span>&rarr;</span>
                </button>
              </>
            )}
            {onboardingStep === 'username' && (
              <>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase' as const, color: 'var(--gold)', marginBottom: 14, opacity: 0.8 }}>
                  {t('profileCreation.stepOf', { step: 2, total: 3 })}
                </div>
                <h3 style={{ marginBottom: 8, fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 300, color: 'var(--cream)' }}>
                  {t('onboarding.usernameStep.title')}
                </h3>
                <p style={{ fontSize: 14, fontWeight: 300, color: 'var(--muted-d)', lineHeight: 1.6, marginBottom: 24 }}>
                  {t('onboarding.usernameStep.subtitle')}
                </p>
                <label className="field-label">{t('profileCreation.usernameLabel')}</label>
                <input className="input-dark" type="text" placeholder={t('onboarding.usernameStep.placeholder')} value={onboardingUsername} onChange={(e) => { setOnboardingUsername(e.target.value); setOnboardingUsernameError(''); }} onKeyDown={(e) => e.key === 'Enter' && handleOnboardingUsername()} autoFocus />
                {onboardingUsernameError && (
                  <p style={{ color: 'var(--terra)', fontSize: 13, marginTop: 8 }}>{onboardingUsernameError}</p>
                )}
                <button className="btn-gold" onClick={handleOnboardingUsername} disabled={!onboardingUsername.trim() || checkingUsername} style={{ marginTop: 20 }}>
                  <span>{checkingUsername ? t('common.checking') : t('onboarding.usernameStep.continue')}</span><span>&rarr;</span>
                </button>
              </>
            )}
            {onboardingStep === 'pin' && (
              <>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase' as const, color: 'var(--gold)', marginBottom: 14, opacity: 0.8 }}>
                  {t('profileCreation.stepOf', { step: 3, total: 3 })}
                </div>
                <h3 style={{ marginBottom: 8, fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 300, color: 'var(--cream)' }}>
                  {t('onboarding.pinStep.title')}
                </h3>
                <p style={{ fontSize: 14, fontWeight: 300, color: 'var(--muted-d)', lineHeight: 1.6, marginBottom: 24 }}>
                  {t('onboarding.pinStep.subtitle')}
                </p>
                <label className="field-label">{t('profileCreation.pinLabel')}</label>
                <input className="input-dark" type="number" inputMode="numeric" placeholder={t('onboarding.pinStep.placeholder')} value={pinSetupInput} onChange={(e) => { const val = e.target.value.replace(/\D/g, '').slice(0, 6); setPinSetupInput(val); }} onKeyDown={(e) => e.key === 'Enter' && createProfileFromName()} autoFocus />
                <button className="btn-gold" onClick={createProfileFromName} disabled={pinSetupInput.length < 4 || creating} style={{ marginTop: 20 }}>
                  <span>{creating ? t('common.creating') : t('onboarding.pinStep.createProfile')}</span><span>&rarr;</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {showPhonePrompt && <PhonePrompt onSubmit={handlePhoneSubmit} onSkip={handlePhoneSkip} />}

      {showShareSheet && (
        <div className="modal-overlay" onClick={() => setShowShareSheet(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginBottom: 6, fontSize: 18, fontFamily: 'var(--font-display)', fontWeight: 300, color: 'var(--cream)' }}>
              {t('shareSuruwe.heading')}
            </h3>
            <p style={{ fontSize: 18, fontFamily: 'var(--font-display)', fontWeight: 300, fontStyle: 'italic', color: 'var(--gold)', marginBottom: 20 }}>
              {t('shareSuruwe.subheading')}
            </p>
            <div className="wa-preview" style={{ marginBottom: 24 }}>
              {t('shareSuruwe.message')}{'\n\n'}https://suruwe.vercel.app
            </div>
            <button className="btn-gold" onClick={confirmShareSuruwe} style={{ marginBottom: 8 }}>
              <span>{t('shareSuruwe.shareButton')}</span><span>&rarr;</span>
            </button>
            <button className="btn-ghost" onClick={() => setShowShareSheet(false)} style={{ display: 'block', width: '100%', textAlign: 'center', color: 'var(--muted-d)', marginTop: 8 }}>
              {t('common.notNow')}
            </button>
          </div>
        </div>
      )}
    </>
  );

  // ── RENDER ──

  if (loading || appState === 'loading') {
    return <div className="loading"><div className="spinner" /></div>;
  }

  if (appState === 'onboarding') {
    return (
      <OnboardingFlow
        onComplete={() => {
          // No prompt - user lands on dashboard freely
          setAppState('app');
        }}
        onAlreadyHaveProfile={() => setAppState('return')}
      />
    );
  }

  if (appState === 'return') {
    return (
      <ReturnScreen
        onSignedIn={(p, ph, ord) => {
          setProfile(p);
          setPhotos(ph);
          setOrders(ord);
          setAppState('app');
          if (!p.pin) setShowPinSetup(true);
          if (/^.+-[a-z0-9]{4}$/.test(p.slug)) setShowUsernameSetup(true);
        }}
        onNewUser={() => setAppState('onboarding')}
      />
    );
  }

  // ── NEW ORDER FLOW (owns its own layout) ──
  if (view === 'new-order') {
    return (
      <>
      <NewOrderFlow
        profile={profile}
        hasPhotos={photos.length > 0}
        onClose={() => { setDraftOrder(null); setView('home'); }}
        onOrderCreated={handleOrderCreated}
        onDraftSaved={handleDraftSaved}
        onProfileUpdate={handleProfileUpdate}
        requestProfile={requestProfile}
        pendingAction={pendingAction}
        onActionConsumed={() => setPendingAction(null)}
        draftOrder={draftOrder}
      />
      {renderModals()}
      </>
    );
  }

  // Order Detail
  if (view === 'order-detail' && selectedOrder && profile) {
    return (
      <>
      <OrderDetail
        order={selectedOrder}
        profile={profile}
        onBack={() => { setSelectedOrder(null); setView('home'); }}
        onOrderUpdate={(updated) => {
          setOrders(orders.map((o) => (o.id === updated.id ? updated : o)));
          setSelectedOrder(updated);
        }}
        onDelete={() => handleDeleteOrder(selectedOrder.id)}
      />
      {renderModals()}
      </>
    );
  }

  // ── EDIT MEASUREMENTS (charcoal header + cream body) ──
  if (view === 'edit-measurements') {
    return (
      <>
      <div style={{ background: 'var(--cream)', minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ background: 'var(--charcoal)', padding: '44px 24px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <button
              onClick={() => setView('home')}
              style={{
                width: 32, height: 32, borderRadius: '50%',
                background: 'rgba(255,255,255,0.06)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: 'none', cursor: 'pointer', color: 'var(--muted-d)', fontSize: 14,
              }}
            >&larr;</button>
            <span className="wordmark" style={{ fontSize: 10, letterSpacing: '0.22em' }}>
              {t('dashboard.yourProfile')}
            </span>
          </div>
          <h2 style={{
            fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 300,
            color: 'var(--cream)', lineHeight: 1.1,
          }}>
            {locale === 'fr' ? 'Tes ' : 'Your '}
            <span style={{ color: 'var(--gold-pale)' }}>{locale === 'fr' ? 'mensurations.' : 'measurements.'}</span>
          </h2>
        </div>
        <div style={{ padding: '20px 22px', flex: 1 }}>
          <MeasurementsEditorWrapper
            profile={profile}
            requestProfile={() => requestProfile('save-measurements')}
            pendingAction={pendingAction}
            onActionConsumed={() => setPendingAction(null)}
            onSave={handleSaveMeasurements}
          />
        </div>
      </div>
      {renderModals()}
      </>
    );
  }

  // ── DASHBOARD ──
  const hasMeasurements = profile?.measurements && Object.keys(profile.measurements).length > 0;
  const hasPhotos = photos.length > 0;
  const profileReady = hasMeasurements && hasPhotos;
  const isGuest = !profile;
  const measurementCount = profile?.measurements ? Object.keys(profile.measurements).length : 0;
  const activeOrders = orders.filter(o => o.status !== 'draft');

  return (
    <div className="app-shell" style={{ background: 'var(--cream)' }}>
      {/* ── CHARCOAL HEADER ── */}
      <div style={{
        background: 'var(--charcoal)', padding: '44px 24px 24px',
        position: 'relative', overflow: 'hidden',
        marginLeft: -20, marginRight: -20, paddingLeft: 24, paddingRight: 24,
      }}>
        <div className="ghost-letter" style={{ top: -24, right: -12, fontSize: 110 }}>S</div>

        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 20, position: 'relative', zIndex: 2,
        }}>
          <span className="wordmark">Suruwe</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={shareSuruwe}
              title={t('home.shareSuruwe')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-d)', padding: 4 }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                <polyline points="16 6 12 2 8 6" />
                <line x1="12" y1="2" x2="12" y2="15" />
              </svg>
            </button>
            <LanguageToggle variant="pill" />
            {profile && (
              <button
                onClick={handleSignOut}
                title={t('common.signOut')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-d)', padding: 4 }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </button>
            )}
            {profile && (
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: 'var(--charcoal-2)', border: '1px solid var(--gold-bdr)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 500, color: 'var(--gold-pale)', fontFamily: 'var(--font-body)',
              }}>
                {profile.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>
        </div>

        <div style={{ position: 'relative', zIndex: 2 }}>
          {isGuest ? (
            <>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 300, color: 'var(--cream)', lineHeight: 1.1 }}>
                {getGreeting()}.
              </h1>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 300, color: 'var(--muted-d)', marginTop: 5 }}>
                {t('dashboard.guestSubtitle')}
              </p>
            </>
          ) : (
            <>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 300, color: 'var(--cream)', lineHeight: 1.1 }}>
                {getGreeting()},{' '}
                <span style={{ color: 'var(--gold-pale)' }}>{profile.name.split(' ')[0]}.</span>
              </div>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 300, color: 'var(--muted-d)', marginTop: 5 }}>
                {activeOrders.length === 0
                  ? t('dashboard.noOrders')
                  : activeOrders.length === 1
                  ? t('dashboard.activeOrdersSimple', { count: 1 })
                  : t('dashboard.activeOrdersPlural', { count: activeOrders.length })}
              </p>
            </>
          )}
        </div>
      </div>

      {/* ── CREAM BODY ── */}
      <div style={{ padding: '20px 20px 32px' }}>
        {/* New Order CTA */}
        <div
          onClick={() => { setDraftOrder(null); setView('new-order'); }}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '16px 20px', background: 'var(--charcoal)', borderRadius: 12,
            marginBottom: 24, cursor: 'pointer',
          }}
        >
          <div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600, color: 'var(--cream)' }}>
              {t('dashboard.newOrder')}
            </div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 300, color: 'var(--muted-d)', marginTop: 2 }}>
              {t('dashboard.newOrderSub')}
            </div>
          </div>
          <div style={{
            width: 36, height: 36, borderRadius: '50%', background: 'var(--gold)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, color: 'var(--charcoal)', flexShrink: 0,
          }}>+</div>
        </div>

        {/* Profile Section */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span className="field-label-cream" style={{ margin: 0 }}>{t('dashboard.yourProfile')}</span>
            <button
              onClick={() => setView('edit-measurements')}
              style={{
                fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 500,
                color: 'var(--gold)', background: 'none', border: 'none', cursor: 'pointer',
              }}
            >{t('common.edit')}</button>
          </div>
          {profile ? (
            <div style={{
              background: 'white', border: '0.5px solid rgba(20,16,12,0.08)',
              borderRadius: 12, padding: '14px 16px',
              display: 'flex', alignItems: 'center', gap: 14,
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: 8, background: 'var(--cream-3)',
                overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {hasPhotos ? (
                  <img src={photos[0].url} alt="" style={{ width: 44, height: 44, objectFit: 'cover' }} />
                ) : (
                  <svg viewBox="0 0 44 44" fill="none" width="44" height="44">
                    <rect width="44" height="44" fill="#e8dfd0" />
                    <circle cx="22" cy="17" r="8" fill="#b8924a" opacity="0.4" />
                    <ellipse cx="22" cy="36" rx="14" ry="9" fill="#b8924a" opacity="0.3" />
                  </svg>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>{profile.name}</div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 300, color: 'var(--ink-soft)', marginTop: 2 }}>
                  {measurementCount > 0 ? t('dashboard.measurementCount', { count: measurementCount }) : t('dashboard.noMeasurements')}
                  {hasPhotos ? ` \u00B7 ${t('dashboard.bodyPhotoSaved')}` : ''}
                </div>
              </div>
              <div style={{
                background: profileReady ? 'var(--forest-bg)' : 'var(--gold-dim)',
                border: profileReady ? '0.5px solid rgba(45,90,61,0.15)' : '0.5px solid var(--gold-bdr)',
                borderRadius: 20, padding: '4px 10px',
                fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 600,
                color: profileReady ? 'var(--forest)' : 'var(--gold)',
                letterSpacing: '0.04em', flexShrink: 0,
              }}>
                {profileReady ? t('dashboard.profileReady') : t('dashboard.profileIncomplete')}
              </div>
            </div>
          ) : (
            <div style={{
              background: 'white', border: '0.5px solid rgba(20,16,12,0.08)',
              borderRadius: 12, padding: '20px 16px', textAlign: 'center',
              fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--ink-soft)',
            }}>
              {t('nudge.guest')}
            </div>
          )}
        </div>

        {/* Orders Section */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span className="field-label-cream" style={{ margin: 0 }}>{t('dashboard.ordersSection')}</span>
            {orders.length > 3 && (
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 500, color: 'var(--gold)' }}>
                {t('dashboard.ordersAll')}
              </span>
            )}
          </div>
          {orders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 16px', fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.6 }}>
              {t('orders.empty')}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {orders.map((order) => (
                <SwipeableOrderCard
                  key={order.id}
                  order={order}
                  onTap={() => {
                    if (order.status === 'draft') {
                      setDraftOrder(order);
                      setView('new-order');
                    } else {
                      setSelectedOrder(order);
                      setView('order-detail');
                    }
                  }}
                  onDelete={() => handleDeleteOrder(order.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Feedback link */}
        <div style={{ textAlign: 'center', marginTop: 32, marginBottom: 8 }}>
          <a
            href="https://wa.me/14704437293?text=Hey%2C%20I%20just%20tried%20Suruwe%20and..."
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: 13, color: 'var(--ink-soft)', textDecoration: 'none',
              display: 'inline-flex', alignItems: 'center', gap: 6, opacity: 0.5,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" opacity="0.5">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.125.553 4.12 1.522 5.857L0 24l6.335-1.652A11.95 11.95 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75c-1.875 0-3.63-.5-5.14-1.377l-.368-.22-3.813.999 1.016-3.713-.24-.382A9.71 9.71 0 012.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75z"/>
            </svg>
            {t('home.feedback')}
          </a>
        </div>
        <div style={{ height: 40 }} />
      </div>

      {/* ── MODALS (rendered via renderModals for all views) ── */}
      {renderModals()}
    </div>
  );
}

// ── Swipeable order card ──
function SwipeableOrderCard({ order, onTap, onDelete }: { order: Order; onTap: () => void; onDelete: () => void }) {
  const t = useTranslations();
  const [offsetX, setOffsetX] = useState(0);
  const [startX, setStartX] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const deleteThreshold = -80;

  const handleTouchStart = (e: React.TouchEvent) => { setStartX(e.touches[0].clientX); setSwiping(true); };
  const handleTouchMove = (e: React.TouchEvent) => { if (!swiping) return; const diff = e.touches[0].clientX - startX; if (diff < 0) setOffsetX(Math.max(diff, -120)); };
  const handleTouchEnd = () => { setSwiping(false); if (offsetX < deleteThreshold) setOffsetX(-120); else setOffsetX(0); };
  const confirmDelete = async () => { setDeleting(true); await onDelete(); };

  const dotColor = order.status === 'draft' ? 'var(--cream-3)' : order.status === 'sent' ? 'var(--gold)' : 'var(--forest)';
  const statusText = order.status === 'draft'
    ? t('dashboard.orderDraft')
    : order.status === 'sent'
    ? t('dashboard.orderSentAwaiting')
    : getStatusLabel(order.status, t);

  if (showConfirm) {
    return (
      <div style={{ background: 'white', border: '0.5px solid rgba(20,16,12,0.07)', borderRadius: 12, padding: 16, textAlign: 'center' }}>
        <p style={{ fontSize: 14, marginBottom: 12, color: 'var(--ink-soft)' }}>{t('orderCard.deleteConfirm')}</p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
          <button onClick={() => setShowConfirm(false)} style={{
            padding: '8px 20px', fontSize: 13, fontFamily: 'var(--font-body)',
            background: 'var(--cream-2)', border: 'none', borderRadius: 6, color: 'var(--ink)', cursor: 'pointer',
          }}>{t('orderCard.deleteCancel')}</button>
          <button onClick={confirmDelete} disabled={deleting} style={{
            padding: '8px 20px', fontSize: 13, fontFamily: 'var(--font-body)',
            background: 'var(--terra)', border: 'none', borderRadius: 6, color: 'white', cursor: 'pointer',
          }}>{deleting ? t('common.deleting') : t('orderCard.deleteConfirmButton')}</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 12 }}>
      <div style={{
        position: 'absolute', right: 0, top: 0, bottom: 0, width: 120,
        background: 'var(--terra)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 12,
      }}>
        <button onClick={() => setShowConfirm(true)} style={{
          background: 'none', border: 'none', color: '#fff', fontSize: 13,
          fontWeight: 600, cursor: 'pointer', padding: '8px 16px', fontFamily: 'inherit',
        }}>{t('common.delete')}</button>
      </div>
      <div
        onClick={() => { if (offsetX === 0) onTap(); else setOffsetX(0); }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: `translateX(${offsetX}px)`,
          transition: swiping ? 'none' : 'transform 0.2s ease',
          position: 'relative', zIndex: 1,
          background: 'white', border: '0.5px solid rgba(20,16,12,0.07)',
          borderRadius: 12, padding: '14px 16px',
          display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer',
        }}
      >
        <div style={{
          width: 6, height: 6, borderRadius: '50%', marginTop: 5, flexShrink: 0,
          background: dotColor,
          border: order.status === 'draft' ? '1px solid var(--cream-3)' : 'none',
        }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, color: 'var(--ink)', marginBottom: 3 }}>
            {order.description || t('dashboard.untitledOrder')}
          </div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 300, color: 'var(--ink-soft)' }}>{statusText}</div>
        </div>
        <span style={{ color: 'var(--cream-3)', fontSize: 14, flexShrink: 0, paddingTop: 1 }}>&rsaquo;</span>
      </div>
    </div>
  );
}

// ── Measurements editor wrapper ──
function MeasurementsEditorWrapper({ profile, requestProfile, pendingAction, onActionConsumed, onSave }: {
  profile: Profile | null;
  requestProfile: () => void;
  pendingAction: 'save-measurements' | 'send-order' | null;
  onActionConsumed: () => void;
  onSave: (m: Record<string, number>, g: 'male' | 'female', u: 'inches' | 'cm', notes: string) => void;
}) {
  const [measurements, setMeasurements] = useState(profile?.measurements || {});
  const [gender, setGender] = useState<'male' | 'female'>(profile?.gender || 'male');
  const [unit, setUnit] = useState<'inches' | 'cm'>(profile?.measurement_unit || 'inches');
  const [measurementNotes, setMeasurementNotes] = useState(profile?.measurement_notes || '');
  const [saving, setSaving] = useState(false);

  const doSave = async () => {
    setSaving(true);
    await onSave(measurements, gender, unit, measurementNotes);
    setSaving(false);
  };

  const handleSave = () => {
    if (!profile) { requestProfile(); return; }
    doSave();
  };

  useEffect(() => {
    if (profile && pendingAction === 'save-measurements') {
      onActionConsumed();
      setSaving(true);
      const doReplay = async () => {
        await onSave(measurements, gender, unit, measurementNotes);
        setSaving(false);
      };
      doReplay();
    }
  }, [profile, pendingAction]);

  return (
    <MeasurementsEditor
      gender={gender}
      unit={unit}
      measurements={measurements}
      measurementNotes={measurementNotes}
      onGenderChange={setGender}
      onUnitChange={setUnit}
      onMeasurementsChange={setMeasurements}
      onNotesChange={setMeasurementNotes}
      onSave={handleSave}
      saving={saving}
    />
  );
}
