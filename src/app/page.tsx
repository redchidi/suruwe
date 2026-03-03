'use client';

import { useState, useEffect, useCallback } from 'react';
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
} from '@/components/Icons';

// Share Suruwe referral message
const SHARE_SURUWE_MESSAGE = `You know that feeling when you send your tailor a photo and what comes back looks nothing like it? I started using Suruwe to send my measurements, photos, and fit notes in one link. No more wahala. Try it:\n\nhttps://suruwe.vercel.app`;

type View = 'onboarding' | 'home' | 'new-order' | 'order-detail' | 'edit-measurements';

const PROFILE_KEY = 'suruwe_profile_id';

export default function OwnerPage() {
  const [view, setView] = useState<View>('onboarding');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [photos, setPhotos] = useState<ProfilePhoto[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [theme, setTheme] = useState<Theme>('dark');
  const [loading, setLoading] = useState(true);
  const [showPhonePrompt, setShowPhonePrompt] = useState(false);

  // Onboarding state
  const [nameInput, setNameInput] = useState('');
  const [creating, setCreating] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState<'name' | 'pin'>('name');
  const [pinInput, setPinInput] = useState('');

  // Recovery state
  const [showRecovery, setShowRecovery] = useState(false);
  const [recoverySlug, setRecoverySlug] = useState('');
  const [recoveryPin, setRecoveryPin] = useState('');
  const [recoveryError, setRecoveryError] = useState('');
  const [recovering, setRecovering] = useState(false);

  // PIN prompt for existing users
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [pinSetupInput, setPinSetupInput] = useState('');
  const [savingPin, setSavingPin] = useState(false);

  // Load profile on mount
  useEffect(() => {
    loadProfile();
  }, []);

  // Apply theme whenever it changes
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const loadProfile = async () => {
    const profileId = localStorage.getItem(PROFILE_KEY);
    if (!profileId) {
      setLoading(false);
      setView('onboarding');
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
      setView('onboarding');
      return;
    }

    const p = profileData as Profile;
    setProfile(p);
    setTheme(p.theme as Theme);
    // Load photos
    const { data: photoData } = await supabase
      .from('profile_photos')
      .select('*')
      .eq('profile_id', p.id)
      .order('sort_order', { ascending: true });
    if (photoData) setPhotos(photoData);

    // Load orders
    const { data: orderData } = await supabase
      .from('orders')
      .select('*')
      .eq('profile_id', p.id)
      .order('created_at', { ascending: false });
    if (orderData) setOrders(orderData);

    setView('home');
    setLoading(false);

    // Prompt existing users to set a PIN if they don't have one
    if (!p.pin) {
      setShowPinSetup(true);
    }
  };

  const handleNameSubmit = () => {
    if (!nameInput.trim()) return;
    setOnboardingStep('pin');
  };

  const createProfile = async () => {
    if (!nameInput.trim() || !pinInput.trim() || creating) return;
    if (pinInput.length < 4 || pinInput.length > 6) return;
    setCreating(true);

    const slug = generateSlug(nameInput.trim());
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        slug,
        name: nameInput.trim(),
        pin: pinInput,
        gender: 'male',
        theme: 'dark',
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
      setTheme(p.theme as Theme);
      setView('home');
    }
    setCreating(false);
  };

  const handleRecovery = async () => {
    if (!recoverySlug.trim() || !recoveryPin.trim() || recovering) return;
    setRecovering(true);
    setRecoveryError('');

    // Extract slug from URL or use as-is
    let slug = recoverySlug.trim();
    // Handle full URLs like suruwe.vercel.app/chidi-ozzc or suruwe.com/chidi-ozzc
    if (slug.includes('/')) {
      const parts = slug.split('/');
      slug = parts[parts.length - 1];
    }

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('slug', slug)
      .eq('pin', recoveryPin)
      .single();

    if (data) {
      const p = data as Profile;
      localStorage.setItem(PROFILE_KEY, p.id);
      setProfile(p);
      setTheme(p.theme as Theme);

      // Load photos
      const { data: photoData } = await supabase
        .from('profile_photos')
        .select('*')
        .eq('profile_id', p.id)
        .order('sort_order', { ascending: true });
      if (photoData) setPhotos(photoData);

      // Load orders
      const { data: orderData } = await supabase
        .from('orders')
        .select('*')
        .eq('profile_id', p.id)
        .order('created_at', { ascending: false });
      if (orderData) setOrders(orderData);

      setView('home');
    } else {
      setRecoveryError('No profile found with that link and PIN. Please check and try again.');
    }
    setRecovering(false);
  };

  const handleSavePin = async () => {
    if (!profile || !pinSetupInput.trim() || savingPin) return;
    if (pinSetupInput.length < 4 || pinSetupInput.length > 6) return;
    setSavingPin(true);
    await supabase.from('profiles').update({ pin: pinSetupInput }).eq('id', profile.id);
    setProfile({ ...profile, pin: pinSetupInput });
    setShowPinSetup(false);
    setSavingPin(false);
  };

  const toggleTheme = async () => {
    const newTheme: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    if (profile) {
      await supabase.from('profiles').update({ theme: newTheme }).eq('id', profile.id);
      setProfile({ ...profile, theme: newTheme });
    }
  };

  const handleShareProfile = () => {
    if (!profile) return;
    // Prompt for phone number on first share
    if (!profile.phone) {
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
    await supabase.from('profiles').update({ phone }).eq('id', profile.id);
    setProfile({ ...profile, phone });
    setShowPhonePrompt(false);
    doShare();
  };

  const handlePhoneSkip = () => {
    setShowPhonePrompt(false);
    doShare();
  };

  const shareSuruwe = () => {
    // Use Web Share API if available (mobile), fall back to WhatsApp
    if (navigator.share) {
      navigator.share({
        title: 'Suruwe',
        text: 'You know that feeling when you send your tailor a photo and what comes back looks nothing like it? I started using Suruwe to send my measurements, photos, and fit notes in one link. No more wahala. Try it:',
        url: 'https://suruwe.vercel.app',
      }).catch(() => {});
    } else {
      openWhatsApp(SHARE_SURUWE_MESSAGE);
    }
  };

  const handleOrderCreated = (order: Order) => {
    setOrders([order, ...orders]);
    setView('home');
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
      .eq('id', profile.id)
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

  // Onboarding
  if (view === 'onboarding') {
    // Recovery flow
    if (showRecovery) {
      return (
        <div className="onboarding">
          <div className="onboarding-logo">Suruwe</div>
          <div className="onboarding-tagline">
            Enter your profile link and PIN to access your profile on this device.
          </div>
          <input
            className="onboarding-input"
            type="text"
            placeholder="Your profile link or slug (e.g. chidi-ozzc)"
            value={recoverySlug}
            onChange={(e) => setRecoverySlug(e.target.value)}
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
            disabled={!recoverySlug.trim() || recoveryPin.length < 4 || recovering}
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

    // Step 2: Set PIN
    if (onboardingStep === 'pin') {
      return (
        <div className="onboarding">
          <div className="onboarding-logo">Suruwe</div>
          <div className="onboarding-tagline">
            Choose a 4 to 6 digit PIN. You will need this to access your profile on other devices.
          </div>
          <input
            className="onboarding-input"
            type="number"
            inputMode="numeric"
            placeholder="Enter a PIN (4-6 digits)"
            value={pinInput}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, '').slice(0, 6);
              setPinInput(val);
            }}
            onKeyDown={(e) => e.key === 'Enter' && createProfile()}
            autoFocus
          />
          <button
            className="btn btn-primary onboarding-btn"
            onClick={createProfile}
            disabled={pinInput.length < 4 || creating}
          >
            {creating ? 'Setting up...' : 'Create Profile'}
          </button>
          <button
            className="btn btn-ghost"
            onClick={() => setOnboardingStep('name')}
            style={{ marginTop: 12, fontSize: 14 }}
          >
            Back
          </button>
        </div>
      );
    }

    // Step 1: Enter name
    return (
      <div className="onboarding">
        <div className="onboarding-logo">Suruwe</div>
        <div className="onboarding-tagline">
          Your measurements, your photos, one link for your tailor.
        </div>
        <input
          className="onboarding-input"
          type="text"
          placeholder="Your name"
          value={nameInput}
          onChange={(e) => setNameInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleNameSubmit()}
          autoFocus
        />
        <button
          className="btn btn-primary onboarding-btn"
          onClick={handleNameSubmit}
          disabled={!nameInput.trim()}
        >
          Get Started
        </button>
        <button
          className="btn btn-ghost"
          onClick={() => setShowRecovery(true)}
          style={{ marginTop: 16, fontSize: 14 }}
        >
          I already have a profile
        </button>
      </div>
    );
  }

  if (!profile) return null;

  // New Order Flow
  if (view === 'new-order') {
    return (
      <div className="app-shell" style={{ paddingTop: 16, paddingBottom: 40 }}>
        <NewOrderFlow
          profile={profile}
          hasPhotos={photos.length > 0}
          onClose={() => setView('home')}
          onOrderCreated={handleOrderCreated}
          onProfileUpdate={handleProfileUpdate}
        />
      </div>
    );
  }

  // Order Detail
  if (view === 'order-detail' && selectedOrder) {
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
          onSave={handleSaveMeasurements}
        />
      </div>
    );
  }

  // Home
  const hasMeasurements = profile.measurements && Object.keys(profile.measurements).length > 0;
  const hasPhotos = photos.length > 0;
  const profileReady = hasMeasurements && hasPhotos;

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
        <h1 style={{ fontSize: 24, marginBottom: 4 }}>
          {profile.name}
        </h1>
        <p className="text-secondary" style={{ fontSize: 14 }}>
          suruwe.vercel.app/{profile.slug}
        </p>
      </div>

      {/* Hero CTA: New Order */}
      <button
        className="btn btn-primary btn-full"
        onClick={() => setView('new-order')}
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

      {/* Nudge card for new users */}
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
          {!hasPhotos && !hasMeasurements
            ? 'Add your photos and measurements below so your tailor has everything they need when you place an order.'
            : !hasPhotos
            ? 'Looking good! Add a photo so your tailor can see your build.'
            : 'Almost there! Add your measurements to complete your profile.'}
        </div>
      )}

      {/* Photos Section */}
      <div className="section">
        <div className="section-header">
          <div className="section-title">Photos</div>
        </div>
        <PhotoGrid
          photos={photos}
          profileId={profile.id}
          onPhotosChange={setPhotos}
          editable
        />
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
        {hasMeasurements ? (
          <>
            <MeasurementsPreview
              measurements={profile.measurements}
              gender={profile.gender}
              unit={profile.measurement_unit}
            />
            {/* Share profile button lives here now */}
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
              <div
                key={order.id}
                className="order-card"
                onClick={() => {
                  setSelectedOrder(order);
                  setView('order-detail');
                }}
              >
                <div className="order-tailor">{order.tailor_name}</div>
                <div className="order-desc">{order.description}</div>
                <div className="order-date">{formatDate(order.created_at)}</div>
                <span
                  className={`order-status ${order.status}`}
                >
                  {order.status === 'sent'
                    ? 'Sent'
                    : order.status === 'completed'
                    ? 'Completed'
                    : order.status === 'in_progress'
                    ? 'In Progress'
                    : 'Draft'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom padding */}
      <div style={{ height: 60 }} />

      {/* PIN setup prompt for existing users */}
      {showPinSetup && (
        <div className="modal-overlay">
          <div className="modal-sheet">
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

      {/* Phone prompt modal */}
      {showPhonePrompt && (
        <PhonePrompt onSubmit={handlePhoneSubmit} onSkip={handlePhoneSkip} />
      )}
    </div>
  );
}

// Wrapper component for standalone measurements editing
function MeasurementsEditorWrapper({
  profile,
  onSave,
}: {
  profile: Profile;
  onSave: (m: Record<string, number>, g: 'male' | 'female', u: 'inches' | 'cm', notes: string) => void;
}) {
  const [measurements, setMeasurements] = useState(profile.measurements || {});
  const [gender, setGender] = useState(profile.gender);
  const [unit, setUnit] = useState(profile.measurement_unit);
  const [measurementNotes, setMeasurementNotes] = useState(profile.measurement_notes || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave(measurements, gender, unit, measurementNotes);
    setSaving(false);
  };

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
