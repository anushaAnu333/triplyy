/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com', pathname: '/**' },
      { protocol: 'https', hostname: 'images.unsplash.com', pathname: '/**' },
    ],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1',
    NEXT_PUBLIC_STRIPE_PUBLIC_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY || '',
    NEXT_PUBLIC_DEPOSIT_AMOUNT: process.env.NEXT_PUBLIC_DEPOSIT_AMOUNT || '199',
    NEXT_PUBLIC_CURRENCY: process.env.NEXT_PUBLIC_CURRENCY || 'AED',
    /** Package pages: enquiry bar (AFC-style). WhatsApp: country + number without + e.g. 971525163595 */
    NEXT_PUBLIC_ENQUIRY_PHONE: process.env.NEXT_PUBLIC_ENQUIRY_PHONE || '',
    NEXT_PUBLIC_ENQUIRY_EMAIL: process.env.NEXT_PUBLIC_ENQUIRY_EMAIL || '',
    NEXT_PUBLIC_ENQUIRY_WHATSAPP: process.env.NEXT_PUBLIC_ENQUIRY_WHATSAPP || '',
  },
};

// Disable PWA in CI to avoid next-pwa page collection errors with Next 14 App Router
const pwaDisabled = process.env.CI === 'true' || process.env.NODE_ENV === 'development';
const withPWA = require('@ducanh2912/next-pwa').default({
  dest: 'public',
  disable: pwaDisabled,
  cacheOnFrontendNav: true,
  fallbacks: {
    document: '/~offline',
  },
});

module.exports = withPWA(nextConfig);

