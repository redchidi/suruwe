'use client';

import { useState, useRef } from 'react';
import { MeasurementUnit, Gender, getMeasurementFields } from '@/types';

interface MeasurementImportProps {
  gender: Gender;
  unit: MeasurementUnit;
  existingMeasurements: Record<string, number>;
  onImport: (measurements: Record<string, number>, unit?: MeasurementUnit) => void;
  onClose: () => void;
}

type ImportState = 'idle' | 'extracting' | 'review' | 'error';

export default function MeasurementImport({
  gender,
  unit,
  existingMeasurements,
  onImport,
  onClose,
}: MeasurementImportProps) {
  const [state, setState] = useState<ImportState>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [extracted, setExtracted] = useState<Record<string, number>>({});
  const [detectedUnit, setDetectedUnit] = useState<MeasurementUnit | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const knownKeys = new Set(getMeasurementFields(gender).map((f) => f.key));

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please choose an image file.');
      setState('error');
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);

    setState('extracting');
    setErrorMsg('');

    try {
      const b64 = await fileToBase64(file);

      const res = await fetch('/api/extract-measurements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: b64, mediaType: file.type }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setErrorMsg(data.error ?? 'Extraction failed. Please try again.');
        setState('error');
        return;
      }

      const raw = data.measurements ?? {};

      // Separate the unit field from numeric values
      const inferredUnit = raw.unit === 'cm' ? 'cm' : raw.unit === 'inches' ? 'inches' : null;
      if (inferredUnit) setDetectedUnit(inferredUnit as MeasurementUnit);

      // Only keep numeric values that match known field keys
      const numeric: Record<string, number> = {};
      for (const [key, val] of Object.entries(raw)) {
        if (key === 'unit') continue;
        if (typeof val === 'number' && !isNaN(val) && knownKeys.has(key)) {
          numeric[key] = val;
        }
      }

      if (Object.keys(numeric).length === 0) {
        setErrorMsg(
          'No measurements could be read from this image. Try a clearer photo with labeled measurements.'
        );
        setState('error');
        return;
      }

      setExtracted(numeric);
      setState('review');
    } catch {
      setErrorMsg('Something went wrong. Please try again.');
      setState('error');
    }
  };

  const handleFieldChange = (key: string, value: string) => {
    const num = parseFloat(value);
    setExtracted((prev) => {
      const next = { ...prev };
      if (isNaN(num) || value === '') {
        delete next[key];
      } else {
        next[key] = num;
      }
      return next;
    });
  };

  const handleConfirm = () => {
    onImport(extracted, detectedUnit ?? undefined);
    onClose();
  };

  const allFields = getMeasurementFields(gender);
  const reviewFields = allFields.filter((f) => extracted[f.key] !== undefined);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(20,16,12,0.72)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        zIndex: 100,
        backdropFilter: 'blur(4px)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: 'var(--cream)',
          borderRadius: '20px 20px 0 0',
          width: '100%',
          maxWidth: 480,
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '28px 24px 48px',
        }}
      >
        {/* Handle bar */}
        <div
          style={{
            width: 36,
            height: 3,
            background: 'var(--cream-3)',
            borderRadius: 2,
            margin: '0 auto 24px',
          }}
        />

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <div
            style={{
              fontSize: 9,
              fontWeight: 600,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: 'var(--gold)',
              marginBottom: 8,
              fontFamily: 'var(--font-body)',
            }}
          >
            Import measurements
          </div>
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 24,
              fontWeight: 300,
              color: 'var(--ink)',
              lineHeight: 1.15,
            }}
          >
            {state === 'review'
              ? 'Review before saving'
              : 'Import from a photo'}
          </div>
          {state === 'idle' && (
            <p
              style={{
                fontSize: 13,
                fontWeight: 300,
                color: 'var(--ink-soft)',
                lineHeight: 1.6,
                marginTop: 8,
                fontFamily: 'var(--font-body)',
              }}
            >
              Take a photo of your measurements sheet or screenshot, and
              Suruwe will read the values for you.
            </p>
          )}
          {state === 'review' && detectedUnit && detectedUnit !== unit && (
            <div
              style={{
                marginTop: 10,
                padding: '8px 12px',
                background: 'rgba(184,146,74,0.08)',
                border: '0.5px solid var(--gold-bdr)',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 400,
                color: 'var(--ink-soft)',
                fontFamily: 'var(--font-body)',
              }}
            >
              Measurements detected in{' '}
              <strong style={{ color: 'var(--gold)' }}>{detectedUnit}</strong>.
              Your profile is set to {unit}. The values below will be saved
              in {detectedUnit} and your unit preference will be updated.
            </div>
          )}
        </div>

        {/* IDLE — upload prompt */}
        {state === 'idle' && (
          <>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              style={{ display: 'none' }}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />
            <button
              onClick={() => fileRef.current?.click()}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: 12,
                width: '100%',
                padding: '32px 20px',
                background: 'transparent',
                border: '0.5px dashed rgba(20,16,12,0.2)',
                borderRadius: 12,
                cursor: 'pointer',
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  background: 'var(--gold-dim)',
                  border: '0.5px solid var(--gold-bdr)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                  <rect x="2" y="6" width="18" height="14" rx="2" stroke="var(--gold)" strokeWidth="1.3" />
                  <circle cx="11" cy="13" r="3.5" stroke="var(--gold)" strokeWidth="1.3" />
                  <path d="M8 6l1.5-2.5h3L14 6" stroke="var(--gold)" strokeWidth="1.3" strokeLinejoin="round" />
                </svg>
              </div>
              <div>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: 'var(--ink)',
                    fontFamily: 'var(--font-body)',
                    marginBottom: 3,
                  }}
                >
                  Choose photo or screenshot
                </div>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 300,
                    color: 'var(--ink-soft)',
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  Works best with clear, labeled measurements
                </div>
              </div>
            </button>
            <button
              onClick={onClose}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'center',
                fontSize: 11,
                fontWeight: 500,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'var(--muted-c)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'var(--font-body)',
                padding: '12px 0',
              }}
            >
              Cancel
            </button>
          </>
        )}

        {/* EXTRACTING */}
        {state === 'extracting' && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 20,
              padding: '32px 0',
            }}
          >
            {preview && (
              <div
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: 12,
                  overflow: 'hidden',
                  border: '0.5px solid var(--cream-3)',
                }}
              >
                <img
                  src={preview}
                  alt=""
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
            )}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <div
                style={{
                  width: 24,
                  height: 24,
                  border: '2px solid var(--cream-3)',
                  borderTop: '2px solid var(--gold)',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                }}
              />
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 300,
                  color: 'var(--ink-soft)',
                  fontFamily: 'var(--font-body)',
                }}
              >
                Reading measurements...
              </div>
            </div>
          </div>
        )}

        {/* ERROR */}
        {state === 'error' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {preview && (
              <div
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 10,
                  overflow: 'hidden',
                  border: '0.5px solid var(--cream-3)',
                }}
              >
                <img
                  src={preview}
                  alt=""
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
            )}
            <div
              style={{
                padding: '12px 14px',
                background: '#fdf0ea',
                border: '0.5px solid rgba(196,81,42,0.2)',
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 400,
                color: 'var(--terra)',
                lineHeight: 1.55,
                fontFamily: 'var(--font-body)',
              }}
            >
              {errorMsg}
            </div>
            <button
              onClick={() => {
                setState('idle');
                setPreview(null);
                setErrorMsg('');
                if (fileRef.current) fileRef.current.value = '';
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                padding: '16px 20px',
                background: 'var(--charcoal)',
                color: 'var(--cream)',
                border: 'none',
                borderRadius: 8,
                fontFamily: 'var(--font-body)',
                fontSize: 13,
                fontWeight: 600,
                letterSpacing: '0.06em',
                cursor: 'pointer',
              }}
            >
              <span>Try another photo</span>
              <span>→</span>
            </button>
            <button
              onClick={onClose}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'center',
                fontSize: 11,
                fontWeight: 500,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'var(--muted-c)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'var(--font-body)',
                padding: '12px 0',
              }}
            >
              Cancel
            </button>
          </div>
        )}

        {/* REVIEW */}
        {state === 'review' && (
          <div>
            <p
              style={{
                fontSize: 13,
                fontWeight: 300,
                color: 'var(--ink-soft)',
                lineHeight: 1.6,
                marginBottom: 16,
                fontFamily: 'var(--font-body)',
              }}
            >
              {reviewFields.length} measurement
              {reviewFields.length !== 1 ? 's' : ''} found. The current value
              is shown on the left. Correct the incoming value on the right
              before saving.
            </p>

            {/* Column headers */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 28px 1fr',
                gap: '0 8px',
                marginBottom: 8,
                padding: '0 4px',
              }}
            >
              <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-soft)', opacity: 0.4, fontFamily: 'var(--font-body)', textAlign: 'center' }}>Current</div>
              <div />
              <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--gold)', opacity: 0.7, fontFamily: 'var(--font-body)', textAlign: 'center' }}>Incoming</div>
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                marginBottom: 24,
              }}
            >
              {reviewFields.map((field) => {
                const currentVal = existingMeasurements[field.key];
                const hasExisting = currentVal !== undefined;
                const incomingVal = extracted[field.key];
                const isChanged = hasExisting && currentVal !== incomingVal;

                return (
                  <div key={field.key}>
                    {/* Field label */}
                    <div
                      style={{
                        fontFamily: 'var(--font-body)',
                        fontSize: 10,
                        fontWeight: 600,
                        letterSpacing: '0.14em',
                        textTransform: 'uppercase',
                        color: 'var(--ink-soft)',
                        opacity: 0.5,
                        marginBottom: 5,
                      }}
                    >
                      {field.label.replace(/^[A-Za-z]+\.\s*/, '')}
                    </div>

                    {/* Before → After row */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 28px 1fr',
                        gap: '0 8px',
                        alignItems: 'center',
                      }}
                    >
                      {/* Current value — read only */}
                      <div
                        style={{
                          padding: '10px 12px',
                          fontSize: 14,
                          textAlign: 'center',
                          background: 'var(--cream-2)',
                          border: '0.5px solid rgba(20,16,12,0.08)',
                          borderRadius: 8,
                          fontFamily: 'var(--font-body)',
                          color: hasExisting ? 'var(--ink-soft)' : 'rgba(20,16,12,0.2)',
                          fontWeight: hasExisting ? 400 : 300,
                        }}
                      >
                        {hasExisting ? currentVal : 'Empty'}
                      </div>

                      {/* Arrow */}
                      <div
                        style={{
                          textAlign: 'center',
                          fontSize: 14,
                          color: isChanged ? 'var(--gold)' : 'var(--cream-3)',
                          fontWeight: 400,
                        }}
                      >
                        →
                      </div>

                      {/* Incoming value — editable */}
                      <input
                        type="number"
                        inputMode="decimal"
                        step="0.5"
                        value={incomingVal ?? ''}
                        onChange={(e) => handleFieldChange(field.key, e.target.value)}
                        className="input-cream"
                        style={{
                          padding: '10px 12px',
                          fontSize: 14,
                          textAlign: 'center',
                          width: '100%',
                          background: isChanged ? 'rgba(184,146,74,0.08)' : 'white',
                          border: isChanged
                            ? '0.5px solid rgba(184,146,74,0.4)'
                            : '0.5px solid rgba(20,16,12,0.1)',
                          borderRadius: 8,
                          fontFamily: 'var(--font-body)',
                          color: 'var(--ink)',
                          fontWeight: isChanged ? 600 : 400,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={handleConfirm}
              disabled={Object.keys(extracted).length === 0}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                padding: '17px 22px',
                background:
                  Object.keys(extracted).length > 0
                    ? 'var(--charcoal)'
                    : 'var(--cream-3)',
                color:
                  Object.keys(extracted).length > 0
                    ? 'var(--cream)'
                    : 'var(--ink-soft)',
                border: 'none',
                borderRadius: 8,
                fontFamily: 'var(--font-body)',
                fontSize: 13,
                fontWeight: 600,
                letterSpacing: '0.06em',
                cursor:
                  Object.keys(extracted).length > 0 ? 'pointer' : 'default',
                marginBottom: 12,
              }}
            >
              <span>
                Save {Object.keys(extracted).length} measurement
                {Object.keys(extracted).length !== 1 ? 's' : ''}
              </span>
              <span style={{ color: 'var(--gold)' }}>→</span>
            </button>

            <button
              onClick={() => {
                setState('idle');
                setPreview(null);
                setExtracted({});
                setDetectedUnit(null);
                if (fileRef.current) fileRef.current.value = '';
              }}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'center',
                fontSize: 11,
                fontWeight: 500,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'var(--muted-c)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'var(--font-body)',
                padding: '12px 0',
              }}
            >
              Try a different photo
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper: file to base64 (data portion only)
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
