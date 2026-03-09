import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'About Us | TR✨PLY',
  description: 'TR✨PLY is a travel community platform. Travel. Connect. Repeat.',
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50 pt-24">
      <div className="container mx-auto px-4 py-16 max-w-3xl">
        <h1 className="text-4xl font-bold text-black mb-2">About TR✨PLY</h1>
        <p className="text-lg text-gray-600 mb-10">
          Travel. Connect. Repeat.
        </p>

        <div className="prose prose-gray max-w-none space-y-6 text-gray-700">
          <p className="text-lg">
            <strong>TR✨PLY</strong> is a travel community platform where customers explore destinations and reserve trips by paying a small deposit.
          </p>
          <p>
            We offer curated travel experiences to stunning destinations. Customers can secure their spot with a deposit (e.g. AED 199), unlock their calendar for up to one year, and choose their travel dates when they are ready. Our platform is designed for flexibility and peace of mind, with payments processed securely via Stripe, Tamara, and Tabby where offered.
          </p>
          <p>
            TR✨PLY is based in the UAE and serves travelers looking for simple, transparent, and secure ways to plan their next trip.
          </p>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-gray-600 mb-4">Need to get in touch?</p>
          <Link href="/contact" className="text-brand-orange font-semibold hover:underline">
            Contact us →
          </Link>
        </div>
      </div>
    </div>
  );
}
