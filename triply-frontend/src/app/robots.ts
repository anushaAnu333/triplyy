const APP_BASE_URL = (process.env.NEXT_PUBLIC_APP_URL || 'https://www.triplysquads.com').replace(/\/$/, '');

export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/login',
          '/register',
          '/forgot-password',
          '/reset-password',
          '/verify-email',
          '/admin',
          '/affiliate',
          '/user',
        ],
      },
    ],
    sitemap: `${APP_BASE_URL}/sitemap.xml`,
  };
}

