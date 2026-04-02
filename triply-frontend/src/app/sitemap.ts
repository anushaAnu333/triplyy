const APP_BASE_URL = (process.env.NEXT_PUBLIC_APP_URL || 'https://www.triplysquads.com').replace(/\/$/, '');

type SitemapEntry = {
  url: string;
  lastModified?: string | Date;
  changeFrequency?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
};

export default function sitemap(): SitemapEntry[] {
  const now = new Date().toISOString();

  const urls: SitemapEntry[] = [
    { url: `${APP_BASE_URL}/`, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${APP_BASE_URL}/destinations`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${APP_BASE_URL}/packages`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${APP_BASE_URL}/activities`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${APP_BASE_URL}/about`, lastModified: now, changeFrequency: 'yearly', priority: 0.6 },
    { url: `${APP_BASE_URL}/contact`, lastModified: now, changeFrequency: 'yearly', priority: 0.6 },
    { url: `${APP_BASE_URL}/become-merchant`, lastModified: now, changeFrequency: 'yearly', priority: 0.5 },
    { url: `${APP_BASE_URL}/become-merchant/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${APP_BASE_URL}/referral-partner`, lastModified: now, changeFrequency: 'yearly', priority: 0.5 },
    { url: `${APP_BASE_URL}/referral-partner/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${APP_BASE_URL}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${APP_BASE_URL}/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${APP_BASE_URL}/cancellation`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${APP_BASE_URL}/refund`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
  ];

  return urls;
}

