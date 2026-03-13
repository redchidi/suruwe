'use client';

import { useRef, useState, useEffect } from 'react';
import { CameraIcon, XIcon } from './Icons';
import { ProfilePhoto } from '@/types';
import { uploadImage } from '@/lib/upload';
import { supabase } from '@/lib/supabase';

interface PhotoGridProps {
  photos: ProfilePhoto[];
  profileId: string;
  onPhotosChange: (photos: ProfilePhoto[]) => void;
  editable?: boolean;
  autoTriggerUpload?: boolean;
  onAutoTriggerConsumed?: () => void;
  maxPhotos?: number;
}

export default function PhotoGrid({
  photos,
  profileId,
  onPhotosChange,
  editable = true,
  autoTriggerUpload = false,
  onAutoTriggerConsumed,
  maxPhotos = 6,
}: PhotoGridProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (autoTriggerUpload && fileRef.current) {
      fileRef.current.click();
      onAutoTriggerConsumed?.();
    }
  }, [autoTriggerUpload, onAutoTriggerConsumed]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    for (const file of Array.from(files)) {
      const url = await uploadImage(file, `profiles/${profileId}`);
      if (url) {
        const { data, error } = await supabase
          .from('profile_photos')
          .insert({ profile_id: profileId, url, sort_order: photos.length })
          .select()
          .single();
        if (data && !error) {
          onPhotosChange([...photos, data]);
        }
      }
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleDelete = async (e: React.MouseEvent, photoId: string) => {
    e.stopPropagation();
    await supabase.from('profile_photos').delete().eq('id', photoId);
    onPhotosChange(photos.filter((p) => p.id !== photoId));
  };

  // Empty state: cream surface add-photo prompt
  if (photos.length === 0 && editable) {
    return (
      <>
        <input ref={fileRef} type="file" accept="image/*" multiple={maxPhotos > 1} onChange={handleUpload} style={{ display: 'none' }} />
        <div
          onClick={() => fileRef.current?.click()}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            padding: '36px 24px',
            border: '1.5px dashed rgba(20,16,12,0.12)',
            borderRadius: 12,
            cursor: 'pointer',
            background: 'white',
            transition: 'border-color 200ms',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--gold)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(20,16,12,0.12)'; }}
        >
          <div style={{
            width: 48, height: 48, borderRadius: '50%',
            background: 'var(--gold-dim)', border: '0.5px solid var(--gold-bdr)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <CameraIcon size={22} />
          </div>
          <span style={{
            fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 400,
            color: 'var(--ink-soft)', textAlign: 'center', lineHeight: 1.5,
          }}>
            {uploading
              ? 'Uploading...'
              : maxPhotos === 1
                ? 'Add a photo of yourself so your tailor can see your frame'
                : 'Add a body photo so your tailor can see your frame'
            }
          </span>
          <span style={{
            fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 500,
            letterSpacing: '0.08em', color: 'var(--gold)', marginTop: 4,
          }}>
            TAP TO UPLOAD
          </span>
        </div>
      </>
    );
  }

  return (
    <>
      <input ref={fileRef} type="file" accept="image/*" multiple={maxPhotos > 1} onChange={handleUpload} style={{ display: 'none' }} />

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 8,
      }}>
        {photos.map((photo) => (
          <div
            key={photo.id}
            onClick={() => setLightboxUrl(photo.url)}
            style={{
              position: 'relative',
              aspectRatio: '3 / 4',
              borderRadius: 10,
              overflow: 'hidden',
              cursor: 'pointer',
              background: 'var(--cream-3)',
            }}
          >
            <img
              src={photo.url}
              alt="Profile photo"
              loading="lazy"
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
            {editable && (
              <button
                onClick={(e) => handleDelete(e, photo.id)}
                style={{
                  position: 'absolute', top: 6, right: 6,
                  width: 24, height: 24, borderRadius: '50%',
                  background: 'rgba(0,0,0,0.5)', border: 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: 'white',
                }}
              >
                <XIcon size={12} />
              </button>
            )}
          </div>
        ))}

        {editable && photos.length < maxPhotos && (
          <div
            onClick={() => fileRef.current?.click()}
            style={{
              aspectRatio: '3 / 4',
              borderRadius: 10,
              border: '1.5px dashed rgba(20,16,12,0.12)',
              background: 'white',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              cursor: 'pointer',
            }}
          >
            {uploading ? (
              <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} />
            ) : (
              <>
                <CameraIcon size={20} />
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 500, color: 'var(--ink-soft)', opacity: 0.5 }}>
                  Add
                </span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxUrl && (
        <div
          onClick={() => setLightboxUrl(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'rgba(0,0,0,0.9)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <button
            onClick={() => setLightboxUrl(null)}
            style={{
              position: 'absolute', top: 16, right: 16, zIndex: 210,
              width: 40, height: 40, borderRadius: '50%',
              background: 'rgba(255,255,255,0.15)', border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'white',
            }}
          >
            <XIcon size={20} />
          </button>
          <img
            src={lightboxUrl}
            alt="Full size photo"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '90vw', maxHeight: '85vh',
              objectFit: 'contain', borderRadius: 8,
            }}
          />
        </div>
      )}
    </>
  );
}
