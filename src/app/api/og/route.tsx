import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get('name') || 'Customer';
  const description = searchParams.get('description') || 'Custom Order';
  const tailor = searchParams.get('tailor') || '';
  const measurements = searchParams.get('measurements') || '0';
  const photos = searchParams.get('photos') || '0';
  const type = searchParams.get('type') || 'order'; // 'order' or 'profile'

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: '#0C0C0C',
          fontFamily: 'Georgia, serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Subtle pattern overlay */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'radial-gradient(circle at 20% 80%, rgba(200, 149, 108, 0.08) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(200, 149, 108, 0.05) 0%, transparent 50%)',
            display: 'flex',
          }}
        />

        {/* Top accent bar */}
        <div
          style={{
            height: '4px',
            background: 'linear-gradient(90deg, #C8956C, #D4A57D, #C8956C)',
            width: '100%',
            display: 'flex',
          }}
        />

        {/* Content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            padding: '48px 56px',
            flex: 1,
            justifyContent: 'space-between',
          }}
        >
          {/* Top section */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {/* Logo */}
            <div
              style={{
                fontSize: 24,
                color: '#C8956C',
                letterSpacing: '-0.02em',
                fontWeight: 600,
                marginBottom: 40,
                display: 'flex',
              }}
            >
              Suruwe
            </div>

            {/* Customer name */}
            <div
              style={{
                fontSize: 52,
                color: '#F0EDE8',
                fontWeight: 500,
                letterSpacing: '-0.02em',
                lineHeight: 1.1,
                marginBottom: 12,
                display: 'flex',
              }}
            >
              {type === 'order' ? `${name}'s Order` : `${name}`}
            </div>

            {/* Description */}
            <div
              style={{
                fontSize: 28,
                color: '#C8956C',
                lineHeight: 1.3,
                marginBottom: 32,
                display: 'flex',
              }}
            >
              {description}
            </div>

            {/* Tailor */}
            {tailor && (
              <div
                style={{
                  fontSize: 20,
                  color: '#9A958E',
                  display: 'flex',
                }}
              >
                For {tailor}
              </div>
            )}
          </div>

          {/* Bottom section: stats + CTA */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
            }}
          >
            {/* Stats pills */}
            <div style={{ display: 'flex', gap: 16 }}>
              {parseInt(measurements) > 0 && (
                <div
                  style={{
                    background: 'rgba(200, 149, 108, 0.12)',
                    borderRadius: 24,
                    padding: '10px 20px',
                    fontSize: 16,
                    color: '#C8956C',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  📐 {measurements} measurements
                </div>
              )}
              {parseInt(photos) > 0 && (
                <div
                  style={{
                    background: 'rgba(200, 149, 108, 0.12)',
                    borderRadius: 24,
                    padding: '10px 20px',
                    fontSize: 16,
                    color: '#C8956C',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  📷 {photos} photos
                </div>
              )}
            </div>

            {/* CTA */}
            <div
              style={{
                fontSize: 16,
                color: '#6B6560',
                display: 'flex',
              }}
            >
              Tap to view full details →
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
