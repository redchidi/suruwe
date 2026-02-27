import { supabase } from './supabase';
import imageCompression from 'browser-image-compression';

export async function uploadImage(
  file: File,
  folder: string
): Promise<string | null> {
  try {
    // Compress image before upload
    const compressed = await imageCompression(file, {
      maxSizeMB: 0.5,
      maxWidthOrHeight: 1200,
      useWebWorker: true,
    });

    const ext = file.name.split('.').pop() || 'jpg';
    const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;

    const { error } = await supabase.storage
      .from('photos')
      .upload(fileName, compressed, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Upload error:', error);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from('photos')
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  } catch (err) {
    console.error('Image compression/upload error:', err);
    return null;
  }
}

export async function uploadMultipleImages(
  files: File[],
  folder: string
): Promise<string[]> {
  const urls: string[] = [];
  for (const file of files) {
    const url = await uploadImage(file, folder);
    if (url) urls.push(url);
  }
  return urls;
}
