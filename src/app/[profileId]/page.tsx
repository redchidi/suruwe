import { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';
import ProfileViewClient from './ProfileViewClient';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://suruwe.vercel.app';

interface Props {
  params: { profileId: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { data: profileData } = await supabase
    .from('profiles')
    .select('*')
    .eq('slug', params.profileId)
    .single();

  if (!profileData) {
    return {
      title: 'Profile not found | Suruwe',
      description: 'This profile does not exist.',
    };
  }

  const { count: photoCount } = await supabase
    .from('profile_photos')
    .select('*', { count: 'exact', head: true })
    .eq('profile_id', profileData.id);

  const measurementCount = profileData.measurements
    ? Object.keys(profileData.measurements).filter(
        (k) => profileData.measurements[k] != null
      ).length
    : 0;

  const title = `${profileData.name}'s Measurements | Suruwe`;
  const description = `${measurementCount} measurements and ${photoCount || 0} photos ready for you.`;

  const ogParams = new URLSearchParams({
    name: profileData.name,
    description: 'Measurement Profile',
    measurements: String(measurementCount),
    photos: String(photoCount || 0),
    type: 'profile',
  });

  const ogImageUrl = `${APP_URL}/api/og?${ogParams.toString()}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      siteName: 'Suruwe',
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `${profileData.name}'s measurement profile on Suruwe`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImageUrl],
    },
  };
}

export default function TailorViewPage({ params }: Props) {
  return <ProfileViewClient params={params} />;
}
