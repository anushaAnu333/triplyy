import type { Metadata } from 'next';
import { Montserrat } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/layout/Providers';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Toaster } from '@/components/ui/toaster';

const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-montserrat',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700', '800'],
});

export const metadata: Metadata = {
  title: 'TRIPLY - Discover the World\'s Most Beautiful Places',
  description: 'Book your dream destinations with just AED 199 deposit. Unlock your calendar for a full year of adventure. Curated travel experiences to the most stunning places on Earth.',
  keywords: ['travel', 'booking', 'destinations', 'vacation', 'holidays', 'Maldives', 'Bali', 'Switzerland', 'travel deals'],
  openGraph: {
    title: 'TRIPLY - Discover the World\'s Most Beautiful Places',
    description: 'Book your dream destinations with just AED 199 deposit. Unlock your calendar for a full year of adventure.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={montserrat.variable}>
      <body className="min-h-screen flex flex-col font-sans antialiased">
        <Providers>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
