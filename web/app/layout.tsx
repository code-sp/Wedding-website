import type { Metadata } from 'next';
import './globals.css';
import './carousel.css';

export const metadata: Metadata = {
  title: 'Sweta & Shivpujan Wedding',
  description: 'A premium Mithila-inspired wedding experience with RSVP, seating and accommodation.'
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
