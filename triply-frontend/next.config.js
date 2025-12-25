/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['res.cloudinary.com', 'images.unsplash.com'],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1',
    NEXT_PUBLIC_STRIPE_PUBLIC_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY || '',
    NEXT_PUBLIC_DEPOSIT_AMOUNT: process.env.NEXT_PUBLIC_DEPOSIT_AMOUNT || '199',
    NEXT_PUBLIC_CURRENCY: process.env.NEXT_PUBLIC_CURRENCY || 'AED',
  },
};

module.exports = nextConfig;

