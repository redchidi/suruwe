'use client';

import { useState, useRef } from 'react';

interface AIImageGeneratorProps {
  onImageGenerated: (file: File, previewUrl: string) => void;
  onClose: () => void;
  generationsUsed: number;
  maxGenerations: number;
}

export default function AIImageGenerator({
  onImageGenerated,
  onClose,
  generationsUsed,
  maxGenerations,
}: AIImageGeneratorProps) {
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [refImagePreview, setRefImagePreview] = useState<string | null>(null);
  const [refImageB64, setRefImageB64] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const refImageInputRef = useRef<HTMLInputElement>(null);

  const remaining = maxGenerations - generationsUsed;

  const handleRefImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const preview = URL.createObjectURL(file);
    setRefImagePreview(preview);

    // Convert to base64 for the API
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Strip the data:image/...;base64, prefix
      const b64 = result.split(',')[1];
      setRefImageB64(b64);
    };
    reader.readAsDataURL(file);

    if (refImageInputRef.current) refImageInputRef.current.value = '';
  };

  const removeRefImage = () => {
    if (refImagePreview) URL.revokeObjectURL(refImagePreview);
    setRefImagePreview(null);
    setRefImageB64(null);
  };

  const handleGenerate = async () => {
    if (!prompt.trim() || generating || remaining <= 0) return;

    setGenerating(true);
    setError('');
    setPreviewUrl(null);
    setPreviewFile(null);

    try {
      const body: any = {
        prompt: prompt.trim(),
        generationCount: generationsUsed,
      };

      if (refImageB64) {
        body.referenceImage = refImageB64;
      }

      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Generation failed. Please try again.');
        setGenerating(false);
        return;
      }

      // Convert base64 to File object
      const byteString = atob(data.image);
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      const blob = new Blob([ab], { type: 'image/png' });
      const file = new File([blob], \`ai-reference-\${Date.now()}.png\`, {
        type: 'image/png',
      });

      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
      setPreviewFile(file);
    } catch (err) {
      setError('Something went wrong. Please try again.');
    }

    setGenerating(false);
  };

  const handleUseImage = () => {
    if (previewFile && previewUrl) {
      onImageGenerated(previewFile, previewUrl);
    }
  };

  const handleTryAgain = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setPreviewFile(null);
    setError('');
    textareaRef.current?.focus();
  };

  return (
    <div className="ai-gen-overlay">
      <div className="ai-gen-sheet">
        {/* Header */}
        <div className="ai-gen-header">
          <div>
            <div className="ai-gen-title">Generate reference image</div>
            <div className="ai-gen-subtitle">
              Describe what you want made. Add a photo to guide the style.
            </div>
          </div>
          <button className="ai-gen-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        {/* Preview state */}
        {previewUrl ? (
          <div className="ai-gen-preview-area">
            <div className="ai-gen-preview-img-wrap">
              <img src={previewUrl} alt="Generated reference" className="ai-gen-preview-img" />
            </div>
            <div className="ai-gen-preview-actions">
              <button className="ai-gen-btn-use" onClick={handleUseImage}>
                <span>Use this image</span>
                <span>→</span>
              </button>
              {remaining > 0 && (
                <button className="ai-gen-btn-retry" onClick={handleTryAgain}>
                  Try again ({remaining - 1} left)
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Reference image upload */}
            <div className="ai-gen-ref-section">
              <label className="ai-gen-label">Reference photo (optional)</label>
              <input
                ref={refImageInputRef}
                type="file"
                accept="image/*"
                onChange={handleRefImageSelect}
                style={{ display: 'none' }}
              />
              {refImagePreview ? (
                <div className="ai-gen-ref-preview">
                  <img src={refImagePreview} alt="Reference" className="ai-gen-ref-img" />
                  <button className="ai-gen-ref-remove" onClick={removeRefImage} aria-label="Remove">
                    ✕
                  </button>
                </div>
              ) : (
                <button
                  className="ai-gen-ref-add"
                  onClick={() => refImageInputRef.current?.click()}
                  disabled={generating}
                >
                  <svg viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" width="18" height="18">
                    <rect x="1.5" y="3" width="15" height="12" rx="2" stroke="var(--ink-soft)" strokeWidth="1.2"/>
                    <circle cx="6" cy="7.5" r="1.5" stroke="var(--ink-soft)" strokeWidth="1.2"/>
                    <path d="M1.5 12.5l4-3.5 3 2.5 2.5-2 3.5 3" stroke="var(--ink-soft)" strokeWidth="1.2" strokeLinejoin="round"/>
                  </svg>
                  <span>Add a fabric, pattern, or style photo</span>
                </button>
              )}
            </div>

            {/* Prompt input */}
            <div className="ai-gen-input-area">
              <label className="ai-gen-label">Describe the garment</label>
              <textarea
                ref={textareaRef}
                className="ai-gen-textarea"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={refImagePreview
                  ? 'e.g. Make a long dress using this fabric pattern, off-shoulder, mermaid silhouette'
                  : 'e.g. Long ankara dress, off-shoulder, mermaid silhouette, blue and gold pattern'
                }
                rows={3}
                maxLength={500}
                disabled={generating}
                autoFocus
              />
              <div className="ai-gen-char-count">
                {prompt.length}/500
              </div>
            </div>

            {error && (
              <div className="ai-gen-error">{error}</div>
            )}

            {/* Generate button */}
            <div className="ai-gen-footer">
              <button
                className="ai-gen-btn-generate"
                onClick={handleGenerate}
                disabled={!prompt.trim() || generating || remaining <= 0}
              >
                {generating ? (
                  <span className="ai-gen-loading">
                    <span className="ai-gen-spinner" />
                    Generating...
                  </span>
                ) : (
                  <>
                    <span>Generate</span>
                    <span>→</span>
                  </>
                )}
              </button>
              <div className="ai-gen-remaining">
                {remaining} of {maxGenerations} generations remaining
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
