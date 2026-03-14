import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'About Us | TR✨PLY',
  description: 'TR✨PLY is a community-first travel brand. Reserve any trip with a small AED 199 deposit. Travel. Connect. Repeat.',
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50 pt-24">
      <div className="container mx-auto px-4 py-16 max-w-3xl">
        <h1 className="text-4xl font-bold text-black mb-2">We&apos;re TR✨PLY. And we&apos;re obsessed with group travel.</h1>
        <p className="text-lg text-gray-600 mb-10">
          Built in the UAE, for travelers who love the world.
        </p>

        <div className="prose prose-gray max-w-none space-y-6 text-gray-700">
          <p className="text-lg">
            TR✨PLY was born from a simple frustration: planning a trip with your squad is exhausting. Coordinating dates, collecting money, juggling WhatsApp groups — it&apos;s a lot. We wanted to make it easy.
          </p>
          <p>
            So we built TR✨PLY. A community-first travel brand where you can reserve any trip with a small AED 199 deposit, then pick your travel dates anytime within the next 12 months. No rush. No pressure. Just real adventures with real people.
          </p>
          <p>
            We&apos;re based in the UAE and we know this community. We know that life here is busy, plans change, and people still want to see the world. TR✨PLY fits around your life — not the other way around.
          </p>
          <p>
            TR✨PLY is founded by Musthafa and Edwin — two people who believe the best memories are made with good company.
          </p>
          <p className="font-medium">Travel. Connect. Repeat.</p>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-gray-600 mb-2">Ready to travel?</p>
          <p>
            <Link href="/destinations" className="text-brand-orange font-semibold hover:underline">
              Browse our trips →
            </Link>
            <span className="text-gray-500 mx-1">or</span>
            <Link href="/contact" className="text-brand-orange font-semibold hover:underline">
              Have a question? Say hi →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
