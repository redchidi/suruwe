'use client';

import { useRef } from 'react';
import { CameraIcon, XIcon } from './Icons';
import { ProfilePhoto } from '@/types';
import { uploadImage } from '@/lib/upload';
import { supabase } from '@/lib/supabase';

interface PhotoGridProps {
  photos: ProfilePhoto[];
  profileId: string;
  onPhotosChange: (photos: ProfilePhoto[]) => void;
  editable?: boolean;
}

export default function PhotoGrid({ photos, profileId, onPhotosChange, editable = true }: PhotoGridProps) {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

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
    // Reset input
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleDelete = async (photoId: string) => {
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
          multiple
          onChange={handleUpload}
          style={{ display: 'none' }}
        />
        <div className="photo-add" onClick={() => fileRef.current?.click()}>
          <CameraIcon size={32} />
          <span>Add a photo of yourself so your tailor can see your frame</span>
        </div>
      </>
    );
  }

  const gridClass = photos.length === 1 ? 'single' : photos.length === 2 ? 'two' : '';

  return (
    <>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleUpload}
        style={{ display: 'none' }}
      />
      <div className={`photos-grid ${gridClass}`}>
        {photos.map((photo) => (
          <div key={photo.id} className="photo-item">
            <img src={photo.url} alt="Profile photo" loading="lazy" />
            {editable && (
              <button
                className="photo-delete"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(photo.id);
                }}
              >
                <XIcon size={14} />
              </button>
            )}
          </div>
        ))}
        {editable && photos.length < 6 && (
          <div
            className="photo-item"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
            onClick={() => fileRef.current?.click()}
          >
            <CameraIcon size={24} className="text-muted" />
          </div>
        )}
      </div>
    </>
  );
}
