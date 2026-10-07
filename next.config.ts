import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Lets a verification build run beside "npm run dev" without sharing .next.
  distDir: process.env.NEXT_DIST_DIR || '.next',
};

export default nextConfig;
