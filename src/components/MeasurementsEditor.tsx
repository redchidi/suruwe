'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Gender, MeasurementUnit, getMeasurementSections } from '@/types';
import { MaleIcon, FemaleIcon } from './Icons';
import { MaleTopGuide, MaleBottomGuide, FemaleTopGuide, FemaleBottomGuide } from './MeasurementGuides';

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
  const [showGuide, setShowGuide] = useState<Record<string, boolean>>({});

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

  return (
    <div>
      {/* Gender + Unit toggles */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 24,
      }}>
        {/* Gender */}
        <div style={{
          display: 'flex', gap: 4,
          background: 'var(--cream-2)', borderRadius: 8, padding: 3,
        }}>
          <button
            onClick={() => onGenderChange('male')}
            style={{
              padding: '8px 16px', borderRadius: 6,
              fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 500,
              border: 'none', cursor: 'pointer',
              background: gender === 'male' ? 'white' : 'transparent',
              color: gender === 'male' ? 'var(--ink)' : 'var(--ink-soft)',
              boxShadow: gender === 'male' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 200ms ease',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            <MaleIcon />
          </button>
          <button
            onClick={() => onGenderChange('female')}
            style={{
              padding: '8px 16px', borderRadius: 6,
              fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 500,
              border: 'none', cursor: 'pointer',
              background: gender === 'female' ? 'white' : 'transparent',
              color: gender === 'female' ? 'var(--ink)' : 'var(--ink-soft)',
              boxShadow: gender === 'female' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 200ms ease',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            <FemaleIcon />
          </button>
        </div>

        {/* Unit toggle */}
        <div style={{
          display: 'flex', gap: 4,
          background: 'var(--cream-2)', borderRadius: 8, padding: 3,
        }}>
          <button
            onClick={() => onUnitChange('inches')}
            style={{
              padding: '8px 14px', borderRadius: 6,
              fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600,
              letterSpacing: '0.06em',
              border: 'none', cursor: 'pointer',
              background: unit === 'inches' ? 'var(--gold)' : 'transparent',
              color: unit === 'inches' ? 'var(--charcoal)' : 'var(--ink-soft)',
              transition: 'all 200ms ease',
            }}
          >
            in
          </button>
          <button
            onClick={() => onUnitChange('cm')}
            style={{
              padding: '8px 14px', borderRadius: 6,
              fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600,
              letterSpacing: '0.06em',
              border: 'none', cursor: 'pointer',
              background: unit === 'cm' ? 'var(--gold)' : 'transparent',
              color: unit === 'cm' ? 'var(--charcoal)' : 'var(--ink-soft)',
              transition: 'all 200ms ease',
            }}
          >
            cm
          </button>
        </div>
      </div>

      {/* Measurement sections */}
      {Object.entries(sections).map(([sectionKey, fields]) => (
        <div key={sectionKey} style={{ marginBottom: 28 }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: 14,
          }}>
            <h3 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 18, fontWeight: 300,
              color: 'var(--ink)',
            }}>
              {t(`measurementSections.${sectionKey}`)}
            </h3>
            {guideSectionKeys.includes(sectionKey) && (
              <button
                onClick={() => toggleGuide(sectionKey)}
                style={{
                  fontSize: 11, fontWeight: 500, letterSpacing: '0.04em',
                  color: 'var(--gold)', background: 'none',
                  border: '0.5px solid var(--gold-bdr)', cursor: 'pointer',
                  padding: '3px 10px', borderRadius: 12,
                  fontFamily: 'var(--font-body)',
                }}
              >
                {showGuide[sectionKey] ? t('measurements.hideGuide') : t('measurements.showGuide')}
              </button>
            )}
          </div>

          {/* Guide image */}
          {guideSectionKeys.includes(sectionKey) && showGuide[sectionKey] && (
            <div style={{ marginBottom: 16 }}>
              {getGuideForSectionKey(sectionKey)}
            </div>
          )}

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '10px 12px',
          }}>
            {fields.map((field) => (
              <div key={field.key}>
                <label style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 10, fontWeight: 600,
                  letterSpacing: '0.14em', textTransform: 'uppercase' as const,
                  color: 'var(--ink-soft)', opacity: 0.6,
                  display: 'block', marginBottom: 6,
                }}>
                  {t(`measurementLabels.${gender}.${field.key}`)}
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.5"
                  placeholder="--"
                  value={measurements[field.key] ?? ''}
                  onChange={(e) => handleFieldChange(field.key, e.target.value)}
                  className="input-cream"
                  style={{ padding: '10px 12px', fontSize: 14, textAlign: 'center' }}
                />
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Measurement notes */}
      <div style={{ marginBottom: 24 }}>
        <h3 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 18, fontWeight: 300,
          color: 'var(--ink)', marginBottom: 8,
        }}>
          {t('measurements.notesTitle')}
        </h3>
        <p style={{
          fontSize: 13, color: 'var(--ink-soft)', margin: '0 0 10px 0',
          lineHeight: 1.55, fontFamily: 'var(--font-body)', fontWeight: 300,
        }}>
          {t('measurements.notesDescription')}
        </p>
        <textarea
          rows={3}
          placeholder={t('measurements.notesPlaceholder')}
          value={measurementNotes}
          onChange={(e) => onNotesChange?.(e.target.value)}
          className="textarea-cream"
        />
      </div>

      <button
        className="btn-charcoal"
        onClick={onSave}
        disabled={saving}
      >
        <span>{saving ? t('common.saving') : (saveLabel || t('measurements.saveMeasurements'))}</span>
        <span className="arrow">&rarr;</span>
      </button>
    </div>
  );
}
