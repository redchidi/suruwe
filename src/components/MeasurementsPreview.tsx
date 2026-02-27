'use client';

import { Gender, MeasurementUnit, getKeyMeasurements, getMeasurementFields } from '@/types';

interface MeasurementsPreviewProps {
  measurements: Record<string, number>;
  gender: Gender;
  unit: MeasurementUnit;
}

export default function MeasurementsPreview({
  measurements,
  gender,
  unit,
}: MeasurementsPreviewProps) {
  const keyKeys = getKeyMeasurements(gender);
  const allFields = getMeasurementFields(gender);
  const unitLabel = unit === 'inches' ? 'in' : 'cm';

  const filledKeys = keyKeys.filter((k) => measurements[k] != null);

  if (filledKeys.length === 0) {
    return (
      <div className="empty-state">
        <p>No measurements added yet. Start a new order and you will be prompted to add them.</p>
      </div>
    );
  }

  return (
    <div className="measurements-preview">
      {filledKeys.map((key) => {
        const field = allFields.find((f) => f.key === key);
        return (
          <div key={key} className="measurement-chip">
            <div className="value">
              {measurements[key]}
              <span className="unit">{unitLabel}</span>
            </div>
            <div className="name">{field?.label || key}</div>
          </div>
        );
      })}
    </div>
  );
}
