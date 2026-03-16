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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const remaining = maxGenerations - generationsUsed;

  const handleGenerate = async () => {
    if (!prompt.trim() || generating || remaining <= 0) return;

    setGenerating(true);
    setError('');
    setPreviewUrl(null);
    setPreviewFile(null);

    try {
      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          generationCount: generationsUsed,
        }),
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
      const file = new File([blob], `ai-reference-${Date.now()}.png`, {
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
              Describe what you want made and AI will create a reference image
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
              <button
                className="ai-gen-btn-use"
                onClick={handleUseImage}
              >
                <span>Use this image</span>
                <span>→</span>
              </button>
              {remaining > 0 && (
                <button
                  className="ai-gen-btn-retry"
                  onClick={handleTryAgain}
                >
                  Try again ({remaining - 1} left)
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Prompt input */}
            <div className="ai-gen-input-area">
              <label className="ai-gen-label">Describe the garment</label>
              <textarea
                ref={textareaRef}
                className="ai-gen-textarea"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. Long ankara dress, off-shoulder, mermaid silhouette, blue and gold pattern"
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
