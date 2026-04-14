'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Gender, MeasurementUnit, getMeasurementSections, getMeasurementFields } from '@/types';
import { MaleIcon, FemaleIcon } from './Icons';
import { MaleTopGuide, MaleBottomGuide, FemaleTopGuide, FemaleBottomGuide } from './MeasurementGuides';
import MeasurementImport from './MeasurementImport';

interface MeasurementsEditorProps {
  gender: Gender;
  unit: MeasurementUnit;
  measurements: Record<string, number>;
  measurementNotes?: string;
  onGenderChange: (gender: Gender) => void;
  onUnitChange: (unit: MeasurementUnit) => void;
  onMeasurementsChange: (measurements: Record<string, number>) => void;
  onNotesChange?: (notes: string) => void;
  onSave: () => void;
  saving?: boolean;
  saveLabel?: string;
}

export default function MeasurementsEditor({
  gender,
  unit,
  measurements,
  measurementNotes = '',
  onGenderChange,
  onUnitChange,
  onMeasurementsChange,
  onNotesChange,
  onSave,
  saving,
  saveLabel,
}: MeasurementsEditorProps) {
  const t = useTranslations();
  const sections = getMeasurementSections(gender);
  const standardKeys = new Set(getMeasurementFields(gender).map(f => f.key));
  const [showGuide, setShowGuide] = useState<Record<string, boolean>>({});
  const [showImport, setShowImport] = useState(false);

  const toggleGuide = (sectionKey: string) => {
    setShowGuide((prev) => ({ ...prev, [sectionKey]: !prev[sectionKey] }));
  };

  const handleFieldChange = (key: string, value: string) => {
    const num = parseFloat(value);
    const updated = { ...measurements };
    if (isNaN(num) || value === '') {
      delete updated[key];
    } else {
      updated[key] = num;
    }
    onMeasurementsChange(updated);
  };

  const getGuideForSectionKey = (sectionKey: string) => {
    const isTop = sectionKey === 'upperBody' || sectionKey === 'arms';
    if (gender === 'male') {
      return isTop ? <MaleTopGuide /> : <MaleBottomGuide />;
    }
    return isTop ? <FemaleTopGuide /> : <FemaleBottomGuide />;
  };

  const guideSectionKeys = ['upperBody', 'lowerBody'];

  const handleImport = (imported: Record<string, number>, detectedUnit?: MeasurementUnit) => {
    const merged = { ...measurements, ...imported };
    onMeasurementsChange(merged);
    if (detectedUnit && detectedUnit !== unit) {
      onUnitChange(detectedUnit);
    }
  };

  const unitLabel = unit === 'inches' ? 'in' : 'cm';

  return (
    <div>
      {/* Import from photo */}
      <button
        onClick={() => setShowImport(true)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          width: '100%', padding: '13px 16px', background: 'var(--gold-dim)',
          border: '0.5px solid var(--gold-bdr)', borderRadius: 10, cursor: 'pointer',
          marginBottom: 24, fontFamily: 'var(--font-body)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(184,146,74,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <rect x="1" y="4" width="14" height="10" rx="1.5" stroke="var(--gold)" strokeWidth="1.2" />
              <circle cx="8" cy="9" r="2.5" stroke="var(--gold)" strokeWidth="1.2" />
              <path d="M6 4l1-2h2l1 2" stroke="var(--gold)" strokeWidth="1.2" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', lineHeight: 1.2 }}>Import from photo</div>
            <div style={{ fontSize: 11, fontWeight: 300, color: 'var(--ink-soft)', marginTop: 1 }}>Photo or screenshot of a measurements sheet</div>
          </div>
        </div>
        <span style={{ color: 'var(--gold)', fontSize: 16 }}>→</span>
      </button>

      {/* Gender + Unit toggles */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 4, background: 'var(--cream-2)', borderRadius: 8, padding: 3 }}>
          <button onClick={() => onGenderChange('male')} style={{ padding: '8px 16px', borderRadius: 6, fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 500, border: 'none', cursor: 'pointer', background: gender === 'male' ? 'white' : 'transparent', color: gender === 'male' ? 'var(--ink)' : 'var(--ink-soft)', boxShadow: gender === 'male' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none', transition: 'all 200ms ease', display: 'flex', alignItems: 'center', gap: 6 }}>
            <MaleIcon />
          </button>
          <button onClick={() => onGenderChange('female')} style={{ padding: '8px 16px', borderRadius: 6, fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 500, border: 'none', cursor: 'pointer', background: gender === 'female' ? 'white' : 'transparent', color: gender === 'female' ? 'var(--ink)' : 'var(--ink-soft)', boxShadow: gender === 'female' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none', transition: 'all 200ms ease', display: 'flex', alignItems: 'center', gap: 6 }}>
            <FemaleIcon />
          </button>
        </div>
        <div style={{ display: 'flex', gap: 4, background: 'var(--cream-2)', borderRadius: 8, padding: 3 }}>
          <button onClick={() => onUnitChange('inches')} style={{ padding: '8px 14px', borderRadius: 6, fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, letterSpacing: '0.06em', border: 'none', cursor: 'pointer', background: unit === 'inches' ? 'var(--gold)' : 'transparent', color: unit === 'inches' ? 'var(--charcoal)' : 'var(--ink-soft)', transition: 'all 200ms ease' }}>in</button>
          <button onClick={() => onUnitChange('cm')} style={{ padding: '8px 14px', borderRadius: 6, fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, letterSpacing: '0.06em', border: 'none', cursor: 'pointer', background: unit === 'cm' ? 'var(--gold)' : 'transparent', color: unit === 'cm' ? 'var(--charcoal)' : 'var(--ink-soft)', transition: 'all 200ms ease' }}>cm</button>
        </div>
      </div>

      {/* Measurement sections */}
      {Object.entries(sections).map(([sectionKey, fields]) => (
        <div key={sectionKey} style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 300, color: 'var(--ink)' }}>
              {t(`measurementSections.${sectionKey}`)}
            </h3>
            {guideSectionKeys.includes(sectionKey) && (
              <button onClick={() => toggleGuide(sectionKey)} style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.04em', color: 'var(--gold)', background: 'none', border: '0.5px solid var(--gold-bdr)', cursor: 'pointer', padding: '3px 10px', borderRadius: 12, fontFamily: 'var(--font-body)' }}>
                {showGuide[sectionKey] ? t('measurements.hideGuide') : t('measurements.showGuide')}
              </button>
            )}
          </div>
          {guideSectionKeys.includes(sectionKey) && showGuide[sectionKey] && (
            <div style={{ marginBottom: 16 }}>{getGuideForSectionKey(sectionKey)}</div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px 12px' }}>
            {fields.map((field) => (
              <div key={field.key}>
                <label style={{ fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase' as const, color: 'var(--ink-soft)', opacity: 0.6, display: 'block', marginBottom: 6 }}>
                  {t(`measurementLabels.${gender}.${field.key}`)}
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.5"
                    placeholder="--"
                    value={measurements[field.key] ?? ''}
                    onChange={(e) => handleFieldChange(field.key, e.target.value)}
                    className="input-cream"
                    style={{ padding: '10px 32px 10px 12px', fontSize: 14, textAlign: 'center', width: '100%' }}
                  />
                  <span style={{
                    position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                    fontSize: 10, fontWeight: 600, letterSpacing: '0.04em',
                    color: 'var(--ink-soft)', opacity: 0.45,
                    fontFamily: 'var(--font-body)', pointerEvents: 'none',
                  }}>
                    {unitLabel}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Custom measurements */}
      <CustomMeasurements
        measurements={measurements}
        standardKeys={standardKeys}
        onMeasurementsChange={onMeasurementsChange}
        unit={unit}
      />

      {/* Measurement notes */}
      <div style={{ marginBottom: 24 }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 300, color: 'var(--ink)', marginBottom: 8 }}>
          {t('measurements.notesTitle')}
        </h3>
        <p style={{ fontSize: 13, color: 'var(--ink-soft)', margin: '0 0 10px 0', lineHeight: 1.55, fontFamily: 'var(--font-body)', fontWeight: 300 }}>
          {t('measurements.notesDescription')}
        </p>
        <textarea rows={3} placeholder={t('measurements.notesPlaceholder')} value={measurementNotes} onChange={(e) => onNotesChange?.(e.target.value)} className="textarea-cream" />
      </div>

      <button className="btn-charcoal" onClick={onSave} disabled={saving}>
        <span>{saving ? t('common.saving') : saveLabel || t('measurements.saveMeasurements')}</span>
        <span className="arrow">&rarr;</span>
      </button>

      {showImport && (
        <MeasurementImport
          gender={gender}
          unit={unit}
          existingMeasurements={measurements}
          onImport={handleImport}
          onClose={() => setShowImport(false)}
        />
      )}
    </div>
  );
}

function CustomMeasurements({
  measurements, standardKeys, onMeasurementsChange, unit,
}: {
  measurements: Record<string, number>;
  standardKeys: Set<string>;
  onMeasurementsChange: (m: Record<string, number>) => void;
  unit: MeasurementUnit;
}) {
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const unitLabel = unit === 'inches' ? 'in' : 'cm';

  const customEntries = Object.entries(measurements).filter(
    ([key]) => !standardKeys.has(key) && key.startsWith('custom_')
  );

  const handleCustomChange = (key: string, value: string) => {
    const num = parseFloat(value);
    const updated = { ...measurements };
    if (isNaN(num) || value === '') { delete updated[key]; } else { updated[key] = num; }
    onMeasurementsChange(updated);
  };

  const handleAddConfirm = () => {
    if (!newName.trim()) return;
    const key = 'custom_' + newName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_');
    const updated = { ...measurements, [key]: 0 };
    onMeasurementsChange(updated);
    setNewName('');
    setAdding(false);
  };

  const handleRemoveCustom = (key: string) => {
    const updated = { ...measurements };
    delete updated[key];
    onMeasurementsChange(updated);
  };

  const formatLabel = (key: string) => key.replace('custom_', '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 300, color: 'var(--ink)' }}>Other measurements</h3>
      </div>
      <p style={{ fontSize: 13, color: 'var(--ink-soft)', margin: '0 0 14px 0', lineHeight: 1.55, fontFamily: 'var(--font-body)', fontWeight: 300 }}>
        Add any measurements your tailor asks for that aren&apos;t listed above.
      </p>
      {customEntries.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px 12px', marginBottom: 14 }}>
          {customEntries.map(([key, value]) => (
            <div key={key} style={{ position: 'relative' }}>
              <label style={{ fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase' as const, color: 'var(--ink-soft)', opacity: 0.6, display: 'block', marginBottom: 6 }}>
                {formatLabel(key)}
              </label>
              <div style={{ display: 'flex', gap: 4 }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <input
                    type="number" inputMode="decimal" step="0.5" placeholder="--"
                    value={value || ''}
                    onChange={(e) => handleCustomChange(key, e.target.value)}
                    className="input-cream"
                    style={{ padding: '10px 32px 10px 12px', fontSize: 14, textAlign: 'center', width: '100%' }}
                  />
                  <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', fontSize: 10, fontWeight: 600, color: 'var(--ink-soft)', opacity: 0.45, fontFamily: 'var(--font-body)', pointerEvents: 'none' }}>
                    {unitLabel}
                  </span>
                </div>
                <button onClick={() => handleRemoveCustom(key)} style={{ width: 36, height: 'auto', background: 'none', border: '0.5px solid rgba(20,16,12,0.1)', borderRadius: 8, cursor: 'pointer', fontSize: 14, color: 'var(--ink-soft)', opacity: 0.4, display: 'flex', alignItems: 'center', justifyContent: 'center' }} aria-label="Remove">✕</button>
              </div>
            </div>
          ))}
        </div>
      )}
      {adding ? (
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <input type="text" placeholder="Measurement name" value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleAddConfirm(); }} className="input-cream" style={{ flex: 1, padding: '10px 12px', fontSize: 14 }} autoFocus />
          <button onClick={handleAddConfirm} disabled={!newName.trim()} style={{ padding: '10px 16px', borderRadius: 8, background: newName.trim() ? 'var(--charcoal)' : 'var(--cream-3)', color: newName.trim() ? 'var(--cream)' : 'var(--ink-soft)', border: 'none', cursor: newName.trim() ? 'pointer' : 'default', fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600 }}>Add</button>
          <button onClick={() => { setAdding(false); setNewName(''); }} style={{ padding: '10px 12px', borderRadius: 8, background: 'none', border: '0.5px solid rgba(20,16,12,0.1)', color: 'var(--ink-soft)', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 13 }}>Cancel</button>
        </div>
      ) : (
        <button onClick={() => setAdding(true)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', width: '100%', background: 'transparent', border: '0.5px dashed rgba(20,16,12,0.15)', borderRadius: 8, cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 500, color: 'var(--ink-soft)', textAlign: 'left' as const }}>
          + Add a custom measurement
        </button>
      )}
    </div>
  );
}
