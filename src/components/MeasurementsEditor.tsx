'use client';

import { useState } from 'react';
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
  const sections = getMeasurementSections(gender);
  const [showGuide, setShowGuide] = useState<Record<string, boolean>>({});

  const toggleGuide = (section: string) => {
    setShowGuide((prev) => ({ ...prev, [section]: !prev[section] }));
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

  const getGuideForSection = (sectionName: string) => {
    const isTop = sectionName === 'Upper Body' || sectionName === 'Arms';
    if (gender === 'male') {
      return isTop ? <MaleTopGuide /> : <MaleBottomGuide />;
    }
    return isTop ? <FemaleTopGuide /> : <FemaleBottomGuide />;
  };

  const guideSections = ['Upper Body', 'Lower Body'];

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
      {Object.entries(sections).map(([sectionName, fields]) => (
        <div key={sectionName} className="measurement-section">
          <div className="measurement-section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>{sectionName}</span>
            {guideSections.includes(sectionName) && (
              <button
                onClick={() => toggleGuide(sectionName)}
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
                {showGuide[sectionName] ? 'Hide guide' : 'Show guide'}
              </button>
            )}
          </div>

          {/* Guide image */}
          {guideSections.includes(sectionName) && showGuide[sectionName] && (
            <div style={{ marginBottom: 16 }}>
              {getGuideForSection(sectionName)}
            </div>
          )}

          <div className="measurement-fields">
            {fields.map((field) => (
              <div key={field.key} className="measurement-field">
                <label>{field.label}</label>
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
        <div className="measurement-section-title">Notes</div>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 8px 0', lineHeight: 1.5 }}>
          Any measurements your tailor took that are not listed above, or other notes.
        </p>
        <textarea
          rows={3}
          placeholder="e.g. Round back adjustment +1in, front rise 11in"
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
        {saving ? 'Saving...' : (saveLabel || 'Save Measurements')}
      </button>
    </div>
  );
}
