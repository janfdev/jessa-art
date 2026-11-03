import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Jessa Wolfe · Pixel Pusher',
  description: "Hi, I'm Jessa. I create delightful experiences, build and grow design teams, and chase problems worth solving.",
  icons: {
    icon: [
      { url: '/image/favicon.svg?v=2', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: '48x48' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="color-scheme" content="only light" />
        <script src="/favfloat.js?v=2" defer />
      </head>
      <body>
        <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
          <filter id="wobs" x="-10%" y="-20%" width="120%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.03 0.05" numOctaves={2} seed={11} result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale={3} xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </svg>
        {children}
      </body>
    </html>
  );
}
