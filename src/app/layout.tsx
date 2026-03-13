import type { Metadata, Viewport } from 'next';
import { Analytics } from '@vercel/analytics/react';
import './globals.css';

const OG_IMAGE = 'https://suruwe.vercel.app/og-image.png';

export const metadata: Metadata = {
  title: 'Suruwe: What you ordered is what you get.',
  description: 'Send your tailor your measurements, photos, and fit notes in one link. No more wahala.',
  openGraph: {
    title: 'Suruwe: What you ordered is what you get.',
    description: 'Send your tailor your measurements, photos, and fit notes in one link. No more wahala.',
    type: 'website',
    siteName: 'Suruwe',
    url: 'https://suruwe.vercel.app',
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: 'Suruwe: What you ordered is what you get.' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Suruwe: What you ordered is what you get.',
    description: 'Send your tailor your measurements, photos, and fit notes in one link. No more wahala.',
    images: [OG_IMAGE],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#1e1a16',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
