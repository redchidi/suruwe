import type { Metadata, Viewport } from 'next';
import { Analytics } from '@vercel/analytics/react';
import './globals.css';

const OG_IMAGE = 'https://suruwe.com/og-image.png';

export const metadata: Metadata = {
  title: 'Suruwe: What you ordered is what you get.',
  description:
    'Send your tailor your measurements, photos, and fit notes in one link. No more wahala.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Suruwe',
  },
  openGraph: {
    title: 'Suruwe: What you ordered is what you get.',
    description:
      'Send your tailor your measurements, photos, and fit notes in one link. No more wahala.',
    type: 'website',
    siteName: 'Suruwe',
    url: 'https://suruwe.com',
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: 'Suruwe: What you ordered is what you get.',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Suruwe: What you ordered is what you get.',
    description:
      'Send your tailor your measurements, photos, and fit notes in one link. No more wahala.',
    images: [OG_IMAGE],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#1e1a16',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body>
        {children}
        <Analytics />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js');
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
