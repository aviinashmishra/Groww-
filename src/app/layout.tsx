import type { Metadata, Viewport } from 'next';
import { Urbanist, Poppins } from 'next/font/google';
import { StoreProvider } from '@/lib/store';
import { Pwa } from '@/components/Pwa';
import { Offline } from '@/components/Offline';
import { PhoneFrame } from '@/components/PhoneFrame';
import './globals.css';

// Urbanist (variable 100–900, roman + italic), self-hosted by next/font from Google Fonts.
const urbanist = Urbanist({ subsets: ['latin', 'latin-ext'], style: ['normal', 'italic'], variable: '--font-urbanist', display: 'swap' });
const poppins = Poppins({ subsets: ['latin', 'devanagari'], weight: ['400', '500', '600'], variable: '--font-poppins', display: 'swap' });

export const metadata: Metadata = {
  title: 'Groww for Gen Z',
  description: 'Runway, goal pots, a crash simulator and honest odds. Money for your first paycheck, pocket money or gig income.',
  applicationName: 'Groww for Gen Z',
  icons: { icon: '/icon.svg', apple: '/icon-192.png' },
  appleWebApp: { capable: true, title: 'Groww Z', statusBarStyle: 'default' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F4F8F7' },
    { media: '(prefers-color-scheme: dark)', color: '#0A1012' },
  ],
};

// Applies the saved theme before first paint so there is no light flash in dark mode.
const themeScript = `(function(){try{var s=JSON.parse(localStorage.getItem('gz-theme')||'{}');var t=s.theme||'light';if(t==='auto'){t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}document.documentElement.dataset.theme=t;document.documentElement.dataset.lite=String(!!s.lite)}catch(e){}})()`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" className={`${urbanist.variable} ${poppins.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <PhoneFrame>
          <StoreProvider>{children}</StoreProvider>
          <Pwa />
          <Offline />
        </PhoneFrame>
      </body>
    </html>
  );
}
