import type { Metadata, Viewport } from 'next';
import './globals.css';

const OG_IMAGE = 'https://lkqiivozdscrwlexwigm.supabase.co/storage/v1/object/public/photos/og/Suruwe%20OG.png';

export const metadata: Metadata = {
  title: 'Suruwe: What you ordered vs what you got. Never again.',
  description: 'Send your tailor your measurements, photos, and fit notes in one link. No more wahala.',
  openGraph: {
    title: 'Suruwe: What you ordered vs what you got. Never again.',
    description: 'Send your tailor your measurements, photos, and fit notes in one link. No more wahala.',
    type: 'website',
    siteName: 'Suruwe',
    url: 'https://suruwe.vercel.app',
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: 'Suruwe: What you ordered vs what you got. Never again.',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Suruwe: What you ordered vs what you got. Never again.',
    description: 'Send your tailor your measurements, photos, and fit notes in one link. No more wahala.',
    images: [OG_IMAGE],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#0C0C0C',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
    </html>
  );
}
