import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Groww for Gen Z',
    short_name: 'Groww Z',
    description: 'Runway, goal pots, a crash simulator and honest odds.',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#F4F8F7',
    theme_color: '#00D09C',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' },
    ],
    shortcuts: [
      { name: 'Invest', url: '/invest' },
      { name: 'Check a tip', url: '/tips' },
      { name: 'Your week', url: '/recap' },
      { name: 'Send a shagun', url: '/shagun' },
    ],
  };
}
