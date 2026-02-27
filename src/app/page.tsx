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
  };

  const createProfile = async () => {
    if (!nameInput.trim() || creating) return;
    setCreating(true);

    const slug = generateSlug(nameInput.trim());
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        slug,
        name: nameInput.trim(),
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
    unit: 'inches' | 'cm'
  ) => {
    if (!profile) return;
    const { data } = await supabase
      .from('profiles')
      .update({
        measurements,
        gender,
        measurement_unit: unit,
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
          onKeyDown={(e) => e.key === 'Enter' && createProfile()}
          autoFocus
        />
        <button
          className="btn btn-primary onboarding-btn"
          onClick={createProfile}
          disabled={!nameInput.trim() || creating}
        >
          {creating ? 'Setting up...' : 'Get Started'}
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

  return (
    <div className="app-shell">
      {/* Header */}
      <div className="header">
        <div className="header-logo">Suruwe</div>
        <div className="header-actions">
          <ThemeToggle theme={theme} onToggle={toggleTheme} />
        </div>
      </div>

      {/* Greeting */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, marginBottom: 4 }}>
          {profile.name}
        </h1>
        <p className="text-secondary" style={{ fontSize: 14 }}>
          suruwe.com/{profile.slug}
        </p>
      </div>

      {/* Hero CTA: New Order */}
      <button
        className="btn btn-primary btn-full"
        onClick={() => setView('new-order')}
        style={{
          fontSize: 17,
          padding: '18px 24px',
          marginBottom: 12,
          fontFamily: 'var(--font-display)',
          fontWeight: 500,
          letterSpacing: '-0.01em',
        }}
      >
        <PlusIcon size={20} />
        New Order
      </button>

      {/* Share profile CTA - only show when there's content to share */}
      {(hasPhotos || hasMeasurements || orders.length > 0) ? (
        <button
          className="btn btn-whatsapp btn-full btn-sm"
          onClick={handleShareProfile}
          style={{ marginBottom: 36 }}
        >
          <WhatsAppIcon size={18} />
          Send to My Tailor
        </button>
      ) : (
        <div style={{ marginBottom: 36 }} />
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
          <MeasurementsPreview
            measurements={profile.measurements}
            gender={profile.gender}
            unit={profile.measurement_unit}
          />
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
            <p>No orders yet. Start by placing your first order above.</p>
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
  onSave: (m: Record<string, number>, g: 'male' | 'female', u: 'inches' | 'cm') => void;
}) {
  const [measurements, setMeasurements] = useState(profile.measurements || {});
  const [gender, setGender] = useState(profile.gender);
  const [unit, setUnit] = useState(profile.measurement_unit);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave(measurements, gender, unit);
    setSaving(false);
  };

  return (
    <MeasurementsEditor
      gender={gender}
      unit={unit}
      measurements={measurements}
      onGenderChange={setGender}
      onUnitChange={setUnit}
      onMeasurementsChange={setMeasurements}
      onSave={handleSave}
      saving={saving}
    />
  );
}
