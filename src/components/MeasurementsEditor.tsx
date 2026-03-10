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
      {/* Gender toggle */}
      <div className="flex items-center justify-between mb-16">
        <div className="gender-toggle">
          <button
            className={`gender-option ${gender === 'male' ? 'active' : ''}`}
            onClick={() => onGenderChange('male')}
            aria-label="Male measurements"
          >
            <MaleIcon />
          </button>
          <button
            className={`gender-option ${gender === 'female' ? 'active' : ''}`}
            onClick={() => onGenderChange('female')}
            aria-label="Female measurements"
          >
            <FemaleIcon />
          </button>
        </div>
        {/* Unit toggle */}
        <div className="unit-toggle">
          <button
            className={`unit-option ${unit === 'inches' ? 'active' : ''}`}
            onClick={() => onUnitChange('inches')}
          >
            in
          </button>
          <button
            className={`unit-option ${unit === 'cm' ? 'active' : ''}`}
            onClick={() => onUnitChange('cm')}
          >
            cm
          </button>
        </div>
      </div>

      {/* Measurement sections */}
      {Object.entries(sections).map(([sectionKey, fields]) => (
        <div key={sectionKey} className="measurement-section">
          <div
            className="measurement-section-title"
            style={{ display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <span>{t(`measurementSections.${sectionKey}`)}</span>
            {guideSectionKeys.includes(sectionKey) && (
              <button
                onClick={() => toggleGuide(sectionKey)}
                style={{
                  fontSize: 12,
                  color: 'var(--accent)',
                  background: 'none',
                  border: '1px solid var(--accent)',
                  cursor: 'pointer',
                  padding: '2px 10px',
                  borderRadius: 12,
                  opacity: 0.85,
                  fontFamily: 'inherit',
                  lineHeight: 1.6,
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

          <div className="measurement-fields">
            {fields.map((field) => (
              <div key={field.key} className="measurement-field">
                <label>{t(`measurementLabels.${gender}.${field.key}`)}</label>
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.5"
                  placeholder="--"
                  value={measurements[field.key] ?? ''}
                  onChange={(e) => handleFieldChange(field.key, e.target.value)}
                />
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Measurement notes */}
      <div className="measurement-section">
        <div className="measurement-section-title">{t('measurements.notesTitle')}</div>
        <p
          style={{
            fontSize: 13,
            color: 'var(--text-secondary)',
            margin: '0 0 8px 0',
            lineHeight: 1.5,
          }}
        >
          {t('measurements.notesDescription')}
        </p>
        <textarea
          rows={3}
          placeholder={t('measurements.notesPlaceholder')}
          value={measurementNotes}
          onChange={(e) => onNotesChange?.(e.target.value)}
          style={{
            width: '100%',
            fontSize: 15,
            lineHeight: 1.6,
            padding: '12px 14px',
            background: 'var(--input-bg)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            color: 'var(--text)',
            resize: 'vertical',
            fontFamily: 'inherit',
          }}
        />
      </div>

      <button
        className="btn btn-primary btn-full mt-16"
        onClick={onSave}
        disabled={saving}
      >
        {saving ? t('common.saving') : (saveLabel || t('measurements.saveMeasurements'))}
      </button>
    </div>
  );
}
