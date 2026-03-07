'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Profile, Order, ProfilePhoto } from '@/types';
import { supabase } from '@/lib/supabase';
import { applyTheme, Theme } from '@/lib/theme';
import { generateSlug, formatDate } from '@/lib/utils';
import { generateProfileShareMessage, openWhatsApp } from '@/lib/whatsapp';
import ThemeToggle from '@/components/ThemeToggle';
import PhotoGrid from '@/components/PhotoGrid';
import MeasurementsPreview from '@/components/MeasurementsPreview';
import MeasurementsEditor from '@/components/MeasurementsEditor';
import NewOrderFlow from '@/components/NewOrderFlow';
import OrderDetail from '@/components/OrderDetail';
import PhonePrompt from '@/components/PhonePrompt';
import {
  WhatsAppIcon,
  PlusIcon,
  EditIcon,
  RulerIcon,
  ArrowLeftIcon,
  CameraIcon,
} from '@/components/Icons';

type View = 'home' | 'new-order' | 'order-detail' | 'edit-measurements';

const PROFILE_KEY = 'suruwe_profile_id';

export default function OwnerPage() {
  const [view, setView] = useState<View>('home');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [photos, setPhotos] = useState<ProfilePhoto[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [draftOrder, setDraftOrder] = useState<Order | null>(null);
  const [theme, setTheme] = useState<Theme>('dark');
  const [loading, setLoading] = useState(true);
  const [showPhonePrompt, setShowPhonePrompt] = useState(false);
  const [showShareSheet, setShowShareSheet] = useState(false);

  // Name prompt state
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [creating, setCreating] = useState(false);
  const [pendingAction, setPendingAction] = useState<'save-measurements' | 'send-order' | null>(null);

  // Recovery state
  const [showRecovery, setShowRecovery] = useState(false);
  const [recoveryUsername, setRecoveryUsername] = useState('');
  const [recoveryPin, setRecoveryPin] = useState('');
  const [recoveryError, setRecoveryError] = useState('');
  const [recovering, setRecovering] = useState(false);

  // PIN prompt for returning users
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

  // Photo upload for guests: hold selected files until profile exists
  const guestFileRef = useRef<HTMLInputElement>(null);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const loadProfile = async () => {
    const profileId = localStorage.getItem(PROFILE_KEY);
    if (!profileId) {
      setLoading(false);
      return;
    }

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', profileId)
      .single();

    if (!profileData) {
      localStorage.removeItem(PROFILE_KEY);
      setLoading(false);
      return;
    }

    const p = profileData as Profile;
    setProfile(p);
    setTheme(p.theme as Theme);

    const { data: photoData } = await supabase
      .from('profile_photos')
      .select('*')
      .eq('profile_id', p.id)
      .order('sort_order', { ascending: true });
    if (photoData) setPhotos(photoData);

    const { data: orderData } = await supabase
      .from('orders')
      .select('*')
      .eq('profile_id', p.id)
      .order('created_at', { ascending: false });
    if (orderData) setOrders(orderData);

    setLoading(false);

    if (!p.pin) {
      setShowPinSetup(true);
    }
    // Auto-generated slugs match pattern: word-4chars (e.g. ama-4kx2)
    if (/^.+-[a-z0-9]{4}$/.test(p.slug)) {
      setShowUsernameSetup(true);
    }
  };

  // Show name prompt when a save/send action needs a profile
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
    const { data } = await supabase
      .from('profiles')
      .select('id')
      .eq('slug', username)
      .maybeSingle();

    if (data) {
      setOnboardingUsernameError('That username is taken. Please try another.');
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
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        slug,
        name: nameInput.trim(),
        pin: pinSetupInput,
        gender: 'male',
        theme: theme,
        measurements: {},
        measurement_unit: 'inches',
        style_notes: '',
      })
      .select()
      .single();

    if (data && !error) {
      const p = data as Profile;
      localStorage.setItem(PROFILE_KEY, p.id);
      setProfile(p);
      setShowNamePrompt(false);
      setNameInput('');
      setOnboardingUsername('');
      setPinSetupInput('');
      setOnboardingStep('name');
      // pendingAction stays set - useEffect in child components will pick it up
    }
    setCreating(false);
  };

  const handleSaveUsername = async () => {
    if (!profile || !usernameSetupInput.trim() || savingUsername) return;
    setSavingUsername(true);
    setUsernameSetupError('');

    const username = usernameSetupInput.trim().toLowerCase();
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('slug', username)
      .maybeSingle();

    if (existing) {
      setUsernameSetupError('That username is taken. Please try another.');
      setSavingUsername(false);
      return;
    }

    await supabase.from('profiles').update({ slug: username }).eq('id', profile.id);
    setProfile({ ...profile, slug: username });
    setShowUsernameSetup(false);
    setSavingUsername(false);
  };

  // Guest photo flow: store files, ask for name, upload after profile exists
  const handleGuestFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setPendingFiles(Array.from(files));
    if (guestFileRef.current) guestFileRef.current.value = '';
    requestProfile();
  };

  // Upload pending photos once profile exists
  useEffect(() => {
    if (!profile || pendingFiles.length === 0) return;
    const doUpload = async () => {
      const { uploadImage } = await import('@/lib/upload');
      const newPhotos: ProfilePhoto[] = [];
      for (const file of pendingFiles) {
        const url = await uploadImage(file, `profiles/${profile.id}`);
        if (url) {
          const { data } = await supabase
            .from('profile_photos')
            .insert({
              profile_id: profile.id,
              url,
              sort_order: photos.length + newPhotos.length,
            })
            .select()
            .single();
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

  const handleRecovery = async () => {
    if (!recoveryUsername.trim() || !recoveryPin.trim() || recovering) return;
    setRecovering(true);
    setRecoveryError('');

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('slug', recoveryUsername.trim().toLowerCase())
      .eq('pin', recoveryPin)
      .single();

    if (data) {
      const p = data as Profile;
      localStorage.setItem(PROFILE_KEY, p.id);
      setProfile(p);
      setTheme(p.theme as Theme);

      const { data: photoData } = await supabase
        .from('profile_photos')
        .select('*')
        .eq('profile_id', p.id)
        .order('sort_order', { ascending: true });
      if (photoData) setPhotos(photoData);

      const { data: orderData } = await supabase
        .from('orders')
        .select('*')
        .eq('profile_id', p.id)
        .order('created_at', { ascending: false });
      if (orderData) setOrders(orderData);

      setShowRecovery(false);
    } else {
      setRecoveryError('No profile found with that username and PIN. Please check and try again.');
    }
    setRecovering(false);
  };

  const handleSavePin = async () => {
    if (!profile || !pinSetupInput.trim() || savingPin) return;
    if (pinSetupInput.length < 4 || pinSetupInput.length > 6) return;
    setSavingPin(true);
    await supabase.from('profiles').update({ pin: pinSetupInput }).eq('id', profile!.id);
    setProfile({ ...profile, pin: pinSetupInput });
    setShowPinSetup(false);
    setSavingPin(false);
  };

  const toggleTheme = async () => {
    const newTheme: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    if (profile) {
      await supabase.from('profiles').update({ theme: newTheme }).eq('id', profile!.id);
      setProfile({ ...profile, theme: newTheme });
    }
  };

  const handleShareProfile = () => {
    if (!profile) return;
    if (!profile!.phone) {
      setShowPhonePrompt(true);
      return;
    }
    doShare();
  };

  const doShare = () => {
    if (!profile) return;
    const message = generateProfileShareMessage(profile);
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

  const shareSuruwe = () => {
    setShowShareSheet(true);
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
    setShowShareSheet(false);
  };

  const handleOrderCreated = (order: Order) => {
    // If this was a draft being sent, replace it in the list
    if (draftOrder) {
      setOrders([order, ...orders.filter((o) => o.id !== draftOrder.id)]);
      setDraftOrder(null);
    } else {
      setOrders([order, ...orders]);
    }
    setView('home');
  };

  const handleDraftSaved = (draft: Order) => {
    // Add or update draft in orders list
    const exists = orders.find((o) => o.id === draft.id);
    if (exists) {
      setOrders(orders.map((o) => (o.id === draft.id ? draft : o)));
    } else {
      setOrders([draft, ...orders]);
    }
    setDraftOrder(null);
  };

  const handleDeleteOrder = async (orderId: string) => {
    // Delete attachments first, then order
    await supabase.from('order_attachments').delete().eq('order_id', orderId);
    await supabase.from('orders').delete().eq('id', orderId);
    setOrders(orders.filter((o) => o.id !== orderId));
    if (selectedOrder?.id === orderId) {
      setSelectedOrder(null);
      setView('home');
    }
  };

  const handleProfileUpdate = (updated: Profile) => {
    setProfile(updated);
  };

  const handleSaveMeasurements = async (
    measurements: Record<string, number>,
    gender: 'male' | 'female',
    unit: 'inches' | 'cm',
    notes: string = ''
  ) => {
    if (!profile) return;
    const { data } = await supabase
      .from('profiles')
      .update({
        measurements,
        gender,
        measurement_unit: unit,
        measurement_notes: notes,
        measurements_updated_at: new Date().toISOString(),
      })
      .eq('id', profile!.id)
      .select()
      .single();
    if (data) {
      setProfile(data as Profile);
    }
    setView('home');
  };

  // -------------------------------------------------------
  // Render
  // -------------------------------------------------------

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner" />
      </div>
    );
  }

  // Recovery flow
  if (showRecovery) {
    return (
      <div className="onboarding">
        <div className="onboarding-logo">Suruwe</div>
        <div className="onboarding-tagline" style={{ marginBottom: 4 }}>
          What you ordered is what you get.
        </div>
        <p className="text-secondary" style={{ fontSize: 14, marginBottom: 20 }}>
          Enter your username and PIN to access your profile on this device.
        </p>
        <input
          className="onboarding-input"
          type="text"
          placeholder="Your username"
          value={recoveryUsername}
          onChange={(e) => setRecoveryUsername(e.target.value)}
          autoFocus
        />
        <input
          className="onboarding-input"
          type="number"
          inputMode="numeric"
          placeholder="Your PIN"
          value={recoveryPin}
          onChange={(e) => {
            const val = e.target.value.replace(/\D/g, '').slice(0, 6);
            setRecoveryPin(val);
          }}
          style={{ marginTop: 12 }}
        />
        {recoveryError && (
          <p style={{ color: '#e74c3c', fontSize: 14, marginTop: 8, textAlign: 'center' }}>
            {recoveryError}
          </p>
        )}
        <button
          className="btn btn-primary onboarding-btn"
          onClick={handleRecovery}
          disabled={!recoveryUsername.trim() || recoveryPin.length < 4 || recovering}
        >
          {recovering ? 'Looking up...' : 'Access My Profile'}
        </button>
        <button
          className="btn btn-ghost"
          onClick={() => {
            setShowRecovery(false);
            setRecoveryError('');
          }}
          style={{ marginTop: 12, fontSize: 14 }}
        >
          Back
        </button>
      </div>
    );
  }

  // New Order Flow
  if (view === 'new-order') {
    return (
      <div className="app-shell" style={{ paddingTop: 16, paddingBottom: 40 }}>
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
      </div>
    );
  }

  // Order Detail
  if (view === 'order-detail' && selectedOrder && profile) {
    return (
      <div className="app-shell" style={{ paddingTop: 16, paddingBottom: 40 }}>
        <OrderDetail
          order={selectedOrder}
          profile={profile}
          onBack={() => {
            setSelectedOrder(null);
            setView('home');
          }}
          onOrderUpdate={(updated) => {
            setOrders(orders.map((o) => (o.id === updated.id ? updated : o)));
            setSelectedOrder(updated);
          }}
          onDelete={() => handleDeleteOrder(selectedOrder.id)}
        />
      </div>
    );
  }

  // Edit Measurements
  if (view === 'edit-measurements') {
    return (
      <div className="app-shell" style={{ paddingTop: 16, paddingBottom: 40 }}>
        <div className="flex items-center gap-12 mb-24">
          <button className="back-btn" onClick={() => setView('home')}>
            <ArrowLeftIcon size={18} />
            <span>Back</span>
          </button>
        </div>
        <h2 className="mb-24">Measurements</h2>
        <MeasurementsEditorWrapper
          profile={profile}
          requestProfile={() => requestProfile('save-measurements')}
          pendingAction={pendingAction}
          onActionConsumed={() => setPendingAction(null)}
          onSave={handleSaveMeasurements}
        />
      </div>
    );
  }

  // Home
  const hasMeasurements = profile?.measurements && Object.keys(profile.measurements).length > 0;
  const hasPhotos = photos.length > 0;
  const profileReady = hasMeasurements && hasPhotos;
  const isGuest = !profile;

  return (
    <div className="app-shell">
      {/* Header */}
      <div className="header">
        <div className="header-logo">Suruwe</div>
        <div className="header-actions">
          <button
            className="theme-toggle"
            onClick={shareSuruwe}
            title="Share Suruwe"
            style={{ fontSize: 14 }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
              <polyline points="16 6 12 2 8 6" />
              <line x1="12" y1="2" x2="12" y2="15" />
            </svg>
          </button>
          <ThemeToggle theme={theme} onToggle={toggleTheme} />
        </div>
      </div>

      {/* Greeting */}
      <div style={{ marginBottom: 28 }}>
        {isGuest ? (
          <>
            <h1 style={{ fontSize: 24, marginBottom: 4, fontFamily: 'var(--font-display)' }}>Suruwe</h1>
            <p style={{ fontSize: 18, fontFamily: 'var(--font-display)', fontWeight: 500, color: 'var(--text)', lineHeight: 1.4, marginBottom: 6 }}>
              What you ordered is what you get.
            </p>
            <p className="text-secondary" style={{ fontSize: 14, lineHeight: 1.5 }}>
              Share your measurements, photos, and fit notes with your tailor in one link.
            </p>
          </>
        ) : (
          <>
            <h1 style={{ fontSize: 24, marginBottom: 4 }}>
              {profile!.name}
            </h1>
            <p style={{ fontSize: 16, fontFamily: 'var(--font-display)', fontWeight: 500, color: 'var(--text)', lineHeight: 1.4, marginBottom: 4 }}>
              What you ordered is what you get.
            </p>
            <p className="text-secondary" style={{ fontSize: 14, lineHeight: 1.5, marginBottom: 4 }}>
              Share your measurements, photos, and fit notes with your tailor in one link.
            </p>
            <p className="text-secondary" style={{ fontSize: 12 }}>
              suruwe.vercel.app/{profile!.slug}
            </p>
          </>
        )}
      </div>

      {/* Hero CTA: New Order */}
      <button
        className="btn btn-primary btn-full"
        onClick={() => { setDraftOrder(null); setView('new-order'); }}
        style={{
          fontSize: 17,
          padding: '18px 24px',
          marginBottom: 36,
          fontFamily: 'var(--font-display)',
          fontWeight: 500,
          letterSpacing: '-0.01em',
        }}
      >
        <PlusIcon size={20} />
        New Order
      </button>

      {/* Nudge card */}
      {!profileReady && (
        <div
          style={{
            padding: '16px 18px',
            borderRadius: 10,
            border: '1px solid var(--border)',
            background: 'var(--card-bg)',
            marginBottom: 28,
            lineHeight: 1.6,
            fontSize: 14,
            color: 'var(--text-secondary)',
          }}
        >
          {isGuest
            ? 'Add your body photo and measurements below. When you save, we will create your profile.'
            : !hasPhotos && !hasMeasurements
            ? 'Add your body photo and measurements below so your tailor has everything they need when you place an order.'
            : !hasPhotos
            ? 'Looking good! Add a body photo so your tailor can see your build.'
            : 'Almost there! Add your measurements to complete your profile.'}
        </div>
      )}

      {/* Body Photo Section */}
      <div className="section">
        <div className="section-header">
          <div className="section-title">Body Photo</div>
        </div>
        <p className="text-secondary" style={{ fontSize: 13, lineHeight: 1.5, marginBottom: 12 }}>
          Add one photo so your tailor can see your body profile — how you carry weight, your posture, and your build. This is separate from the reference images you attach to each order.
        </p>
        {profile ? (
          <PhotoGrid
            photos={photos}
            profileId={profile!.id}
            onPhotosChange={setPhotos}
            editable
            maxPhotos={1}
          />
        ) : (
          <>
            <input
              ref={guestFileRef}
              type="file"
              accept="image/*"
              onChange={handleGuestFileSelect}
              style={{ display: 'none' }}
            />
            <div className="photo-add-compact" onClick={() => guestFileRef.current?.click()}>
              <CameraIcon size={24} />
              <span>{pendingFiles.length > 0 ? 'Uploading...' : 'Add a body photo'}</span>
            </div>
          </>
        )}
      </div>

      {/* Measurements Section */}
      <div className="section">
        <div className="section-header">
          <div className="section-title">Measurements</div>
          {hasMeasurements && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setView('edit-measurements')}
              style={{ padding: '6px 12px', minHeight: 36 }}
            >
              <EditIcon size={14} />
              Edit
            </button>
          )}
        </div>
        {hasMeasurements && profile ? (
          <>
            <MeasurementsPreview
              measurements={profile!.measurements}
              gender={profile!.gender}
              unit={profile!.measurement_unit}
            />
            <button
              className="btn btn-whatsapp btn-full btn-sm"
              onClick={handleShareProfile}
              style={{ marginTop: 16 }}
            >
              <WhatsAppIcon size={16} />
              Share My Profile
            </button>
          </>
        ) : (
          <button
            className="btn btn-secondary btn-full"
            onClick={() => setView('edit-measurements')}
          >
            <RulerIcon size={18} />
            Add Measurements
          </button>
        )}
      </div>

      {/* Order History */}
      <div className="section">
        <div className="section-header">
          <div className="section-title">Orders</div>
        </div>
        {orders.length === 0 ? (
          <div className="empty-state">
            <p>No orders yet. Tap New Order to get something made.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-8">
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

      {/* Recovery link for guests */}
      {isGuest && (
        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <button
            className="btn btn-ghost"
            onClick={() => setShowRecovery(true)}
            style={{ fontSize: 14 }}
          >
            I already have a profile
          </button>
        </div>
      )}

      {/* Feedback link */}
      <div style={{ textAlign: 'center', marginTop: 32, marginBottom: 8 }}>
        <a
          href="https://wa.me/14704437293?text=Hey%2C%20I%20just%20tried%20Suruwe%20and..."
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontSize: 13,
            color: 'var(--text-muted)',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" opacity="0.5">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
            <path d="M12 0C5.373 0 0 5.373 0 12c0 2.125.553 4.12 1.522 5.857L0 24l6.335-1.652A11.95 11.95 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75c-1.875 0-3.63-.5-5.14-1.377l-.368-.22-3.813.999 1.016-3.713-.24-.382A9.71 9.71 0 012.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75z"/>
          </svg>
          Got feedback? Tell us on WhatsApp
        </a>
      </div>

      {/* Bottom padding */}
      <div style={{ height: 40 }} />

      {/* PIN setup for returning users */}
      {showPinSetup && profile && (
        <div className="modal-overlay">
          <div className="modal">
            <h3 style={{ marginBottom: 8 }}>Secure your profile</h3>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 20 }}>
              Set a 4 to 6 digit PIN so you can access your profile on other devices.
            </p>
            <input
              className="input"
              type="number"
              inputMode="numeric"
              placeholder="Enter a PIN (4-6 digits)"
              value={pinSetupInput}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                setPinSetupInput(val);
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleSavePin()}
              autoFocus
            />
            <button
              className="btn btn-primary btn-full"
              onClick={handleSavePin}
              disabled={pinSetupInput.length < 4 || savingPin}
              style={{ marginTop: 16 }}
            >
              {savingPin ? 'Saving...' : 'Save PIN'}
            </button>
          </div>
        </div>
      )}

      {/* Username setup for existing users with auto-generated slugs */}
      {showUsernameSetup && profile && (
        <div className="modal-overlay">
          <div className="modal">
            <h3 style={{ marginBottom: 8 }}>Choose a username</h3>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 20 }}>
              Pick a username so you can log in on any device with just your username and PIN.
            </p>
            <input
              className="input"
              type="text"
              placeholder="Your username"
              value={usernameSetupInput}
              onChange={(e) => { setUsernameSetupInput(e.target.value); setUsernameSetupError(''); }}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveUsername()}
              autoFocus
            />
            {usernameSetupError && (
              <p style={{ color: '#e74c3c', fontSize: 14, marginTop: 8 }}>{usernameSetupError}</p>
            )}
            <button
              className="btn btn-primary btn-full"
              onClick={handleSaveUsername}
              disabled={!usernameSetupInput.trim() || savingUsername}
              style={{ marginTop: 16 }}
            >
              {savingUsername ? 'Saving...' : 'Save Username'}
            </button>
          </div>
        </div>
      )}

      {/* Name prompt modal - multi-step onboarding */}
      {showNamePrompt && (
        <div className="modal-overlay" onClick={() => { setShowNamePrompt(false); setPendingAction(null); setOnboardingStep('name'); }}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>

            {onboardingStep === 'name' && (
              <>
                <h3 style={{ marginBottom: 8 }}>What's your name?</h3>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 20 }}>
                  We will create your profile so your work is saved.
                </p>
                <input
                  className="input"
                  type="text"
                  placeholder="Your name"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleOnboardingName()}
                  autoFocus
                />
                <button
                  className="btn btn-primary btn-full"
                  onClick={handleOnboardingName}
                  disabled={!nameInput.trim()}
                  style={{ marginTop: 16 }}
                >
                  Continue
                </button>
              </>
            )}

            {onboardingStep === 'username' && (
              <>
                <h3 style={{ marginBottom: 8 }}>Choose a username</h3>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 20 }}>
                  This is how you will log in on any device.
                </p>
                <input
                  className="input"
                  type="text"
                  placeholder="Your username"
                  value={onboardingUsername}
                  onChange={(e) => { setOnboardingUsername(e.target.value); setOnboardingUsernameError(''); }}
                  onKeyDown={(e) => e.key === 'Enter' && handleOnboardingUsername()}
                  autoFocus
                />
                {onboardingUsernameError && (
                  <p style={{ color: '#e74c3c', fontSize: 14, marginTop: 8 }}>{onboardingUsernameError}</p>
                )}
                <button
                  className="btn btn-primary btn-full"
                  onClick={handleOnboardingUsername}
                  disabled={!onboardingUsername.trim() || checkingUsername}
                  style={{ marginTop: 16 }}
                >
                  {checkingUsername ? 'Checking...' : 'Continue'}
                </button>
              </>
            )}

            {onboardingStep === 'pin' && (
              <>
                <h3 style={{ marginBottom: 8 }}>Set a PIN</h3>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 20 }}>
                  You will use this with your username to log in on other devices.
                </p>
                <input
                  className="input"
                  type="number"
                  inputMode="numeric"
                  placeholder="4 to 6 digits"
                  value={pinSetupInput}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setPinSetupInput(val);
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && createProfileFromName()}
                  autoFocus
                />
                <button
                  className="btn btn-primary btn-full"
                  onClick={createProfileFromName}
                  disabled={pinSetupInput.length < 4 || creating}
                  style={{ marginTop: 16 }}
                >
                  {creating ? 'Creating...' : 'Create Profile'}
                </button>
              </>
            )}

          </div>
        </div>
      )}

      {/* Phone prompt modal */}
      {showPhonePrompt && (
        <PhonePrompt onSubmit={handlePhoneSubmit} onSkip={handlePhoneSkip} />
      )}

      {/* Share Suruwe sheet */}
      {showShareSheet && (
        <div className="modal-overlay" onClick={() => setShowShareSheet(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginBottom: 6, fontSize: 18 }}>
              What you ordered vs what you got.
            </h3>
            <p style={{ fontSize: 18, fontFamily: 'var(--font-display)', fontWeight: 500, color: 'var(--accent)', marginBottom: 20 }}>
              Never again.
            </p>

            <div className="wa-preview" style={{ marginBottom: 24 }}>
              You know that feeling when you send your tailor a photo and what comes back looks nothing like it? I started using Suruwe to send my measurements, photos, and fit notes in one link. No more wahala. Try it:{'\n\n'}https://suruwe.vercel.app
            </div>

            <button
              className="btn btn-primary btn-full"
              onClick={confirmShareSuruwe}
              style={{ marginBottom: 8 }}
            >
              Share Suruwe
            </button>
            <button
              className="btn btn-ghost btn-full btn-sm"
              onClick={() => setShowShareSheet(false)}
            >
              Not now
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Swipeable order card with delete
function SwipeableOrderCard({
  order,
  onTap,
  onDelete,
}: {
  order: Order;
  onTap: () => void;
  onDelete: () => void;
}) {
  const [offsetX, setOffsetX] = useState(0);
  const [startX, setStartX] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const deleteThreshold = -80;

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartX(e.touches[0].clientX);
    setSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!swiping) return;
    const diff = e.touches[0].clientX - startX;
    if (diff < 0) setOffsetX(Math.max(diff, -120));
  };

  const handleTouchEnd = () => {
    setSwiping(false);
    if (offsetX < deleteThreshold) {
      setOffsetX(-120);
    } else {
      setOffsetX(0);
    }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    await onDelete();
  };

  if (showConfirm) {
    return (
      <div
        className="order-card"
        style={{ textAlign: 'center', padding: '16px 18px' }}
      >
        <p style={{ fontSize: 14, marginBottom: 12, color: 'var(--text-secondary)' }}>
          Delete this order?
        </p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
          <button
            className="btn btn-sm"
            onClick={() => setShowConfirm(false)}
            style={{ padding: '8px 20px', fontSize: 13 }}
          >
            Cancel
          </button>
          <button
            className="btn btn-sm"
            onClick={confirmDelete}
            disabled={deleting}
            style={{
              padding: '8px 20px',
              fontSize: 13,
              background: '#e74c3c',
              color: '#fff',
              border: 'none',
            }}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 'var(--radius)' }}>
      {/* Delete background */}
      <div
        style={{
          position: 'absolute',
          right: 0,
          top: 0,
          bottom: 0,
          width: 120,
          background: '#e74c3c',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 'var(--radius)',
        }}
      >
        <button
          onClick={() => setShowConfirm(true)}
          style={{
            background: 'none',
            border: 'none',
            color: '#fff',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            padding: '8px 16px',
            fontFamily: 'inherit',
          }}
        >
          Delete
        </button>
      </div>

      {/* Card */}
      <div
        className="order-card"
        onClick={() => { if (offsetX === 0) onTap(); else setOffsetX(0); }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: `translateX(${offsetX}px)`,
          transition: swiping ? 'none' : 'transform 0.2s ease',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div className="order-tailor">{order.tailor_name}</div>
        <div className="order-desc">{order.description}</div>
        <div className="order-date">{formatDate(order.created_at)}</div>
        <span className={`order-status ${order.status}`}>
          {order.status === 'sent'
            ? 'Sent'
            : order.status === 'completed'
            ? 'Completed'
            : order.status === 'in_progress'
            ? 'In Progress'
            : 'Draft'}
        </span>
      </div>
    </div>
  );
}

// Wrapper for standalone measurements editing
// User fills everything freely. Name prompt on save. useEffect auto-saves after profile creation.
function MeasurementsEditorWrapper({
  profile,
  requestProfile,
  pendingAction,
  onActionConsumed,
  onSave,
}: {
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
    if (!profile) {
      requestProfile();
      return;
    }
    doSave();
  };

  // Auto-save after profile creation
  useEffect(() => {
    if (profile && pendingAction === 'save-measurements') {
      onActionConsumed();
      doSave();
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
