import type { Metadata, Viewport } from 'next';
import './tokens.css';
import './globals.css';
import './carousel.css';
import './design-system.css';

export const metadata: Metadata = {
  title: 'Sweta & Shivpujan Wedding',
  description: 'A premium Mithila-inspired wedding experience with RSVP, seating and accommodation.'
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover'
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
