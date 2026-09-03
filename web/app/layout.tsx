import type { Metadata, Viewport } from 'next';
import { ToastProvider } from '@/components/ui/ToastProvider';
import './globals.css';
import './tokens.css';
import './carousel.css';
import './design-system.css';
import './motion.css';

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
      <body>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
