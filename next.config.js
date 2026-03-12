/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  async redirects() {
    return [
      // Old order links: /slug/order/orderId  →  /en/slug/order/orderId
      {
        source: '/:profileId/order/:orderId',
        destination: '/en/:profileId/order/:orderId',
        permanent: false,
      },
      // Old card links: /slug/card  →  /en/slug/card
      {
        source: '/:profileId/card',
        destination: '/en/:profileId/card',
        permanent: false,
      },
      // Old profile links: /slug  →  /en/slug
      // Excludes top-level Next.js/Vercel paths and the two locales themselves
      {
        source: '/:profileId((?!en|fr|api|_next|_vercel|\.)[^/]+)',
        destination: '/en/:profileId',
        permanent: false,
      },
    ];
  },
};

module.exports = nextConfig;
