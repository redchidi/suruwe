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

type View = 'home' | 'new-order' | 'order-detail' | 'edit-measurements';
type PendingAction = 'upload-photo' | 'edit-measurements' | 'new-order' | null;

const PROFILE_KEY = 'suruwe_profile_id';

export default function OwnerPage() {
  const [view, setView] = useState<View>('home');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [photos, setPhotos] = useState<ProfilePhoto[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [theme, setTheme] = useState<Theme>('dark');
  const [loading, setLoading] = useState(true);
  const [showPhonePrompt, setShowPhonePrompt] = useState(false);
  const [showShareSheet, setShowShareSheet] = useState(false);

  // Name prompt (replaces onboarding)
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [creating, setCreating] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);

  // Recovery state
  const [showRecovery, setShowRecovery] = useState(false);
  const [recoverySlug, setRecoverySlug] = useState('');
  const [recoveryPin, setRecoveryPin] = useState('');
  const [recoveryError, setRecoveryError] = useState('');
  const [recovering, setRecovering] = useState(false);

  // PIN prompt for existing users (second visit)
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
      // No profile yet, show home as guest
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

    setLoading(false);

    // Prompt existing users to set a PIN if they don't have one (second visit)
    if (!p.pin) {
      setShowPinSetup(true);
    }
  };

  // Gate: check for profile before allowing an action
  const requireProfile = (action: PendingAction): boolean => {
    if (profile) return true;
    setPendingAction(action);
    setShowNamePrompt(true);
    return false;
  };

  // Create profile from name prompt
  const createProfileFromName = async () => {
    if (!nameInput.trim() || creating) return;
    setCreating(true);

    const slug = generateSlug(nameInput.trim());
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        slug,
        name: nameInput.trim(),
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

      // Resume the pending action
      if (pendingAction === 'upload-photo') {
        // PhotoGrid will now have a valid profileId, trigger file input
        // We set a flag so PhotoGrid auto-opens the file picker
        setTriggerPhotoUpload(true);
      } else if (pendingAction === 'edit-measurements') {
        setView('edit-measurements');
      } else if (pendingAction === 'new-order') {
        setView('new-order');
      }
      setPendingAction(null);
    }
    setCreating(false);
  };

  // Auto-trigger photo upload after profile creation
  const [triggerPhotoUpload, setTriggerPhotoUpload] = useState(false);

  const handleRecovery = async () => {
    if (!recoverySlug.trim() || !recoveryPin.trim() || recovering) return;
    setRecovering(true);
    setRecoveryError('');

    let slug = recoverySlug.trim();
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

  // Gated action handlers
  const handleNewOrder = () => {
    if (requireProfile('new-order')) {
      setView('new-order');
    }
  };

  const handleEditMeasurements = () => {
    if (requireProfile('edit-measurements')) {
      setView('edit-measurements');
    }
  };

  const handlePhotoUpload = () => {
    if (requireProfile('upload-photo')) {
      // If profile exists, PhotoGrid handles it directly
      setTriggerPhotoUpload(true);
    }
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

  // Recovery flow (standalone screen)
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

  // New Order Flow (requires profile)
  if (view === 'new-order' && profile) {
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

  // Order Detail (requires profile)
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
        />
      </div>
    );
  }

  // Edit Measurements (requires profile)
  if (view === 'edit-measurements' && profile) {
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
            <h1 style={{ fontSize: 24, marginBottom: 8 }}>Suruwe</h1>
            <p className="text-secondary" style={{ fontSize: 14, lineHeight: 1.5 }}>
              Your measurements, photos, and fit notes. One link for your tailor.
            </p>
          </>
        ) : (
          <>
            <h1 style={{ fontSize: 24, marginBottom: 4 }}>
              {profile.name}
            </h1>
            <p className="text-secondary" style={{ fontSize: 14 }}>
              suruwe.vercel.app/{profile.slug}
            </p>
          </>
        )}
      </div>

      {/* Hero CTA: New Order */}
      <button
        className="btn btn-primary btn-full"
        onClick={handleNewOrder}
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

      {/* Nudge card for new/incomplete profiles */}
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
            ? 'Add your photos and measurements below. When you save, we will create your profile.'
            : !hasPhotos && !hasMeasurements
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
        {profile ? (
          <PhotoGrid
            photos={photos}
            profileId={profile.id}
            onPhotosChange={setPhotos}
            editable
            autoTriggerUpload={triggerPhotoUpload}
            onAutoTriggerConsumed={() => setTriggerPhotoUpload(false)}
          />
        ) : (
          <div className="photo-add-compact" onClick={handlePhotoUpload}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
            <span>Add photos</span>
          </div>
        )}
      </div>

      {/* Measurements Section */}
      <div className="section">
        <div className="section-header">
          <div className="section-title">Measurements</div>
          {hasMeasurements && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={handleEditMeasurements}
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
              measurements={profile.measurements}
              gender={profile.gender}
              unit={profile.measurement_unit}
            />
            {/* Share profile button */}
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
            onClick={handleEditMeasurements}
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

      {/* "I already have a profile" link for guests */}
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

      {/* Bottom padding */}
      <div style={{ height: 60 }} />

      {/* PIN setup prompt for returning users without PIN */}
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

      {/* Name prompt modal */}
      {showNamePrompt && (
        <div className="modal-overlay" onClick={() => { setShowNamePrompt(false); setPendingAction(null); }}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
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
              onKeyDown={(e) => e.key === 'Enter' && createProfileFromName()}
              autoFocus
            />
            <button
              className="btn btn-primary btn-full"
              onClick={createProfileFromName}
              disabled={!nameInput.trim() || creating}
              style={{ marginTop: 16 }}
            >
              {creating ? 'Creating...' : 'Continue'}
            </button>
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
