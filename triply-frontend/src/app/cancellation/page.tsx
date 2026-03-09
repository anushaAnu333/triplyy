import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Cancellation Policy | TR✨PLY',
  description: 'TR✨PLY cancellation policy for bookings and reservations. Applies to Stripe, Tamara, and Tabby payments.',
};

export default function CancellationPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50 pt-24">
      <div className="container mx-auto px-4 py-16 max-w-3xl">
        <h1 className="text-4xl font-bold text-black mb-2">Cancellation Policy</h1>
        <p className="text-gray-600 mb-10">Last updated: March 2026</p>

        <div className="prose prose-gray max-w-none space-y-6 text-gray-700">
          <section>
            <h2 className="text-xl font-semibold text-black mt-8 mb-2">1. Applicability</h2>
            <p>
              This cancellation policy applies to all trip reservations and bookings made through TR✨PLY, including those paid via Stripe, Tamara, or Tabby. By making a booking, you agree to these terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-black mt-8 mb-2">2. Cancellation by You (Customer)</h2>
            <p>
              If you wish to cancel your reservation:
            </p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li><strong>Before paying the deposit:</strong> No cancellation is needed; the reservation is not confirmed until the deposit is paid.</li>
              <li><strong>After paying the deposit:</strong> Contact us as soon as possible at <a href="mailto:hello@triplysquads.com" className="text-brand-orange hover:underline">hello@triplysquads.com</a> or +971 52 516 3595 with your booking reference. Refunds are subject to our <Link href="/refund" className="text-brand-orange hover:underline">Refund Policy</Link>.</li>
              <li><strong>For bookings paid via Tamara or Tabby:</strong> Cancellations must be submitted to TR✨PLY directly. We will inform the relevant BNPL provider. Do not cancel through the BNPL app without notifying us first, as this may affect your booking status.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-black mt-8 mb-2">3. Cancellation by TR✨PLY</h2>
            <p>
              We may cancel a booking in limited circumstances, including:
            </p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>The trip or destination is no longer available.</li>
              <li>Force majeure (e.g. natural disaster, pandemic, safety issues).</li>
              <li>Violation of our Terms of Service or fraud.</li>
              <li>Operational reasons with reasonable notice where possible.</li>
            </ul>
            <p className="mt-2">
              If we cancel your booking, we will contact you and offer a refund or alternative dates in line with our Refund Policy. For BNPL payments, we will notify Tamara or Tabby to update or cancel your payment plan accordingly.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-black mt-8 mb-2">4. No-Show and Unused Bookings</h2>
            <p>
              If you do not show up for your trip or do not select dates within your calendar unlock period without contacting us, your deposit may be forfeited. Outstanding BNPL installments (Tamara/Tabby) remain due regardless of trip usage, as TR✨PLY has already settled with the provider. Please contact us if your plans change before your travel date.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-black mt-8 mb-2">5. Contact</h2>
            <p>
              For cancellation requests: Email <a href="mailto:hello@triplysquads.com" className="text-brand-orange hover:underline">hello@triplysquads.com</a> or call +971 52 516 3595. Please include your booking reference and payment method used.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200 flex flex-wrap gap-6">
          <Link href="/refund" className="text-brand-orange font-semibold hover:underline">Refund Policy</Link>
          <Link href="/terms" className="text-brand-orange font-semibold hover:underline">Terms of Service</Link>
          <Link href="/contact" className="text-brand-orange font-semibold hover:underline">Contact Us</Link>
        </div>
      </div>
    </div>
  );
}
