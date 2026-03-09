import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Refund Policy | TR✨PLY',
  description: 'TR✨PLY refund policy: when refunds are available and how to request them. Compliant with Stripe, Tamara, and Tabby.',
};

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50 pt-24">
      <div className="container mx-auto px-4 py-16 max-w-3xl">
        <h1 className="text-4xl font-bold text-black mb-2">Refund Policy</h1>
        <p className="text-gray-600 mb-10">Last updated: March 2026</p>

        <div className="prose prose-gray max-w-none space-y-6 text-gray-700">
          <section>
            <h2 className="text-xl font-semibold text-black mt-8 mb-2">1. Overview</h2>
            <p>
              TR✨PLY is a travel community platform where customers pay a deposit to reserve a trip. This policy explains when refunds are possible, how to request them, and how long processing takes.
            </p>
            <p>
              This policy applies to all payments made through TR✨PLY, including those processed via Stripe, Tamara, and Tabby.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-black mt-8 mb-2">2. When Refunds Are Available</h2>
            <p>
              Refunds may be considered in the following situations:
            </p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Your booking is cancelled by TR✨PLY or the travel provider (e.g. trip no longer available).</li>
              <li>Your booking is rejected by our team and no alternative dates are possible.</li>
              <li>Exceptional circumstances as determined by TR✨PLY in line with our Terms of Service.</li>
            </ul>
            <p className="mt-2">
              Refunds are not automatically guaranteed for change of mind or voluntary cancellation after your deposit has been paid. Each request is reviewed on a case-by-case basis.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-black mt-8 mb-2">3. How to Request a Refund</h2>
            <p>
              To request a refund, contact us with your booking reference and reason:
            </p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li><strong>Email:</strong> <a href="mailto:hello@triplysquads.com" className="text-brand-orange hover:underline">hello@triplysquads.com</a></li>
              <li><strong>Phone:</strong> +971 52 516 3595</li>
            </ul>
            <p className="mt-2">
              Include your full name, booking reference (e.g. TRP-YYYYMMDD-XXXXX), and a clear explanation. We aim to respond within 2–5 business days.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-black mt-8 mb-2">4. Refund Processing Times by Payment Method</h2>
            <p>
              If your refund is approved, processing times depend on your payment method:
            </p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li><strong>Credit/Debit Card (via Stripe):</strong> 5–10 business days from approval, plus an additional 5–14 business days depending on your bank or card issuer.</li>
              <li><strong>Tamara (Buy Now, Pay Later):</strong> Once TR✨PLY confirms the refund, Tamara will update your payment plan and refund to your linked card within 30 days, per Tamara&apos;s terms.</li>
              <li><strong>Tabby (Buy Now, Pay Later):</strong> Once TR✨PLY registers the refund with Tabby, remaining installments are adjusted or cancelled and any amount already paid is refunded to your card within 5–7 business days.</li>
            </ul>
            <p className="mt-2">
              <strong>Note:</strong> For BNPL refunds (Tamara/Tabby): if the refund is less than remaining installments, payments are adjusted. If the refund exceeds remaining installments, future payments are cancelled and the surplus is refunded to your card.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-black mt-8 mb-2">5. Non-Refundable Situations</h2>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Voluntary cancellation after deposit payment where no exceptional circumstances apply.</li>
              <li>No-shows or failure to select travel dates within the calendar unlock period.</li>
              <li>Third-party fees charged by Stripe, Tamara, or Tabby are not covered by TR✨PLY and are subject to the respective provider&apos;s own terms.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-black mt-8 mb-2">6. Chargebacks and Disputes</h2>
            <p>
              We encourage customers to contact us at <a href="mailto:hello@triplysquads.com" className="text-brand-orange hover:underline">hello@triplysquads.com</a> before initiating a chargeback with their bank or payment provider. Most issues can be resolved directly. Initiating a chargeback without contacting us first may result in suspension of your booking and TR✨PLY account while the dispute is reviewed.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-black mt-8 mb-2">7. Questions</h2>
            <p>
              For any questions about this refund policy, contact us at <a href="mailto:hello@triplysquads.com" className="text-brand-orange hover:underline">hello@triplysquads.com</a> or +971 52 516 3595.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200 flex flex-wrap gap-6">
          <Link href="/terms" className="text-brand-orange font-semibold hover:underline">Terms of Service</Link>
          <Link href="/cancellation" className="text-brand-orange font-semibold hover:underline">Cancellation Policy</Link>
          <Link href="/contact" className="text-brand-orange font-semibold hover:underline">Contact Us</Link>
        </div>
      </div>
    </div>
  );
}
