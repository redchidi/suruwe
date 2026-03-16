'use client';

import { useState, useRef } from 'react';
import AIImageGenerator from './AIImageGenerator';

interface ReferenceImagePickerProps {
  onFilesSelected: (files: File[], previews: string[]) => void;
  generationsUsed: number;
  onGenerationUsed: () => void;
  maxGenerations: number;
}

export default function ReferenceImagePicker({
  onFilesSelected,
  generationsUsed,
  onGenerationUsed,
  maxGenerations,
}: ReferenceImagePickerProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleAddTap = () => {
    setShowPicker(true);
  };

  const handleUploadFromPhotos = () => {
    setShowPicker(false);
    fileRef.current?.click();
  };

  const handleGenerateWithAI = () => {
    setShowPicker(false);
    setShowAIGenerator(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    const previews = fileArray.map((f) => URL.createObjectURL(f));
    onFilesSelected(fileArray, previews);

    if (fileRef.current) fileRef.current.value = '';
  };

  const handleAIImageGenerated = (file: File, previewUrl: string) => {
    onFilesSelected([file], [previewUrl]);
    onGenerationUsed();
    setShowAIGenerator(false);
  };

  const remaining = maxGenerations - generationsUsed;

  return (
    <>
      {/* The "+" add button */}
      <button
        onClick={handleAddTap}
        style={{
          width: 56, height: 56, borderRadius: 8,
          background: 'transparent',
          border: '0.5px dashed rgba(20,16,12,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18, color: 'var(--ink-soft)', opacity: 0.4, cursor: 'pointer',
        }}
      >+</button>

      {/* Hidden file input */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      {/* Picker sheet: Upload or Generate */}
      {showPicker && (
        <div className="ref-picker-overlay" onClick={() => setShowPicker(false)}>
          <div className="ref-picker-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="ref-picker-title">Add reference image</div>

            <button className="ref-picker-option" onClick={handleUploadFromPhotos}>
              <div className="ref-picker-icon photos">
                <svg viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="1.5" y="3" width="15" height="12" rx="2" stroke="var(--ink-soft)" strokeWidth="1.2"/>
                  <circle cx="6" cy="7.5" r="1.5" stroke="var(--ink-soft)" strokeWidth="1.2"/>
                  <path d="M1.5 12.5l4-3.5 3 2.5 2.5-2 3.5 3" stroke="var(--ink-soft)" strokeWidth="1.2" strokeLinejoin="round"/>
                </svg>
              </div>
              <div>
                <div className="ref-picker-option-label">Upload from photos</div>
                <div className="ref-picker-option-desc">Choose from your camera roll</div>
              </div>
            </button>

            <button
              className="ref-picker-option"
              onClick={handleGenerateWithAI}
              style={remaining <= 0 ? { opacity: 0.4, pointerEvents: 'none' as const } : {}}
            >
              <div className="ref-picker-icon ai">
                <svg viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 2l1.5 4.5L15 8l-4.5 1.5L9 14l-1.5-4.5L3 8l4.5-1.5L9 2z" stroke="var(--gold)" strokeWidth="1.2" strokeLinejoin="round"/>
                  <path d="M14 2l.5 1.5L16 4l-1.5.5L14 6l-.5-1.5L12 4l1.5-.5L14 2z" stroke="var(--gold)" strokeWidth="0.8" strokeLinejoin="round"/>
                </svg>
              </div>
              <div>
                <div className="ref-picker-option-label">Generate with AI</div>
                <div className="ref-picker-option-desc">
                  {remaining > 0
                    ? `Describe it, we'll create it · ${remaining} left`
                    : 'Limit reached for this order'}
                </div>
              </div>
            </button>

            <button className="ref-picker-cancel" onClick={() => setShowPicker(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* AI Generator sheet */}
      {showAIGenerator && (
        <AIImageGenerator
          onImageGenerated={handleAIImageGenerated}
          onClose={() => setShowAIGenerator(false)}
          generationsUsed={generationsUsed}
          maxGenerations={maxGenerations}
        />
      )}
    </>
  );
}
