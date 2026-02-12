import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
      },
      {
        protocol: 'https',
        hostname: 'keyhome.test',
      },
      {
        protocol: 'http',
        hostname: 'keyhome.test',
      },
      {
        protocol: 'https',
        hostname: '**.keyhome.cm',
      },
      {
        protocol: 'https',
        hostname: '**.keyhome.neocraft.dev',
      },
      {
        protocol: 'https',
        hostname: 'api.keyhome.neocraft.dev',
      },
    ],
  },
};

export default nextConfig;
