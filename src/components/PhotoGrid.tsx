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

  // Auto-trigger file picker when profile was just created
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
          .insert({
            profile_id: profileId,
            url,
            sort_order: photos.length,
          })
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

  if (photos.length === 0 && editable) {
    return (
      <>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple={maxPhotos > 1}
          onChange={handleUpload}
          style={{ display: 'none' }}
        />
        <div className="photo-add-compact" onClick={() => fileRef.current?.click()}>
          <CameraIcon size={24} />
          <span>
            {uploading
              ? 'Uploading...'
              : maxPhotos === 1
              ? 'Add a photo of yourself so your tailor can see your frame'
              : 'Add photos'}
          </span>
        </div>
      </>
    );
  }

  return (
    <>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple={maxPhotos > 1}
        onChange={handleUpload}
        style={{ display: 'none' }}
      />
      <div className="photos-grid-square">
        {photos.map((photo) => (
          <div
            key={photo.id}
            className="photo-tile"
            onClick={() => setLightboxUrl(photo.url)}
          >
            <img src={photo.url} alt="Profile photo" loading="lazy" />
            {editable && (
              <button
                className="photo-delete"
                onClick={(e) => handleDelete(e, photo.id)}
              >
                <XIcon size={14} />
              </button>
            )}
          </div>
        ))}
        {editable && photos.length < maxPhotos && (
          <div
            className="photo-tile photo-tile-add"
            onClick={() => fileRef.current?.click()}
          >
            {uploading ? (
              <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} />
            ) : (
              <CameraIcon size={20} />
            )}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxUrl && (
        <div className="photo-lightbox" onClick={() => setLightboxUrl(null)}>
          <button
            className="photo-lightbox-close"
            onClick={() => setLightboxUrl(null)}
          >
            <XIcon size={20} />
          </button>
          <img
            src={lightboxUrl}
            alt="Full size photo"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
