import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Service | TR✨PLY',
  description: 'Terms of Service for using the TR✨PLY travel community platform.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 pt-24">
      <div className="container mx-auto px-4 py-16 max-w-3xl">
        <h1 className="text-4xl font-bold text-black mb-2">Terms of Service</h1>
        <p className="text-gray-600 mb-10">Last updated: March 2026</p>

        <div className="prose prose-gray max-w-none space-y-6 text-gray-700">
          <section>
            <h2 className="text-xl font-semibold text-black mt-8 mb-2">1. Agreement to Terms</h2>
            <p>
              Welcome to TR✨PLY. By accessing or using our website and services (&quot;Platform&quot;), you agree to be bound by these Terms of Service. If you do not agree, do not use the Platform. TR✨PLY (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) operates the travel community platform that allows customers to explore destinations and reserve trips by paying a small deposit.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-black mt-8 mb-2">2. Use of the Platform</h2>
            <p>
              You agree to use the Platform only for lawful purposes. You must not:
            </p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Provide false or misleading information.</li>
              <li>Use the Platform for fraud or unauthorized transactions.</li>
              <li>Attempt to gain unauthorized access to our systems or other accounts.</li>
              <li>Use the Platform in any way that could harm or overburden our services.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-black mt-8 mb-2">3. Bookings and Payment Terms</h2>
            <p>
              When you make a booking:
            </p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>You pay a deposit (e.g. AED 199) to secure your reservation. The amount may vary by destination.</li>
              <li>Payment is processed securely. Card payments are handled by Stripe. BNPL payments are handled by Tamara or Tabby where offered. We do not store your full card details.</li>
              <li>After paying the deposit, you typically have a period (e.g. one year) to select your travel dates, subject to availability.</li>
              <li>Your booking is subject to confirmation by TR✨PLY or the travel provider. We will notify you of the status.</li>
            </ul>
            <p className="mt-2">
              Refunds and cancellations are governed by our <Link href="/refund" className="text-brand-orange hover:underline">Refund Policy</Link> and <Link href="/cancellation" className="text-brand-orange hover:underline">Cancellation Policy</Link>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-black mt-8 mb-2">4. Payment Providers</h2>
            <p>
              TR✨PLY uses the following third-party payment providers:
            </p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li><strong>Stripe:</strong> for card payments. By paying via Stripe, you agree to Stripe&apos;s terms at stripe.com/legal. TR✨PLY maintains a fair and transparent refund policy as required by Stripe&apos;s merchant terms.</li>
              <li><strong>Tamara:</strong> a Buy Now, Pay Later (BNPL) service available in the UAE. By selecting Tamara at checkout, you enter into a separate agreement with Tamara subject to their terms at tamara.co. TR✨PLY is not responsible for Tamara&apos;s credit decisions or their separate fees.</li>
              <li><strong>Tabby:</strong> a Buy Now, Pay Later (BNPL) service available in the UAE. By selecting Tabby at checkout, you enter into a separate agreement with Tabby subject to their terms at tabby.ai. TR✨PLY is not responsible for Tabby&apos;s credit decisions or their separate fees.</li>
            </ul>
            <p className="mt-2">
              <strong>Note:</strong> BNPL services (Tamara/Tabby) are subject to eligibility approval by the respective provider. TR✨PLY does not guarantee availability of BNPL options for all customers or transactions.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-black mt-8 mb-2">5. Promotions and Referral Program</h2>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Additional terms may apply to each promotion; these will be stated where the offer is made.</li>
              <li>Abuse of promotions or referral codes (e.g. self-referral, fraud) may result in cancellation of bookings and suspension of your account.</li>
              <li>We reserve the right to modify or discontinue promotions with reasonable notice.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-black mt-8 mb-2">6. Limitation of Liability</h2>
            <p>
              To the fullest extent permitted by law:
            </p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>TR✨PLY is provided &quot;as is&quot;. We do not guarantee uninterrupted or error-free service.</li>
              <li>Our liability for any claim shall not exceed the amount you paid us for the relevant booking.</li>
              <li>We are not liable for indirect, incidental, or consequential damages, except where exclusion is not permitted by law.</li>
              <li>Travel involves inherent risks. We are not liable for events outside our control (weather, force majeure, acts of authorities).</li>
              <li>TR✨PLY is not liable for decisions, fees, or actions taken by Stripe, Tamara, or Tabby.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-black mt-8 mb-2">7. Intellectual Property</h2>
            <p>
              The TR✨PLY name, logo, and all content on the Platform are owned by us or our licensors. You may not copy, modify, or use them without our written permission.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-black mt-8 mb-2">8. Changes to Terms</h2>
            <p>
              We may update these Terms from time to time. The &quot;Last updated&quot; date will change. Continued use of the Platform after changes constitutes acceptance.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-black mt-8 mb-2">9. Contact</h2>
            <p>
              For questions about these Terms: Email <a href="mailto:hello@triplysquads.com" className="text-brand-orange hover:underline">hello@triplysquads.com</a> or call +971 52 516 3595.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200 flex flex-wrap gap-6">
          <Link href="/privacy" className="text-brand-orange font-semibold hover:underline">Privacy Policy</Link>
          <Link href="/refund" className="text-brand-orange font-semibold hover:underline">Refund Policy</Link>
          <Link href="/cancellation" className="text-brand-orange font-semibold hover:underline">Cancellation Policy</Link>
          <Link href="/contact" className="text-brand-orange font-semibold hover:underline">Contact Us</Link>
        </div>
      </div>
    </div>
  );
}
