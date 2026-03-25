import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // output: 'export', // Commented out to prevent NEXT_STATIC_GEN_BAILOUT during dev
  images: {
    unoptimized: true,
  },
};

export default nextConfig;