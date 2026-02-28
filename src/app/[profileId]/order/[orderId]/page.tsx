import { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';
import OrderViewClient from './OrderViewClient';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://suruwe.vercel.app';

interface Props {
  params: { profileId: string; orderId: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { data: profileData } = await supabase
    .from('profiles')
    .select('*')
    .eq('slug', params.profileId)
    .single();

  if (!profileData) {
    return {
      title: 'Order not found | Suruwe',
      description: 'This order does not exist.',
    };
  }

  const { data: orderData } = await supabase
    .from('orders')
    .select('*')
    .eq('id', params.orderId)
    .eq('profile_id', profileData.id)
    .single();

  if (!orderData) {
    return {
      title: 'Order not found | Suruwe',
      description: 'This order does not exist.',
    };
  }

  // Count photos and measurements
  const { count: photoCount } = await supabase
    .from('profile_photos')
    .select('*', { count: 'exact', head: true })
    .eq('profile_id', profileData.id);

  const measurementCount = profileData.measurements
    ? Object.keys(profileData.measurements).filter(
        (k) => profileData.measurements[k] != null
      ).length
    : 0;

  const title = `${profileData.name}'s Order: ${orderData.description}`;
  const description = orderData.fit_notes
    ? `${orderData.description}. ${orderData.fit_notes.slice(0, 100)}`
    : `${orderData.description}. Measurements, photos, and fit details ready for you.`;

  // Build OG image URL with order-specific params
  const ogParams = new URLSearchParams({
    name: profileData.name,
    description: orderData.description,
    tailor: orderData.tailor_name,
    measurements: String(measurementCount),
    photos: String(photoCount || 0),
    type: 'order',
  });

  const ogImageUrl = `${APP_URL}/api/og?${ogParams.toString()}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description: `Measurements, photos, and fit notes for: ${orderData.description}`,
      type: 'website',
      siteName: 'Suruwe',
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `${profileData.name}'s order on Suruwe`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: `Measurements, photos, and fit notes for: ${orderData.description}`,
      images: [ogImageUrl],
    },
  };
}

export default function TailorOrderViewPage({ params }: Props) {
  return <OrderViewClient params={params} />;
}
