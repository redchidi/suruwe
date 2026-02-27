'use client';

import { useState } from 'react';
import { Gender, MeasurementUnit, getMeasurementSections } from '@/types';
import { MaleIcon, FemaleIcon } from './Icons';

interface MeasurementsEditorProps {
  gender: Gender;
  unit: MeasurementUnit;
  measurements: Record<string, number>;
  onGenderChange: (gender: Gender) => void;
  onUnitChange: (unit: MeasurementUnit) => void;
  onMeasurementsChange: (measurements: Record<string, number>) => void;
  onSave: () => void;
  saving?: boolean;
}

export default function MeasurementsEditor({
  gender,
  unit,
  measurements,
  onGenderChange,
  onUnitChange,
  onMeasurementsChange,
  onSave,
  saving,
}: MeasurementsEditorProps) {
  const sections = getMeasurementSections(gender);

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
          <div className="measurement-section-title">{sectionName}</div>
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

      <button
        className="btn btn-primary btn-full mt-16"
        onClick={onSave}
        disabled={saving}
      >
        {saving ? 'Saving...' : 'Save Measurements'}
      </button>
    </div>
  );
}
