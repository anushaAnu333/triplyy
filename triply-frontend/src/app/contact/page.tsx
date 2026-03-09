import type { Metadata } from 'next';
import { Mail, Phone, MapPin, Instagram, Headphones } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Contact Us | TR✨PLY',
  description: 'Contact TR✨PLY for support, bookings, payments, or any questions. We are here to help.',
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gray-50 pt-24">
      <div className="container mx-auto px-4 py-16 max-w-3xl">
        <h1 className="text-4xl font-bold text-black mb-2">Contact Us</h1>
        <p className="text-lg text-gray-600 mb-12">
          Get in touch with TR✨PLY. We&apos;re here to help with bookings, payments, support, or any questions.
        </p>

        <div className="space-y-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-brand-orange/10 flex items-center justify-center flex-shrink-0">
              <Mail className="w-6 h-6 text-brand-orange" />
            </div>
            <div>
              <h2 className="font-semibold text-black mb-1">Email</h2>
              <a href="mailto:hello@triplysquads.com" className="text-gray-700 hover:text-brand-orange transition-colors">
                hello@triplysquads.com
              </a>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-brand-orange/10 flex items-center justify-center flex-shrink-0">
              <Headphones className="w-6 h-6 text-brand-orange" />
            </div>
            <div>
              <h2 className="font-semibold text-black mb-1">Support</h2>
              <a href="mailto:support@triplysquads.com" className="text-gray-700 hover:text-brand-orange transition-colors">
                support@triplysquads.com
              </a>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-brand-orange/10 flex items-center justify-center flex-shrink-0">
              <Phone className="w-6 h-6 text-brand-orange" />
            </div>
            <div>
              <h2 className="font-semibold text-black mb-1">Phone</h2>
              <a href="tel:+971525163595" className="text-gray-700 hover:text-brand-orange transition-colors">
                +971 52 516 3595
              </a>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-brand-orange/10 flex items-center justify-center flex-shrink-0">
              <MapPin className="w-6 h-6 text-brand-orange" />
            </div>
            <div>
              <h2 className="font-semibold text-black mb-1">Location</h2>
              <p className="text-gray-700">UAE</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-brand-orange/10 flex items-center justify-center flex-shrink-0">
              <Instagram className="w-6 h-6 text-brand-orange" />
            </div>
            <div>
              <h2 className="font-semibold text-black mb-1">Instagram</h2>
              <a
                href="https://instagram.com/triply.squad"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-700 hover:text-brand-orange transition-colors"
              >
                @triply.squad
              </a>
            </div>
          </div>
        </div>

        <p className="mt-12 text-gray-500 text-sm">
          We aim to respond to all enquiries within 24–48 hours during business days.
        </p>
        <p className="mt-2 text-gray-500 text-sm">
          For payment-related disputes or questions about Stripe, Tamara, or Tabby transactions, please include your booking reference and payment method when contacting us.
        </p>
      </div>
    </div>
  );
}
