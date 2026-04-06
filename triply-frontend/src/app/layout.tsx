import type { Metadata, Viewport } from 'next';
import { Montserrat } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/layout/Providers';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { FloatingWhatsAppCallback } from '@/components/layout/FloatingWhatsAppCallback';
import { Toaster } from '@/components/ui/toaster';

const APP_BASE_URL = (process.env.NEXT_PUBLIC_APP_URL || 'https://www.triplysquads.com').replace(/\/$/, '');
const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'TR✨PLY',
  url: APP_BASE_URL,
};

const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-montserrat',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700', '800'],
});

export const metadata: Metadata = {
  metadataBase: new URL(APP_BASE_URL),
  icons: {
    icon: [{ url: '/images/triply-logo.png', type: 'image/png' }],
    apple: [{ url: '/images/triply-logo.png', type: 'image/png' }],
  },
  title: 'TR✨PLY — Reserve Your Next Adventure for AED 199',
  description: 'TR✨PLY is a travel community platform. Book your dream destinations with a small deposit. Unlock your calendar for a full year of adventure.',
  keywords: ['travel', 'booking', 'destinations', 'vacation', 'holidays', 'travel community', 'Stripe', 'Tamara', 'Tabby'],
  manifest: '/manifest.json',
  applicationName: 'TR✨PLY',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'TR✨PLY',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    title: 'TR✨PLY — Reserve Your Next Adventure for AED 199',
    description: 'TR✨PLY is a travel community platform. Book with a small deposit and travel when you\'re ready.',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'TR✨PLY — Reserve Your Next Adventure for AED 199',
    description: 'Book your dream destinations with a small deposit. Unlock your calendar for a full year of adventure.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: '#18181b',
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
          <script
            type="application/ld+json"
            // JSON-LD must be present in the initial HTML for best SEO results.
            dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
          />
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <FloatingWhatsAppCallback />
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
