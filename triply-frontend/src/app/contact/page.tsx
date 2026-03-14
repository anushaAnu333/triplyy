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
        <h1 className="text-4xl font-bold text-black mb-2">Let&apos;s Talk.</h1>
        <p className="text-lg text-gray-600 mb-12">
          Got a question about a trip? Need help with a booking? We&apos;re real people and we actually reply.
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
                href="https://instagram.com/triply.squads"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-700 hover:text-brand-orange transition-colors"
              >
                @triply.squads
              </a>
            </div>
          </div>
        </div>

        <p className="mt-12 text-gray-500 text-sm">
          We usually reply within 24 hours. For faster help, message us on WhatsApp.
        </p>
        <p className="mt-2 text-gray-500 text-sm">
          💬 Prefer WhatsApp? Message us directly at <a href="https://wa.me/971525163595" className="text-brand-orange hover:underline">+971 52 516 3595</a> and we&apos;ll sort you out.
        </p>
      </div>
    </div>
  );
}
